import { pipeline } from "../services/processingPipeline.js";
import { SOURCE_TYPES } from "../config/constants.js";
import { fetchRecentEarthquakes } from "../ingestion/external/usgsService.js";
import { fetchAlerts } from "../ingestion/external/gdacsService.js";
import { fetchRecentEvents } from "../ingestion/external/eonetService.js";
import { searchDisasterNews } from "../ingestion/external/gdeltService.js";
import { fetchDisasterReports } from "../ingestion/external/reliefWebService.js";

/**
 * Background Ingestion Worker — DisasterLens AI
 *
 * Periodically polls external data sources (USGS, GDACS, NASA EONET, GDELT, ReliefWeb)
 * and passes the raw events through the canonical Golden Processing Pipeline.
 *
 * Open-Meteo is strictly queried on-demand and is NEVER continuously polled.
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
      maxRetries: parseInt(process.env.INGESTION_MAX_RETRIES, 10) || 3,
      baseBackoffMs: parseInt(process.env.INGESTION_BACKOFF_BASE_MS, 10) || 1000,
      timeoutMs: parseInt(process.env.INGESTION_REQUEST_TIMEOUT_MS, 10) || 30000,
      intervals: {
        usgs: parseInt(process.env.USGS_INTERVAL_MS, 10) || 5 * 60 * 1000,        // 5 min
        gdacs: parseInt(process.env.GDACS_INTERVAL_MS, 10) || 5 * 60 * 1000,      // 5 min
        eonet: parseInt(process.env.EONET_INTERVAL_MS, 10) || 10 * 60 * 1000,     // 10 min
        gdelt: parseInt(process.env.GDELT_INTERVAL_MS, 10) || 15 * 60 * 1000,     // 15 min
        reliefweb: parseInt(process.env.RELIEFWEB_INTERVAL_MS, 10) || 30 * 60 * 1000, // 30 min
      },
    };

    // Service state tracking
    this.services = {
      usgs: {
        name: "USGS Earthquakes",
        sourceType: SOURCE_TYPES.USGS,
        intervalMs: this.config.intervals.usgs,
        fetcher: () => fetchRecentEarthquakes("2.5_day"),
        status: "idle",
        lastRun: null,
        lastSuccess: null,
        lastFailure: null,
        nextRun: null,
        successCount: 0,
        failureCount: 0,
        eventsProcessed: 0,
      },
      gdacs: {
        name: "GDACS Global Alerts",
        sourceType: SOURCE_TYPES.GDACS,
        intervalMs: this.config.intervals.gdacs,
        fetcher: () => fetchAlerts(),
        status: "idle",
        lastRun: null,
        lastSuccess: null,
        lastFailure: null,
        nextRun: null,
        successCount: 0,
        failureCount: 0,
        eventsProcessed: 0,
      },
      eonet: {
        name: "NASA EONET Events",
        sourceType: SOURCE_TYPES.EONET,
        intervalMs: this.config.intervals.eonet,
        fetcher: () => fetchRecentEvents({ status: "open", limit: 30 }),
        status: "idle",
        lastRun: null,
        lastSuccess: null,
        lastFailure: null,
        nextRun: null,
        successCount: 0,
        failureCount: 0,
        eventsProcessed: 0,
      },
      gdelt: {
        name: "GDELT News Monitor",
        sourceType: SOURCE_TYPES.GDELT,
        intervalMs: this.config.intervals.gdelt,
        fetcher: () => searchDisasterNews({ maxRecords: 20 }),
        status: "idle",
        lastRun: null,
        lastSuccess: null,
        lastFailure: null,
        nextRun: null,
        successCount: 0,
        failureCount: 0,
        eventsProcessed: 0,
      },
      reliefweb: {
        name: "ReliefWeb Reports",
        sourceType: SOURCE_TYPES.RELIEFWEB,
        intervalMs: this.config.intervals.reliefweb,
        fetcher: () => fetchDisasterReports({ limit: 15 }),
        status: "idle",
        lastRun: null,
        lastSuccess: null,
        lastFailure: null,
        nextRun: null,
        successCount: 0,
        failureCount: 0,
        eventsProcessed: 0,
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
    console.log("[Ingestion Worker] Starting background external ingestion service...");

    for (const [key, svc] of Object.entries(this.services)) {
      // Schedule recurring execution
      const timer = setInterval(() => {
        this._executeService(key).catch((err) => {
          console.error(`[Ingestion Worker] Uncaught error in ${svc.name}:`, err.message);
        });
      }, svc.intervalMs);

      // Keep Node process from hanging if this is the only active timer
      if (timer.unref) timer.unref();

      this.timers.set(key, timer);
      svc.nextRun = new Date(Date.now() + svc.intervalMs).toISOString();

      // Trigger initial fetch asynchronously without blocking
      if (initialRun) {
        setTimeout(() => {
          this._executeService(key).catch((err) => {
            console.warn(`[Ingestion Worker] Initial fetch warning for ${svc.name}:`, err.message);
          });
        }, 100);
      }
    }

    console.log("[Ingestion Worker] All service intervals registered.");
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
   * Run one or all services immediately (for tests or manual refresh).
   *
   * @param {string|null} serviceKey - e.g. "usgs", "gdacs", or null for all
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
        intervalMs: svc.intervalMs,
        lastRun: svc.lastRun,
        lastSuccess: svc.lastSuccess,
        lastFailure: svc.lastFailure,
        nextRun: svc.nextRun,
        successCount: svc.successCount,
        failureCount: svc.failureCount,
        eventsProcessed: svc.eventsProcessed,
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
   * Execute a single service with overlap locking, retries, and batch processing.
   *
   * @private
   */
  async _executeService(key) {
    const svc = this.services[key];
    if (!svc) return { success: false, error: "Service not found" };

    // Overlap prevention: skip if already running
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

    // Retry loop with exponential backoff
    while (attempt <= this.config.maxRetries) {
      try {
        rawEvents = await svc.fetcher();
        fetchError = null;
        break; // Success!
      } catch (err) {
        attempt++;
        fetchError = err;

        // Do not retry client/permanent 4xx errors
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
      svc.lastFailure = {
        error: fetchError.message,
        timestamp: new Date().toISOString(),
      };
      svc.failureCount++;
      this.locks.set(key, false);
      if (this.running) {
        svc.nextRun = new Date(Date.now() + svc.intervalMs).toISOString();
      }
      return { success: false, error: fetchError.message };
    }

    // Process batch through the Golden Pipeline
    const events = Array.isArray(rawEvents) ? rawEvents : [];
    let processedCount = 0;
    let errorCount = 0;

    for (const rawItem of events) {
      try {
        const result = await pipeline.process(svc.sourceType, rawItem);
        if (result && result.success) {
          processedCount++;
        } else {
          errorCount++;
        }
      } catch (pipelineErr) {
        errorCount++;
        console.warn(`[Ingestion Worker] Error processing event in ${svc.name}:`, pipelineErr.message);
      }
    }

    svc.status = "idle";
    svc.lastSuccess = new Date().toISOString();
    svc.successCount++;
    svc.eventsProcessed += processedCount;
    this.locks.set(key, false);

    if (this.running) {
      svc.nextRun = new Date(Date.now() + svc.intervalMs).toISOString();
    }

    console.log(`[Ingestion Worker] ${svc.name} cycle complete: ${processedCount} processed, ${errorCount} errors.`);
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
