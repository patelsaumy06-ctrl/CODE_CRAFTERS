import { Router } from "express";
import { pipeline } from "../services/processingPipeline.js";
import { SOURCE_TYPES } from "../config/constants.js";
import { authenticateUser, optionalAuth } from "../middleware/auth.js";

const router = Router();

/**
 * POST /api/ingest/citizen — Ingest citizen report
 */
router.post("/citizen", optionalAuth, async (req, res) => {
  try {
    const result = await pipeline.process(SOURCE_TYPES.CITIZEN, req.body);

    if (!result.success) {
      return res.status(500).json({ error: "PROCESSING_FAILED", message: result.error });
    }

    res.status(201).json({
      message: "Citizen report processed successfully.",
      data: {
        incidentId: result.incidentId,
        isNew: result.isNew,
        classification: result.classification,
        severity: result.severity.severity,
        confidence: result.confidence.confidence,
        alert: result.alert?.shouldAlert ? result.alert.reason : null,
        processingTimeMs: result.processingTimeMs,
      },
    });
  } catch (error) {
    console.error("[Ingest Citizen] Error:", error.message);
    res.status(500).json({ error: "INGESTION_FAILED", message: error.message });
  }
});

/**
 * POST /api/ingest/news — Ingest news article
 */
router.post("/news", optionalAuth, async (req, res) => {
  try {
    const result = await pipeline.process(SOURCE_TYPES.NEWS, req.body);

    if (!result.success) {
      return res.status(500).json({ error: "PROCESSING_FAILED", message: result.error });
    }

    res.status(201).json({
      message: "News report processed successfully.",
      data: {
        incidentId: result.incidentId,
        isNew: result.isNew,
        classification: result.classification,
        severity: result.severity.severity,
        confidence: result.confidence.confidence,
        alert: result.alert?.shouldAlert ? result.alert.reason : null,
        processingTimeMs: result.processingTimeMs,
      },
    });
  } catch (error) {
    console.error("[Ingest News] Error:", error.message);
    res.status(500).json({ error: "INGESTION_FAILED", message: error.message });
  }
});

/**
 * POST /api/ingest/sensor — Ingest IoT sensor reading
 */
router.post("/sensor", optionalAuth, async (req, res) => {
  try {
    const result = await pipeline.process(SOURCE_TYPES.SENSOR, req.body);

    if (!result.success) {
      return res.status(500).json({ error: "PROCESSING_FAILED", message: result.error });
    }

    res.status(201).json({
      message: "Sensor reading processed successfully.",
      data: {
        incidentId: result.incidentId,
        isNew: result.isNew,
        classification: result.classification,
        severity: result.severity.severity,
        confidence: result.confidence.confidence,
        alert: result.alert?.shouldAlert ? result.alert.reason : null,
        processingTimeMs: result.processingTimeMs,
      },
    });
  } catch (error) {
    console.error("[Ingest Sensor] Error:", error.message);
    res.status(500).json({ error: "INGESTION_FAILED", message: error.message });
  }
});

/**
 * POST /api/ingest/social — Ingest social media post
 */
router.post("/social", optionalAuth, async (req, res) => {
  try {
    const result = await pipeline.process(SOURCE_TYPES.SOCIAL, req.body);

    if (!result.success) {
      return res.status(500).json({ error: "PROCESSING_FAILED", message: result.error });
    }

    res.status(201).json({
      message: "Social media report processed successfully.",
      data: {
        incidentId: result.incidentId,
        isNew: result.isNew,
        classification: result.classification,
        severity: result.severity.severity,
        confidence: result.confidence.confidence,
        alert: result.alert?.shouldAlert ? result.alert.reason : null,
        processingTimeMs: result.processingTimeMs,
      },
    });
  } catch (error) {
    console.error("[Ingest Social] Error:", error.message);
    res.status(500).json({ error: "INGESTION_FAILED", message: error.message });
  }
});

/**
 * GET /api/ingest/stats — Get pipeline processing statistics
 */
router.get("/stats", async (req, res) => {
  res.json({ data: pipeline.getStats() });
});

export default router;
