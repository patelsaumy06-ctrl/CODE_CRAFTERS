import { pipeline } from "../services/processingPipeline.js";
import { SOURCE_TYPES, SYNC_STATUS, FRESHNESS_CONFIG, getRollingDateWindow, isWithinDateWindow } from "../config/constants.js";
import { fetchRecentEarthquakes } from "../ingestion/external/usgsService.js";
import { fetchAlerts } from "../ingestion/external/gdacsService.js";
import { fetchRecentEvents } from "../ingestion/external/eonetService.js";
import { searchDisasterNews } from "../ingestion/external/gdeltService.js";
import { fetchDisasterReports } from "../ingestion/external/reliefWebService.js";
import { processedArticles } from "../utils/processedArticles.js";
import { relevanceFilter } from "../ai/relevanceFilter.js";
import { getDb } from "../config/firebase.js";
import { COLLECTIONS } from "../config/constants.js";

/**
 * Background Ingestion Worker — DisasterLens AI
 *
 * Periodically polls external data sources (GDACS as primary, USGS, NASA EONET, GDELT, ReliefWeb)
 * and maintains authentic multi-source data provenance, freshness, and rolling three-day window tracking.
 */
export class IngestionWorker {
  constructor() {
    this.running = false;
    this.startedAt = null;
    this.timers = new Map();
    this.locks = new Map();

    // Default configuration (intervals & retry settings)
    this.config = {
      enabled: process.env.INGESTION_WORKER_ENABLED !== "false",
      maxRetries: parseInt(process.env.INGESTION_MAX_RETRIES, 10) || 2,
      baseBackoffMs: parseInt(process.env.INGESTION_BACKOFF_BASE_MS, 10) || 1000,
      timeoutMs: parseInt(process.env.INGESTION_REQUEST_TIMEOUT_MS, 10) || 30000,
      intervals: {
        gdacs: parseInt(process.env.GDACS_INTERVAL_MS, 10) || 5 * 60 * 1000,      // 5 min (GDACS refreshes ~6 min)
        usgs: parseInt(process.env.USGS_INTERVAL_MS, 10) || 5 * 60 * 1000,        // 5 min
        eonet: parseInt(process.env.EONET_INTERVAL_MS, 10) || 10 * 60 * 1000,     // 10 min
        gdelt: parseInt(process.env.GDELT_INTERVAL_MS, 10) || 30 * 1000,          // 30 seconds
        reliefweb: parseInt(process.env.RELIEFWEB_INTERVAL_MS, 10) || 30 * 60 * 1000, // 30 min
      },
    };

    // Service state tracking
    this.services = {
      gdacs: {
        name: "GDACS Global Alerts",
        sourceType: SOURCE_TYPES.GDACS,
        intervalMs: this.config.intervals.gdacs,
        freshnessWindowMs: FRESHNESS_CONFIG.GDACS_WINDOW_MS,
        fetcher: () => fetchAlerts(),
        status: "idle",
        lastRun: null,
        lastSuccess: null,
        lastFailure: null,
        lastSourceUpdate: null,
        nextRun: null,
        successCount: 0,
        failureCount: 0,
        eventsProcessed: 0,
        lastError: null,
      },
      usgs: {
        name: "USGS Earthquakes",
        sourceType: SOURCE_TYPES.USGS,
        intervalMs: this.config.intervals.usgs,
        freshnessWindowMs: FRESHNESS_CONFIG.USGS_WINDOW_MS,
        fetcher: () => fetchRecentEarthquakes("2.5_day"),
        status: "idle",
        lastRun: null,
        lastSuccess: null,
        lastFailure: null,
        lastSourceUpdate: null,
        nextRun: null,
        successCount: 0,
        failureCount: 0,
        eventsProcessed: 0,
        lastError: null,
      },
      eonet: {
        name: "NASA EONET Events",
        sourceType: SOURCE_TYPES.EONET,
        intervalMs: this.config.intervals.eonet,
        freshnessWindowMs: FRESHNESS_CONFIG.EONET_WINDOW_MS,
        fetcher: () => fetchRecentEvents({ status: "open", limit: 30 }),
        status: "idle",
        lastRun: null,
        lastSuccess: null,
        lastFailure: null,
        lastSourceUpdate: null,
        nextRun: null,
        successCount: 0,
        failureCount: 0,
        eventsProcessed: 0,
        lastError: null,
      },
      gdelt: {
        name: "GDELT News Monitor",
        sourceType: SOURCE_TYPES.GDELT,
        intervalMs: this.config.intervals.gdelt,
        freshnessWindowMs: FRESHNESS_CONFIG.GDELT_WINDOW_MS,
        fetcher: () => searchDisasterNews({ maxRecords: 15 }),
        status: "idle",
        lastRun: null,
        lastSuccess: null,
        lastFailure: null,
        lastSourceUpdate: null,
        nextRun: null,
        successCount: 0,
        failureCount: 0,
        eventsProcessed: 0,
        lastError: null,
      },
      reliefweb: {
        name: "ReliefWeb Reports",
        sourceType: SOURCE_TYPES.RELIEFWEB,
        intervalMs: this.config.intervals.reliefweb,
        freshnessWindowMs: FRESHNESS_CONFIG.RELIEFWEB_WINDOW_MS,
        fetcher: () => fetchDisasterReports({ limit: 15 }),
        status: "idle",
        lastRun: null,
        lastSuccess: null,
        lastFailure: null,
        lastSourceUpdate: null,
        nextRun: null,
        successCount: 0,
        failureCount: 0,
        eventsProcessed: 0,
        lastError: null,
      },
    };
  }

  /**
   * Start the background ingestion worker and schedule all service timers.
   *
   * @param {Object} opts - { initialRun: true }
   */
  start({ initialRun = true } = {}) {
    if (!this.config.enabled) {
      console.log("[Ingestion Worker] Disabled via INGESTION_WORKER_ENABLED=false");
      return;
    }

    if (this.running) {
      console.warn("[Ingestion Worker] Already running.");
      return;
    }

    this.running = true;
    this.startedAt = new Date().toISOString();
    console.log("[Ingestion Worker] Starting live external ingestion service (GDACS primary, USGS secondary)...");

    for (const [key, svc] of Object.entries(this.services)) {
      const timer = setInterval(() => {
        this._executeService(key).catch((err) => {
          console.error(`[Ingestion Worker] Uncaught error in ${svc.name}:`, err.message);
        });
      }, svc.intervalMs);

      if (timer.unref) timer.unref();
      this.timers.set(key, timer);
      svc.nextRun = new Date(Date.now() + svc.intervalMs).toISOString();

      if (initialRun) {
        setTimeout(() => {
          this._executeService(key).catch((err) => {
            console.warn(`[Ingestion Worker] Initial live fetch warning for ${svc.name}:`, err.message);
          });
        }, 100);
      }
    }

    console.log("[Ingestion Worker] Live service poll timers active.");
  }

  /**
   * Stop the ingestion worker and clear all timers.
   */
  stop() {
    if (!this.running) return;

    for (const [key, timer] of this.timers.entries()) {
      clearInterval(timer);
    }
    this.timers.clear();
    this.running = false;

    for (const svc of Object.values(this.services)) {
      svc.status = "stopped";
      svc.nextRun = null;
    }

    console.log("[Ingestion Worker] Stopped successfully.");
  }

  /**
   * Run one or all services immediately (for manual refresh or on-demand sync).
   *
   * @param {string|null} serviceKey - e.g. "gdacs", "usgs", or null for all
   * @returns {Promise<Object>} Results map
   */
  async runOnce(serviceKey = null) {
    if (serviceKey) {
      if (!this.services[serviceKey]) {
        throw new Error(`Unknown ingestion service: ${serviceKey}`);
      }
      return { [serviceKey]: await this._executeService(serviceKey) };
    }

    const results = {};
    for (const key of Object.keys(this.services)) {
      results[key] = await this._executeService(key);
    }
    return results;
  }

  /**
   * Calculate exact sync status for a service.
   *
   * @param {string} key
   * @returns {string} One of SYNC_STATUS ("LIVE", "SYNCING", "STALE", "OFFLINE")
   */
  getServiceSyncStatus(key) {
    const svc = this.services[key];
    if (!svc) return SYNC_STATUS.OFFLINE;

    if (this.locks.get(key) || svc.status === "running") {
      return SYNC_STATUS.SYNCING;
    }

    if (!svc.lastSuccess) {
      return svc.lastFailure ? SYNC_STATUS.OFFLINE : SYNC_STATUS.SYNCING;
    }

    const ageMs = Date.now() - new Date(svc.lastSuccess).getTime();
    if (ageMs <= svc.freshnessWindowMs) {
      return SYNC_STATUS.HEALTHY; // "LIVE"
    }

    return SYNC_STATUS.STALE; // "STALE"
  }

  /**
   * Get production data provenance and multi-source health report.
   *
   * @param {number} days - Rolling calendar days window (default 3)
   * @returns {Promise<Object>}
   */
  async getProvenanceStatus(days = 3) {
    const now = Date.now();
    const dateWindow = getRollingDateWindow(days);

    const gdacsSync = this.getServiceSyncStatus("gdacs");
    const usgsSync = this.getServiceSyncStatus("usgs");
    const eonetSync = this.getServiceSyncStatus("eonet");

    const gdacsSvc = this.services.gdacs;
    const usgsSvc = this.services.usgs;

    // Calculate data age from latest successful sync
    const lastSyncTimes = [gdacsSvc.lastSuccess, usgsSvc.lastSuccess]
      .filter(Boolean)
      .map((t) => new Date(t).getTime());

    const latestSyncTime = lastSyncTimes.length > 0 ? Math.max(...lastSyncTimes) : null;
    const dataAgeMinutes = latestSyncTime ? Math.max(0, Math.round((now - latestSyncTime) / 60000)) : null;

    // Fetch current live incidents count from DB within the rolling 3-day window
    let currentLiveRecords = 0;
    let gdacsRecords = 0;
    let usgsRecords = 0;

    try {
      const db = getDb();
      const snap = await db.collection(COLLECTIONS.INCIDENTS).get();
      const allDocs = snap.docs.map((d) => d.data());

      const windowDocs = allDocs.filter((inc) => {
        const eventTime = inc.event_time || inc.source_updated_at;
        return isWithinDateWindow(eventTime, dateWindow) && (inc.application_status === "LIVE" || !inc.application_status);
      });

      currentLiveRecords = windowDocs.length;
      gdacsRecords = windowDocs.filter((d) => (d.source || "").toLowerCase().includes("gdacs")).length;
      usgsRecords = windowDocs.filter((d) => (d.source || "").toLowerCase().includes("usgs")).length;
    } catch {
      currentLiveRecords = 0;
    }

    const isPrimaryHealthy = gdacsSync === SYNC_STATUS.HEALTHY || usgsSync === SYNC_STATUS.HEALTHY;
    const isAnySyncing = gdacsSync === SYNC_STATUS.SYNCING || usgsSync === SYNC_STATUS.SYNCING;

    const overallStatus = isAnySyncing
      ? SYNC_STATUS.SYNCING
      : isPrimaryHealthy
      ? SYNC_STATUS.HEALTHY
      : (gdacsSync === SYNC_STATUS.STALE || usgsSync === SYNC_STATUS.STALE)
      ? SYNC_STATUS.STALE
      : SYNC_STATUS.OFFLINE;

    return {
      isLive: isPrimaryHealthy,
      overallStatus,
      currentRecords: currentLiveRecords,
      dataAgeMinutes,
      date_window: {
        days: dateWindow.days,
        start: dateWindow.start,
        end: dateWindow.end,
      },
      lastSynchronization: latestSyncTime ? new Date(latestSyncTime).toISOString() : null,
      sources: {
        gdacs: {
          name: "GDACS Global Alerts",
          status: gdacsSync,
          lastSuccess: gdacsSvc.lastSuccess,
          lastFailure: gdacsSvc.lastFailure,
          lastSourceUpdate: gdacsSvc.lastSourceUpdate,
          lastError: gdacsSvc.lastError,
          eventsProcessed: gdacsSvc.eventsProcessed,
          eventsInWindow: gdacsRecords,
        },
        usgs: {
          name: "USGS Earthquakes",
          status: usgsSync,
          lastSuccess: usgsSvc.lastSuccess,
          lastFailure: usgsSvc.lastFailure,
          lastSourceUpdate: usgsSvc.lastSourceUpdate,
          lastError: usgsSvc.lastError,
          eventsProcessed: usgsSvc.eventsProcessed,
          eventsInWindow: usgsRecords,
        },
        eonet: {
          name: "NASA EONET",
          status: eonetSync,
          lastSuccess: this.services.eonet.lastSuccess,
          eventsProcessed: this.services.eonet.eventsProcessed,
        },
      },
    };
  }

  /**
   * Get current worker and service health statuses.
   *
   * @returns {Object}
   */
  getStatus() {
    const servicesStatus = {};
    for (const [key, svc] of Object.entries(this.services)) {
      servicesStatus[key] = {
        name: svc.name,
        status: this.locks.get(key) ? "running" : svc.status,
        syncStatus: this.getServiceSyncStatus(key),
        intervalMs: svc.intervalMs,
        freshnessWindowMs: svc.freshnessWindowMs,
        lastRun: svc.lastRun,
        lastSuccess: svc.lastSuccess,
        lastFailure: svc.lastFailure,
        lastSourceUpdate: svc.lastSourceUpdate,
        nextRun: svc.nextRun,
        successCount: svc.successCount,
        failureCount: svc.failureCount,
        eventsProcessed: svc.eventsProcessed,
        lastError: svc.lastError,
      };
    }

    return {
      running: this.running,
      enabled: this.config.enabled,
      startedAt: this.startedAt,
      services: servicesStatus,
    };
  }

  /**
   * Execute a single service with overlap locking, retries, and non-destructive failure handling.
   *
   * @private
   */
  async _executeService(key) {
    const svc = this.services[key];
    if (!svc) return { success: false, error: "Service not found" };

    if (this.locks.get(key)) {
      console.log(`[Ingestion Worker] Skipping ${svc.name} — previous execution still running.`);
      return { success: false, skipped: true, reason: "Overlap prevention lock active" };
    }

    this.locks.set(key, true);
    svc.status = "running";
    svc.lastRun = new Date().toISOString();

    let attempt = 0;
    let rawEvents = [];
    let fetchError = null;

    while (attempt <= this.config.maxRetries) {
      try {
        rawEvents = await svc.fetcher();
        fetchError = null;
        break;
      } catch (err) {
        attempt++;
        fetchError = err;

        const isClientError = err.message && (err.message.includes("400") || err.message.includes("401") || err.message.includes("403") || err.message.includes("404"));
        if (isClientError || attempt > this.config.maxRetries) {
          break;
        }

        const backoffDelay = this.config.baseBackoffMs * Math.pow(2, attempt - 1);
        console.warn(`[Ingestion Worker] ${svc.name} attempt ${attempt}/${this.config.maxRetries} failed: ${err.message}. Retrying in ${backoffDelay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
      }
    }

    if (fetchError) {
      svc.status = "error";
      svc.lastError = fetchError.message;
      svc.lastFailure = {
        error: fetchError.message,
        timestamp: new Date().toISOString(),
      };
      svc.failureCount++;
      this.locks.set(key, false);
      if (this.running) {
        svc.nextRun = new Date(Date.now() + svc.intervalMs).toISOString();
      }
      console.warn(`[Ingestion Worker] ${svc.name} sync failed: ${fetchError.message}. Existing live records preserved unchanged.`);
      return { success: false, error: fetchError.message };
    }

    // Process batch through the Canonical Pipeline
    const events = Array.isArray(rawEvents) ? rawEvents : [];
    let processedCount = 0;
    let errorCount = 0;
    let latestSourceTimestamp = null;

    for (const rawItem of events) {
      try {
        if (!rawItem) continue;

        // Specific pre-pipeline filters for GDELT News
        if (key === "gdelt") {
          // 1. Duplicate Article Detection
          const alreadyProcessed = await processedArticles.isProcessed(rawItem);
          if (alreadyProcessed) {
            continue;
          }

          // 2. Disaster Relevance Filtering
          const relevance = relevanceFilter.evaluate(rawItem);
          if (!relevance.isDisasterRelated) {
            await processedArticles.markProcessed(rawItem, { skipped: true, reason: relevance.reason });
            continue;
          }

          rawItem.relevanceScore = relevance.relevanceScore;
          rawItem.disasterType = relevance.disasterType;
        }

        // Extract source update timestamp if present
        const itemTs = rawItem.pubDate || rawItem.toDate || rawItem.seendate || rawItem.properties?.updated || rawItem.properties?.time;
        if (itemTs) {
          const parsed = new Date(itemTs).getTime();
          if (!isNaN(parsed) && (!latestSourceTimestamp || parsed > latestSourceTimestamp)) {
            latestSourceTimestamp = parsed;
          }
        }

        const result = await pipeline.process(svc.sourceType, rawItem);
        if (result && result.success) {
          processedCount++;
          if (key === "gdelt") {
            await processedArticles.markProcessed(rawItem, { processed: true, incidentId: result.incidentId });
          }
        } else {
          errorCount++;
        }
      } catch (pipelineErr) {
        errorCount++;
        console.warn(`[Ingestion Worker] Error processing live event in ${svc.name}:`, pipelineErr.message);
      }
    }

    svc.status = "idle";
    svc.lastError = null;
    svc.lastSuccess = new Date().toISOString();
    if (latestSourceTimestamp) {
      svc.lastSourceUpdate = new Date(latestSourceTimestamp).toISOString();
    } else {
      svc.lastSourceUpdate = svc.lastSuccess;
    }
    svc.successCount++;
    svc.eventsProcessed += processedCount;
    this.locks.set(key, false);

    if (this.running) {
      svc.nextRun = new Date(Date.now() + svc.intervalMs).toISOString();
    }

    console.log(`[Ingestion Worker] ${svc.name} live sync complete: ${processedCount} processed, ${errorCount} errors.`);
    return {
      success: true,
      service: key,
      processed: processedCount,
      errors: errorCount,
    };
  }
}

export const ingestionWorker = new IngestionWorker();
export default ingestionWorker;
