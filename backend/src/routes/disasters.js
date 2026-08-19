import { Router } from "express";
import { searchDisasterNews, searchLocationNews } from "../ingestion/external/gdeltService.js";
import { fetchDisasterReports, fetchCountryReports } from "../ingestion/external/reliefWebService.js";
import { externalNormalizer } from "../ingestion/external/externalNormalizer.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();

/**
 * GET /api/disasters/news — Disaster news and humanitarian intelligence feed
 *
 * Combines normalized articles from GDELT DOC API and situation reports from ReliefWeb.
 * Supports optional `query`, `location`, and `limit` query parameters.
 */
router.get("/news", optionalAuth, async (req, res) => {
  try {
    const { query, location, limit: limitStr = "25" } = req.query || {};
    const limit = Math.min(Math.max(parseInt(limitStr) || 25, 5), 50);

    const [gdeltRaw, reliefWebRaw] = await Promise.all([
      location
        ? searchLocationNews(location, query)
        : searchDisasterNews({ query, maxRecords: limit }),
      location
        ? fetchCountryReports(location, query)
        : fetchDisasterReports({ query, limit }),
    ]);

    const gdeltNormalized = (gdeltRaw || []).map((art) => externalNormalizer.normalizeGdelt(art));
    const reliefWebNormalized = (reliefWebRaw || []).map((rep) => externalNormalizer.normalizeReliefWeb(rep));

    // Combine and sort by newest timestamp
    const combined = [...gdeltNormalized, ...reliefWebNormalized].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    res.json({
      success: true,
      count: combined.length,
      data: combined.slice(0, limit),
      sources: {
        gdelt: gdeltNormalized.length,
        reliefweb: reliefWebNormalized.length,
      },
    });
  } catch (error) {
    console.error("[Disasters News API] Error:", error.message);
    res.status(500).json({
      error: "FETCH_FAILED",
      message: error.message,
    });
  }
});

export default router;
