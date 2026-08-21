import { Router } from "express";
import { getDb } from "../config/firebase.js";
import { COLLECTIONS, DISASTER_TYPES, APPLICATION_STATUS, VERIFICATION_STATUS, getRollingDateWindow, isWithinDateWindow } from "../config/constants.js";
import { pipeline } from "../services/processingPipeline.js";
import { ingestionWorker } from "../workers/ingestionWorker.js";

const router = Router();

/**
 * GET /api/analytics/overview — Real-time KPI metrics computed strictly from the rolling 3-day live dataset
 */
router.get("/overview", async (req, res) => {
  try {
    const days = Math.max(1, Math.min(parseInt(req.query.days, 10) || 3, 30));
    const dateWindow = getRollingDateWindow(days);

    const db = getDb();
    const incSnap = await db.collection(COLLECTIONS.INCIDENTS).get();
    const allDocs = incSnap.docs.map((d) => d.data());

    // Filter strictly to the dynamic 3-day rolling window with LIVE status
    const incidents = allDocs.filter((inc) => {
      const eventTime = inc.event_time || inc.source_updated_at || inc.timestamp;
      return isWithinDateWindow(eventTime, dateWindow) && (inc.application_status === APPLICATION_STATUS.LIVE || !inc.application_status);
    });

    const total = incidents.length;
    const active = incidents.filter((i) => {
      const s = (i.status || "").toLowerCase();
      return s === "active" || s === "reported" || s === "investigating";
    }).length;

    const officiallyConfirmed = incidents.filter(
      (i) => i.verificationStatus === VERIFICATION_STATUS.OFFICIALLY_CONFIRMED || (i.verified && i.verificationStatus !== VERIFICATION_STATUS.CORROBORATED)
    ).length;

    const corroborated = incidents.filter(
      (i) => i.verificationStatus === VERIFICATION_STATUS.CORROBORATED || (i.sourceCount && i.sourceCount >= 2)
    ).length;

    const verifiedOrCorroborated = incidents.filter(
      (i) =>
        i.verified ||
        i.verificationStatus === VERIFICATION_STATUS.OFFICIALLY_CONFIRMED ||
        i.verificationStatus === VERIFICATION_STATUS.CORROBORATED ||
        i.status === "verified"
    ).length;

    const verifiedRate = total > 0 ? ((verifiedOrCorroborated / total) * 100).toFixed(1) : "0";

    const critical = incidents.filter((i) => (i.severity || "").toLowerCase() === "critical").length;
    const high = incidents.filter((i) => (i.severity || "").toLowerCase() === "high").length;

    const avgConfidence =
      total > 0
        ? (
            (incidents.reduce((sum, i) => sum + (Number(i.confidence) || 0), 0) / total) *
            100
          ).toFixed(1)
        : "0";

    const pipelineStats = pipeline.getStats();
    const provenance = await ingestionWorker.getProvenanceStatus(days).catch(() => null);

    res.json({
      date_window: {
        days: dateWindow.days,
        start: dateWindow.start,
        end: dateWindow.end,
      },
      data: {
        kpis: [
          {
            title: "Total Incidents (3-Day)",
            value: total.toLocaleString(),
            change: total > 0 ? `${total} within 3-day window` : "0 in 3-day window",
            good: true,
          },
          {
            title: "Active Incidents",
            value: active.toLocaleString(),
            change: `${active} active operations`,
            good: true,
          },
          {
            title: "Corroborated Incidents",
            value: corroborated.toString(),
            change: `${corroborated} multi-source confirmed`,
            good: corroborated > 0,
          },
          {
            title: "Officially Confirmed",
            value: officiallyConfirmed.toString(),
            change: `${officiallyConfirmed} official agency verified`,
            good: officiallyConfirmed > 0,
          },
          {
            title: "Critical Severity",
            value: critical.toString(),
            change: `${critical} critical, ${high} high severity`,
            good: critical === 0,
          },
        ],
        pipelineStats,
        provenance,
      },
    });
  } catch (error) {
    console.error("[Analytics Overview] Error:", error.message);
    res.status(500).json({ error: "ANALYTICS_FAILED", message: error.message });
  }
});

/**
 * GET /api/analytics/trends — Incident trend data over rolling 3-day window
 */
router.get("/trends", async (req, res) => {
  try {
    const days = Math.max(1, Math.min(parseInt(req.query.days, 10) || 3, 30));
    const dateWindow = getRollingDateWindow(days);

    const db = getDb();
    const snapshot = await db.collection(COLLECTIONS.INCIDENTS).limit(500).get();

    // Group into 24-hour / 72-hour buckets
    const bucketCount = 24;
    const hourBuckets = new Array(bucketCount).fill(0);
    const now = Date.now();

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const eventTime = data.event_time || data.source_updated_at;
      if (!isWithinDateWindow(eventTime, dateWindow)) return;

      const ts = new Date(eventTime).getTime();
      const hoursAgo = Math.floor((now - ts) / (3 * 60 * 60 * 1000)); // 3h intervals across 72h
      if (hoursAgo >= 0 && hoursAgo < bucketCount) {
        hourBuckets[bucketCount - 1 - hoursAgo]++;
      }
    });

    res.json({
      date_window: {
        days: dateWindow.days,
        start: dateWindow.start,
        end: dateWindow.end,
      },
      data: {
        timeline: hourBuckets,
        labels: hourBuckets.map((_, i) => `${(bucketCount - 1 - i) * 3}h ago`),
        period: "Last 3 Days (72 hours)",
      },
    });
  } catch (error) {
    console.error("[Analytics Trends] Error:", error.message);
    res.status(500).json({ error: "ANALYTICS_FAILED", message: error.message });
  }
});

/**
 * GET /api/analytics/categories — Breakdown by disaster type within rolling 3-day window
 */
router.get("/categories", async (req, res) => {
  try {
    const days = Math.max(1, Math.min(parseInt(req.query.days, 10) || 3, 30));
    const dateWindow = getRollingDateWindow(days);

    const db = getDb();
    const snapshot = await db.collection(COLLECTIONS.INCIDENTS).get();

    const categories = {};
    for (const type of Object.values(DISASTER_TYPES)) {
      categories[type] = 0;
    }

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const eventTime = data.event_time || data.source_updated_at;
      if (!isWithinDateWindow(eventTime, dateWindow)) return;

      const dt = (data.disasterType || "other").toLowerCase();
      categories[dt] = (categories[dt] || 0) + 1;
    });

    res.json({
      date_window: {
        days: dateWindow.days,
        start: dateWindow.start,
        end: dateWindow.end,
      },
      data: categories,
    });
  } catch (error) {
    console.error("[Analytics Categories] Error:", error.message);
    res.status(500).json({ error: "ANALYTICS_FAILED", message: error.message });
  }
});

/**
 * GET /api/analytics/severity — Breakdown by severity level within rolling 3-day window
 */
router.get("/severity", async (req, res) => {
  try {
    const days = Math.max(1, Math.min(parseInt(req.query.days, 10) || 3, 30));
    const dateWindow = getRollingDateWindow(days);

    const db = getDb();
    const snapshot = await db.collection(COLLECTIONS.INCIDENTS).get();

    const severity = { low: 0, medium: 0, high: 0, critical: 0 };
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const eventTime = data.event_time || data.source_updated_at;
      if (!isWithinDateWindow(eventTime, dateWindow)) return;

      const s = (data.severity || "medium").toLowerCase();
      if (severity[s] !== undefined) {
        severity[s] = (severity[s] || 0) + 1;
      } else {
        severity.medium = (severity.medium || 0) + 1;
      }
    });

    res.json({
      date_window: {
        days: dateWindow.days,
        start: dateWindow.start,
        end: dateWindow.end,
      },
      data: severity,
    });
  } catch (error) {
    console.error("[Analytics Severity] Error:", error.message);
    res.status(500).json({ error: "ANALYTICS_FAILED", message: error.message });
  }
});

/**
 * GET /api/analytics/sources — Breakdown by source type within rolling 3-day window
 */
router.get("/sources", async (req, res) => {
  try {
    const days = Math.max(1, Math.min(parseInt(req.query.days, 10) || 3, 30));
    const dateWindow = getRollingDateWindow(days);

    const db = getDb();
    const snapshot = await db.collection(COLLECTIONS.INCIDENTS).get();

    const sources = {};
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const eventTime = data.event_time || data.source_updated_at;
      if (!isWithinDateWindow(eventTime, dateWindow)) return;

      const st = data.source || data.sourceType || "unknown";
      sources[st] = (sources[st] || 0) + 1;
    });

    res.json({
      date_window: {
        days: dateWindow.days,
        start: dateWindow.start,
        end: dateWindow.end,
      },
      data: sources,
    });
  } catch (error) {
    console.error("[Analytics Sources] Error:", error.message);
    res.status(500).json({ error: "ANALYTICS_FAILED", message: error.message });
  }
});

export default router;
