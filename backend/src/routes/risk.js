import { Router } from "express";
import { weatherCorrelationService } from "../services/weatherCorrelationService.js";
import { getDb } from "../config/firebase.js";
import { COLLECTIONS } from "../config/constants.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();

/**
 * POST /api/risk/analyze — Weather & environmental risk correlation analysis
 *
 * Analyzes Open-Meteo weather and flood telemetry for given coordinates
 * and correlates it with the specified disaster type.
 */
router.post("/analyze", optionalAuth, async (req, res) => {
  try {
    const { latitude, longitude, disasterType = "other", incidentId } = req.body || {};

    const lat = Number(latitude);
    const lon = Number(longitude);

    // Validate coordinates
    if (latitude === undefined || longitude === undefined || isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({
        error: "INVALID_COORDINATES",
        message: "Latitude must be a number between -90 and 90, longitude between -180 and 180.",
      });
    }

    // Run weather correlation analysis
    const analysis = await weatherCorrelationService.analyzeWeatherRisk({
      latitude: lat,
      longitude: lon,
      disasterType,
    });

    let incidentData = null;

    // Optional: fetch incident details if incidentId is provided
    if (incidentId) {
      try {
        const db = getDb();
        const doc = await db.collection(COLLECTIONS.INCIDENTS).doc(incidentId).get();
        if (doc.exists) {
          incidentData = { id: doc.id, ...doc.data() };
        }
      } catch (docErr) {
        console.warn(`[Risk Route] Could not fetch incident ${incidentId}:`, docErr.message);
      }
    }

    res.json({
      success: true,
      analysis,
      incident: incidentData,
    });
  } catch (error) {
    console.error("[Risk Analysis API] Error:", error.message);
    res.status(500).json({
      error: "ANALYSIS_FAILED",
      message: error.message,
    });
  }
});

export default router;
