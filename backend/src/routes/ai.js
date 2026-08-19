import { Router } from "express";
import { analyzeDisasterEvent } from "../ai/llmService.js";
import { confidenceEngine } from "../ai/confidenceEngine.js";
import { severityEngine } from "../ai/severityEngine.js";
import { getDb } from "../config/firebase.js";
import { COLLECTIONS, SOURCE_TYPES } from "../config/constants.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();

/**
 * POST /api/ai/verify — AI Disaster Verification Endpoint
 *
 * Runs AI/LLM analysis (or deterministic fallback) on incident reports/evidence
 * to produce structured classification, verification reasoning, and confidence scoring.
 */
router.post("/verify", optionalAuth, async (req, res) => {
  try {
    const { incidentId, text = "", title = "", sources = [], location } = req.body || {};

    let targetText = text;
    let targetTitle = title;
    let targetLocation = location || { latitude: 0, longitude: 0, address: "" };
    let incidentData = null;
    let allSources = [...sources];

    // If incidentId is provided, enrich with Firestore incident data & sources
    if (incidentId) {
      try {
        const db = getDb();
        const doc = await db.collection(COLLECTIONS.INCIDENTS).doc(incidentId).get();
        if (doc.exists) {
          incidentData = { id: doc.id, ...doc.data() };
          if (!targetText) targetText = incidentData.description || "";
          if (!targetTitle) targetTitle = incidentData.title || "";
          if (!targetLocation || (!targetLocation.latitude && !targetLocation.longitude)) {
            targetLocation = incidentData.location || targetLocation;
          }

          // Fetch incident sources
          const sourcesSnap = await db
            .collection(COLLECTIONS.INCIDENT_SOURCES)
            .where("incidentId", "==", incidentId)
            .get();
          const dbSources = sourcesSnap.docs.map((d) => d.data());
          if (dbSources.length > 0) {
            allSources = [...dbSources, ...sources];
          }
        }
      } catch (docErr) {
        console.warn(`[AI Verify] Could not fetch incident ${incidentId}:`, docErr.message);
      }
    }

    if (!targetText && !targetTitle) {
      return res.status(400).json({
        error: "MISSING_CONTENT",
        message: "At least one of 'text', 'title', or a valid 'incidentId' must be provided for AI verification.",
      });
    }

    // Run AI/LLM analysis with deterministic fallback
    const aiAnalysis = await analyzeDisasterEvent({
      title: targetTitle,
      text: targetText,
      description: targetText,
      location: targetLocation,
      sources: allSources,
    });

    // Compute confidence with evidence sources
    const confidenceResult = confidenceEngine.calculate({
      sources: allSources.length > 0 ? allSources : [{ sourceType: SOURCE_TYPES.NEWS }],
      hasSensorCorroboration: allSources.some((s) => s.sourceType === SOURCE_TYPES.SENSOR),
      classifierConfidence: aiAnalysis.confidence || 0.5,
    });

    // Compute severity
    const severityResult = severityEngine.calculate({
      infrastructureDamage: aiAnalysis.urgency === "critical" ? 0.7 : aiAnalysis.urgency === "high" ? 0.4 : 0.1,
      sourceCount: Math.max(allSources.length, 1),
    });

    // Determine verification status
    const officialTypes = [
      SOURCE_TYPES.USGS,
      SOURCE_TYPES.EONET,
      SOURCE_TYPES.GDACS,
      SOURCE_TYPES.SENSOR,
      SOURCE_TYPES.GOVERNMENT,
      "usgs",
      "nasa_eonet",
      "gdacs",
    ];
    const hasOfficial = allSources.some((s) => officialTypes.includes(s.sourceType));

    let verificationStatus = "unverified";
    if (allSources.length >= 3 || (hasOfficial && allSources.length >= 2) || (hasOfficial && confidenceResult.confidence >= 0.85)) {
      verificationStatus = "verified";
    } else if (allSources.length >= 2 || confidenceResult.confidence >= 0.65) {
      verificationStatus = "corroborated";
    }

    res.json({
      success: true,
      verification: {
        disasterType: aiAnalysis.disasterType,
        urgency: aiAnalysis.urgency,
        severity: severityResult.severity,
        severityScore: severityResult.score,
        confidence: confidenceResult.confidence,
        verificationStatus,
        reasoning: aiAnalysis.reasoning || aiAnalysis.summary || "AI multi-source verification completed.",
        summary: aiAnalysis.summary || "",
        extractedEntities: aiAnalysis.extractedEntities || [],
        indicators: aiAnalysis.indicators || [],
        analysisSource: aiAnalysis.source || "deterministic_classifier",
        confidenceFactors: confidenceResult.factors,
      },
      incident: incidentData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[AI Verify API] Error:", error.message);
    res.status(500).json({
      error: "VERIFICATION_FAILED",
      message: error.message,
    });
  }
});

export default router;
