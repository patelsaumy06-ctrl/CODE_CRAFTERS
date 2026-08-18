import { Router } from "express";
import { getDb } from "../config/firebase.js";
import { COLLECTIONS, ADMIN_ROLES, OPERATIONAL_ROLES } from "../config/constants.js";
import { authenticateUser, optionalAuth, requireRole } from "../middleware/auth.js";
import admin from "firebase-admin";

const router = Router();

/**
 * GET /api/incidents — List incidents with filtering and pagination
 */
router.get("/", optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    const {
      disasterType,
      severity,
      status,
      verified,
      limit: limitStr = "50",
      offset: offsetStr = "0",
      orderBy: orderField = "createdAt",
      order = "desc",
    } = req.query;

    let query = db.collection(COLLECTIONS.INCIDENTS);

    if (disasterType) query = query.where("disasterType", "==", disasterType);
    if (severity) query = query.where("severity", "==", severity);
    if (status) query = query.where("status", "==", status);
    if (verified === "true") query = query.where("verified", "==", true);

    try {
      query = query.orderBy(orderField, order);
    } catch {
      query = query.orderBy("createdAt", "desc");
    }

    const limit = Math.min(parseInt(limitStr) || 50, 200);
    const offset = parseInt(offsetStr) || 0;
    query = query.limit(limit).offset(offset);

    const snapshot = await query.get();
    const incidents = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    res.json({
      data: incidents,
      meta: { count: incidents.length, limit, offset, orderBy: orderField, order },
    });
  } catch (error) {
    console.error("[Incidents GET] Error:", error.message);
    res.status(500).json({ error: "FETCH_FAILED", message: error.message });
  }
});

/**
 * GET /api/incidents/nearby — Find incidents near a geographic point
 */
router.get("/nearby", optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    const radiusKm = parseFloat(req.query.radiusKm) || 25;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return res.status(400).json({
        error: "INVALID_COORDINATES",
        message: "Query params lat and lon are required.",
      });
    }

    const snapshot = await db.collection(COLLECTIONS.INCIDENTS).limit(500).get();
    const incidents = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .map((inc) => ({
        ...inc,
        distanceKm: haversineKm(
          lat,
          lon,
          inc.location?.latitude || 0,
          inc.location?.longitude || 0
        ),
      }))
      .filter((inc) => inc.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit);

    res.json({
      data: incidents,
      meta: { count: incidents.length, lat, lon, radiusKm },
    });
  } catch (error) {
    console.error("[Incidents GET/nearby] Error:", error.message);
    res.status(500).json({ error: "FETCH_FAILED", message: error.message });
  }
});

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * GET /api/incidents/:id — Get single incident with sources and recommendations
 */
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection(COLLECTIONS.INCIDENTS).doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Incident not found." });
    }

    // Fetch associated sources
    const sourcesSnap = await db
      .collection(COLLECTIONS.INCIDENT_SOURCES)
      .where("incidentId", "==", req.params.id)
      .orderBy("addedAt", "desc")
      .limit(20)
      .get()
      .catch(() => ({ docs: [] }));

    const sources = sourcesSnap.docs?.map((s) => ({ id: s.id, ...s.data() })) || [];

    // Fetch recommendations
    const recsSnap = await db
      .collection(COLLECTIONS.RECOMMENDATIONS)
      .where("incidentId", "==", req.params.id)
      .orderBy("createdAt", "desc")
      .limit(5)
      .get()
      .catch(() => ({ docs: [] }));

    const recommendations = recsSnap.docs?.map((r) => ({ id: r.id, ...r.data() })) || [];

    res.json({
      data: { id: doc.id, ...doc.data() },
      sources,
      recommendations,
    });
  } catch (error) {
    console.error("[Incidents GET/:id] Error:", error.message);
    res.status(500).json({ error: "FETCH_FAILED", message: error.message });
  }
});

/**
 * POST /api/incidents — Create incident (authenticated)
 */
router.post("/", authenticateUser, requireRole(...OPERATIONAL_ROLES), async (req, res) => {
  try {
    const db = getDb();
    const data = req.body;

    const payload = {
      title: data.title || "Untitled Incident",
      description: data.description || "",
      disasterType: data.disasterType || "other",
      severity: data.severity || "medium",
      status: data.status || "reported",
      location: {
        latitude: Number(data.location?.latitude) || 0,
        longitude: Number(data.location?.longitude) || 0,
        address: data.location?.address || "Unknown",
      },
      source: data.source || "User Ingested",
      sourceUrl: data.sourceUrl || "",
      sourceCount: 1,
      verified: false,
      confidence: 0.5,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      reportedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: req.user.uid,
    };

    const docRef = await db.collection(COLLECTIONS.INCIDENTS).add(payload);

    // Audit log
    await db.collection(COLLECTIONS.AUDIT_LOGS).add({
      action: "INCIDENT_CREATED_MANUAL",
      details: `${req.user.email} created incident: ${payload.title}`,
      user: req.user.email,
      ip: req.ip,
      status: "Success",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({ data: { id: docRef.id, ...payload } });
  } catch (error) {
    console.error("[Incidents POST] Error:", error.message);
    res.status(500).json({ error: "CREATE_FAILED", message: error.message });
  }
});

/**
 * PATCH /api/incidents/:id/status — Update incident status (authenticated)
 */
router.patch("/:id/status", authenticateUser, requireRole(...OPERATIONAL_ROLES), async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: "MISSING_STATUS", message: "Field 'status' is required." });
    }

    const db = getDb();
    const docRef = db.collection(COLLECTIONS.INCIDENTS).doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Incident not found." });
    }

    await docRef.update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ data: { id: req.params.id, ...doc.data(), status } });
  } catch (error) {
    console.error("[Incidents PATCH status] Error:", error.message);
    res.status(500).json({ error: "UPDATE_FAILED", message: error.message });
  }
});

/**
 * PATCH /api/incidents/:id — Update incident (authenticated)
 */
router.patch("/:id", authenticateUser, requireRole(...OPERATIONAL_ROLES), async (req, res) => {
  try {
    const db = getDb();
    const docRef = db.collection(COLLECTIONS.INCIDENTS).doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Incident not found." });
    }

    const update = {
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    // Prevent overwriting system fields
    delete update.createdAt;
    delete update.createdBy;
    delete update.id;

    await docRef.update(update);

    res.json({ data: { id: req.params.id, ...doc.data(), ...update } });
  } catch (error) {
    console.error("[Incidents PATCH] Error:", error.message);
    res.status(500).json({ error: "UPDATE_FAILED", message: error.message });
  }
});

/**
 * DELETE /api/incidents/:id — Delete incident (admin only)
 */
router.delete("/:id", authenticateUser, requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const db = getDb();
    const docRef = db.collection(COLLECTIONS.INCIDENTS).doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Incident not found." });
    }

    await docRef.delete();

    await db.collection(COLLECTIONS.AUDIT_LOGS).add({
      action: "INCIDENT_DELETED",
      details: `${req.user.email} deleted incident: ${req.params.id}`,
      user: req.user.email,
      ip: req.ip,
      status: "Success",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ message: "Incident deleted." });
  } catch (error) {
    console.error("[Incidents DELETE] Error:", error.message);
    res.status(500).json({ error: "DELETE_FAILED", message: error.message });
  }
});

export default router;
