import { Router } from "express";
import { getDb } from "../config/firebase.js";
import { COLLECTIONS } from "../config/constants.js";

const router = Router();

/**
 * GET /api/intelligence/feed — List intelligence feed items
 */
router.get("/feed", async (req, res) => {
  try {
    const db = getDb();
    const { urgency, source, limit: limitStr = "50" } = req.query;
    const limit = Math.min(parseInt(limitStr) || 50, 200);

    let query = db.collection(COLLECTIONS.INTELLIGENCE).orderBy("createdAt", "desc").limit(limit);

    const snapshot = await query.get();
    let items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Client-side filtering (Firestore compound index limitations)
    if (urgency) items = items.filter((i) => i.urgency === urgency);
    if (source) items = items.filter((i) => (i.source || "").toLowerCase().includes(source.toLowerCase()));

    res.json({ data: items, meta: { count: items.length } });
  } catch (error) {
    console.error("[Intelligence GET] Error:", error.message);
    res.status(500).json({ error: "FETCH_FAILED", message: error.message });
  }
});

export default router;
