import { Router } from "express";
import { getDb } from "../config/firebase.js";
import { COLLECTIONS } from "../config/constants.js";

const router = Router();

/**
 * GET /api/search — Server-side multi-collection search with filtering
 */
router.get("/", async (req, res) => {
  try {
    const db = getDb();
    const {
      q: queryText,
      disasterType,
      severity,
      minConfidence,
      dateFrom,
      dateTo,
      limit: limitStr = "50",
    } = req.query;

    if (!queryText && !disasterType && !severity) {
      return res.status(400).json({
        error: "MISSING_QUERY",
        message: "At least one search parameter is required: q, disasterType, or severity.",
      });
    }

    const limit = Math.min(parseInt(limitStr) || 50, 200);
    const results = [];
    const term = (queryText || "").toLowerCase().trim();

    // ─── Search Incidents ───
    let incQuery = db.collection(COLLECTIONS.INCIDENTS);
    if (disasterType) incQuery = incQuery.where("disasterType", "==", disasterType);
    if (severity) incQuery = incQuery.where("severity", "==", severity);

    const incSnap = await incQuery.limit(200).get();

    for (const doc of incSnap.docs) {
      const data = doc.data();
      const title = (data.title || "").toLowerCase();
      const desc = (data.description || "").toLowerCase();
      const address = (data.location?.address || "").toLowerCase();

      const textMatch = !term || title.includes(term) || desc.includes(term) || address.includes(term);
      const confMatch = !minConfidence || (data.confidence || 0) >= parseFloat(minConfidence);
      const dateMatch = checkDateRange(data.createdAt, dateFrom, dateTo);

      if (textMatch && confMatch && dateMatch) {
        results.push({
          id: doc.id,
          type: "Incident Report",
          title: data.title,
          snippet: data.description || data.location?.address || "Disaster incident.",
          source: data.source || "Sensor Array",
          disasterType: data.disasterType,
          severity: data.severity,
          confidence: data.confidence || (data.verified ? 0.99 : 0.85),
          timestamp: data.createdAt,
          verified: Boolean(data.verified),
        });
      }
    }

    // ─── Search Intelligence ───
    if (term) {
      const intelSnap = await db.collection(COLLECTIONS.INTELLIGENCE).limit(200).get();

      for (const doc of intelSnap.docs) {
        const data = doc.data();
        const text = (data.text || "").toLowerCase();
        const handle = (data.handle || "").toLowerCase();
        const source = (data.source || "").toLowerCase();

        if (text.includes(term) || handle.includes(term) || source.includes(term)) {
          results.push({
            id: doc.id,
            type: "Intelligence / Stream",
            title: `${data.source} (${data.handle})`,
            snippet: data.text,
            source: data.source,
            confidence: (data.confidence || 90) / 100,
            timestamp: data.createdAt,
          });
        }
      }
    }

    // Sort by confidence descending
    results.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

    res.json({ data: results.slice(0, limit), meta: { totalMatches: results.length, limit } });
  } catch (error) {
    console.error("[Search] Error:", error.message);
    res.status(500).json({ error: "SEARCH_FAILED", message: error.message });
  }
});

function checkDateRange(timestamp, from, to) {
  if (!from && !to) return true;
  const ts = timestamp?.toMillis?.() || timestamp?.seconds * 1000 || 0;
  if (!ts) return true;
  if (from && ts < new Date(from).getTime()) return false;
  if (to && ts > new Date(to).getTime()) return false;
  return true;
}

export default router;
