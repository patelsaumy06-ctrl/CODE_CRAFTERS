import { Router } from "express";
import { getDb } from "../config/firebase.js";
import { COLLECTIONS, DISASTER_TYPES } from "../config/constants.js";
import { pipeline } from "../services/processingPipeline.js";

const router = Router();

/**
 * GET /api/analytics/overview — KPI metrics computed from live Firestore data
 */
router.get("/overview", async (req, res) => {
  try {
    const db = getDb();
    const incSnap = await db.collection(COLLECTIONS.INCIDENTS).get();
    const incidents = incSnap.docs.map((d) => d.data());

    const total = incidents.length;
    const verified = incidents.filter((i) => i.verified || i.status === "verified").length;
    const verifiedRate = total > 0 ? ((verified / total) * 100).toFixed(1) : "0";

    const critical = incidents.filter((i) => i.severity === "critical").length;
    const high = incidents.filter((i) => i.severity === "high").length;
    const avgConfidence = total > 0
      ? (incidents.reduce((sum, i) => sum + (i.confidence || 0), 0) / total * 100).toFixed(1)
      : "0";

    const pipelineStats = pipeline.getStats();

    res.json({
      data: {
        kpis: [
          {
            title: "Total Incidents Processed",
            value: total.toLocaleString(),
            change: pipelineStats.processed > 0 ? `+${pipelineStats.processed} pipeline` : "Live",
            good: true,
          },
          {
            title: "AI Verification Rate",
            value: `${verifiedRate}%`,
            change: `${verified}/${total} verified`,
            good: parseFloat(verifiedRate) > 70,
          },
          {
            title: "Avg. Confidence Score",
            value: `${avgConfidence}%`,
            change: "Multi-source weighted",
            good: parseFloat(avgConfidence) > 60,
          },
          {
            title: "Alerts Triggered",
            value: pipelineStats.alerts_triggered.toString(),
            change: `${critical} critical, ${high} high`,
            good: pipelineStats.alerts_triggered > 0,
          },
        ],
        pipelineStats,
      },
    });
  } catch (error) {
    console.error("[Analytics Overview] Error:", error.message);
    res.status(500).json({ error: "ANALYTICS_FAILED", message: error.message });
  }
});

/**
 * GET /api/analytics/trends — Incident trend data over time
 */
router.get("/trends", async (req, res) => {
  try {
    const db = getDb();
    const snapshot = await db.collection(COLLECTIONS.INCIDENTS).orderBy("createdAt", "desc").limit(500).get();

    // Group by hour for last 24 hours
    const hourBuckets = new Array(24).fill(0);
    const now = Date.now();

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const ts = data.createdAt?.toMillis?.() || data.createdAt?.seconds * 1000 || 0;
      const hoursAgo = Math.floor((now - ts) / (60 * 60 * 1000));
      if (hoursAgo >= 0 && hoursAgo < 24) {
        hourBuckets[23 - hoursAgo]++;
      }
    });

    res.json({
      data: {
        timeline: hourBuckets,
        labels: hourBuckets.map((_, i) => `${23 - i}h ago`),
        period: "24 hours",
      },
    });
  } catch (error) {
    console.error("[Analytics Trends] Error:", error.message);
    res.status(500).json({ error: "ANALYTICS_FAILED", message: error.message });
  }
});

/**
 * GET /api/analytics/categories — Breakdown by disaster type
 */
router.get("/categories", async (req, res) => {
  try {
    const db = getDb();
    const snapshot = await db.collection(COLLECTIONS.INCIDENTS).get();

    const categories = {};
    for (const type of Object.values(DISASTER_TYPES)) {
      categories[type] = 0;
    }

    snapshot.docs.forEach((doc) => {
      const dt = doc.data().disasterType || "other";
      categories[dt] = (categories[dt] || 0) + 1;
    });

    res.json({ data: categories });
  } catch (error) {
    console.error("[Analytics Categories] Error:", error.message);
    res.status(500).json({ error: "ANALYTICS_FAILED", message: error.message });
  }
});

/**
 * GET /api/analytics/severity — Breakdown by severity level
 */
router.get("/severity", async (req, res) => {
  try {
    const db = getDb();
    const snapshot = await db.collection(COLLECTIONS.INCIDENTS).get();

    const severity = { low: 0, medium: 0, high: 0, critical: 0 };
    snapshot.docs.forEach((doc) => {
      const s = doc.data().severity || "medium";
      severity[s] = (severity[s] || 0) + 1;
    });

    res.json({ data: severity });
  } catch (error) {
    console.error("[Analytics Severity] Error:", error.message);
    res.status(500).json({ error: "ANALYTICS_FAILED", message: error.message });
  }
});

/**
 * GET /api/analytics/sources — Breakdown by source type
 */
router.get("/sources", async (req, res) => {
  try {
    const db = getDb();
    const snapshot = await db.collection(COLLECTIONS.INCIDENT_SOURCES).get();

    const sources = {};
    snapshot.docs.forEach((doc) => {
      const st = doc.data().sourceType || "unknown";
      sources[st] = (sources[st] || 0) + 1;
    });

    res.json({ data: sources });
  } catch (error) {
    console.error("[Analytics Sources] Error:", error.message);
    res.status(500).json({ error: "ANALYTICS_FAILED", message: error.message });
  }
});

export default router;
