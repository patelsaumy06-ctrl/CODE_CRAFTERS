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
    const body = req.body;
    if (!body || typeof body !== "object") {
      return res.status(400).json({ error: "INVALID_REQUEST", message: "Request body must be a JSON object." });
    }

    const description = body.description || body.text || body.title;
    if (!description || typeof description !== "string" || !description.trim()) {
      return res.status(400).json({
        error: "MISSING_DESCRIPTION",
        message: "Field 'description' or 'text' is required and must be non-empty.",
      });
    }

    const latRaw = body.latitude ?? body.location?.latitude ?? body.location?.lat ?? body.lat;
    const lngRaw = body.longitude ?? body.location?.longitude ?? body.location?.lng ?? body.lng;

    const lat = Number(latRaw);
    const lng = Number(lngRaw);

    if (latRaw === undefined || lngRaw === undefined || isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        error: "INVALID_LOCATION",
        message: "Valid location coordinates (lat: -90..90, lng: -180..180) are required in 'location' or root object.",
      });
    }

    if (body.timestamp && isNaN(Date.parse(body.timestamp))) {
      return res.status(400).json({
        error: "INVALID_TIMESTAMP",
        message: "Field 'timestamp' must be a valid ISO 8601 date string.",
      });
    }

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
