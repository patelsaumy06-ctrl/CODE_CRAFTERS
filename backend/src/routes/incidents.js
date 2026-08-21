import { Router } from "express";
import { getDb } from "../config/firebase.js";
import { COLLECTIONS, ADMIN_ROLES, OPERATIONAL_ROLES, APPLICATION_STATUS, getRollingDateWindow, isWithinDateWindow } from "../config/constants.js";
import { authenticateUser, optionalAuth, requireRole } from "../middleware/auth.js";
import { ingestionWorker } from "../workers/ingestionWorker.js";
import { priorityEngine } from "../ai/priorityEngine.js";
import admin from "firebase-admin";

const router = Router();

/**
 * GET /api/incidents/provenance — Multi-source Data Integrity & Provenance Report
 */
router.get("/provenance", async (req, res) => {
  try {
    const days = parseInt(req.query.days, 10) || 3;
    const provenance = await ingestionWorker.getProvenanceStatus(days);
    res.json({ data: provenance, date_window: provenance.date_window });
  } catch (error) {
    console.error("[Incidents GET/provenance] Error:", error.message);
    res.status(500).json({ error: "PROVENANCE_FAILED", message: error.message });
  }
});

/**
 * POST /api/incidents/sync — Trigger on-demand live synchronization from external feeds
 */
router.post("/sync", optionalAuth, async (req, res) => {
  try {
    const serviceKey = req.body?.service || null;
    const days = parseInt(req.body?.days || req.query?.days, 10) || 3;
    const dateWindow = getRollingDateWindow(days);

    console.log(`[Incidents POST/sync] Manual live sync requested for: ${serviceKey || "all feeds"} (days=${days})`);

    const syncResults = await ingestionWorker.runOnce(serviceKey);
    const provenance = await ingestionWorker.getProvenanceStatus(days);

    // Fetch updated live incidents within the 3-day window
    const db = getDb();
    const snapshot = await db
      .collection(COLLECTIONS.INCIDENTS)
      .where("application_status", "==", APPLICATION_STATUS.LIVE)
      .limit(300)
      .get()
      .catch(async () => {
        return db.collection(COLLECTIONS.INCIDENTS).limit(300).get();
      });

    const allDocs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const filteredIncidents = allDocs.filter((inc) => {
      const eventTime = inc.event_time || inc.source_updated_at || inc.timestamp;
      return isWithinDateWindow(eventTime, dateWindow);
    });

    const sourcesHealth = {
      gdacs: {
        status: provenance?.sources?.gdacs?.status || "LIVE",
        events: filteredIncidents.filter((i) => (i.source || "").toLowerCase().includes("gdacs")).length,
        lastUpdate: provenance?.sources?.gdacs?.lastSourceUpdate || null,
      },
      usgs: {
        status: provenance?.sources?.usgs?.status || "LIVE",
        events: filteredIncidents.filter((i) => (i.source || "").toLowerCase().includes("usgs")).length,
        lastUpdate: provenance?.sources?.usgs?.lastSourceUpdate || null,
      },
    };

    res.json({
      success: true,
      message: "Live synchronization cycle completed.",
      date_window: {
        days: dateWindow.days,
        start: dateWindow.start,
        end: dateWindow.end,
      },
      is_live: provenance?.isLive ?? true,
      count: filteredIncidents.length,
      incidents: filteredIncidents,
      data: filteredIncidents,
      sources_health: sourcesHealth,
      syncResults,
      provenance,
    });
  } catch (error) {
    console.error("[Incidents POST/sync] Sync error:", error.message);
    res.status(500).json({ error: "SYNC_FAILED", message: error.message });
  }
});

/**
 * GET /api/incidents — List live incidents within rolling three-day window with filtering
 */
router.get("/", optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    const {
      days: daysStr = "3",
      disasterType,
      severity,
      status,
      application_status,
      verified,
      includeHistorical = "false",
      limit: limitStr = "100",
      offset: offsetStr = "0",
    } = req.query;

    const days = Math.max(1, Math.min(parseInt(daysStr, 10) || 3, 30));
    const dateWindow = getRollingDateWindow(days);

    const snapshot = await db.collection(COLLECTIONS.INCIDENTS).limit(500).get();
    const allDocs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Requirement 11: Backend filtering order
    // 1. Authoritative three-day event_time filter
    // 2. LIVE application_status filter
    // 3. User UI filters (disasterType, severity, status, verified)
    const filteredIncidents = allDocs.filter((inc) => {
      const eventTime = inc.event_time || inc.source_updated_at || inc.timestamp;

      // Filter by dynamic date window
      const inWindow = isWithinDateWindow(eventTime, dateWindow);
      if (!inWindow && includeHistorical !== "true") {
        return false;
      }

      // Filter by application status (default LIVE only)
      if (application_status) {
        if (inc.application_status !== application_status) return false;
      } else if (includeHistorical !== "true" && !status) {
        if (inc.application_status && inc.application_status !== APPLICATION_STATUS.LIVE) {
          return false;
        }
      }

      // Filter by disaster type
      if (disasterType && disasterType !== "All") {
        if ((inc.disasterType || "").toLowerCase() !== disasterType.toLowerCase()) {
          return false;
        }
      }

      // Filter by severity
      if (severity && severity !== "All") {
        const sev = (inc.severity || "").toLowerCase();
        if (severity === "critical_high" || severity === "critical & high") {
          if (sev !== "critical" && sev !== "high") return false;
        } else if (sev !== severity.toLowerCase()) {
          return false;
        }
      }

      // Filter by status
      if (status && status !== "All") {
        if ((inc.status || "").toLowerCase() !== status.toLowerCase()) {
          return false;
        }
      }

      // Filter by verified
      if (verified === "true") {
        if (!inc.verified && inc.verificationStatus !== "OFFICIALLY_CONFIRMED") {
          return false;
        }
      }

      return true;
    });

    // Sort by event occurrence time (descending)
    filteredIncidents.sort((a, b) => {
      const tA = new Date(a.event_time || a.source_updated_at || 0).getTime();
      const tB = new Date(b.event_time || b.source_updated_at || 0).getTime();
      return tB - tA;
    });

    const limit = Math.min(parseInt(limitStr, 10) || 100, 300);
    const offset = parseInt(offsetStr, 10) || 0;
    const paginatedIncidents = filteredIncidents.slice(offset, offset + limit).map(enrichIncidentData);

    // Provenance & Source Health
    const provenance = await ingestionWorker.getProvenanceStatus(days).catch(() => null);

    const sourcesHealth = {
      gdacs: {
        status: provenance?.sources?.gdacs?.status || "LIVE",
        events: filteredIncidents.filter((i) => (i.source || "").toLowerCase().includes("gdacs")).length,
        lastUpdate: provenance?.sources?.gdacs?.lastSourceUpdate || null,
      },
      usgs: {
        status: provenance?.sources?.usgs?.status || "LIVE",
        events: filteredIncidents.filter((i) => (i.source || "").toLowerCase().includes("usgs")).length,
        lastUpdate: provenance?.sources?.usgs?.lastSourceUpdate || null,
      },
    };

    // Return exact API Contract (Requirement 10)
    res.json({
      date_window: {
        days: dateWindow.days,
        start: dateWindow.start,
        end: dateWindow.end,
      },
      is_live: provenance?.isLive ?? true,
      count: filteredIncidents.length,
      incidents: paginatedIncidents,
      data: paginatedIncidents,
      sources_health: sourcesHealth,
      provenance,
      meta: {
        totalInWindow: filteredIncidents.length,
        returned: paginatedIncidents.length,
        limit,
        offset,
        days,
      },
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
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const days = parseInt(req.query.days, 10) || 3;
    const dateWindow = getRollingDateWindow(days);

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return res.status(400).json({
        error: "INVALID_COORDINATES",
        message: "Query params lat and lon are required.",
      });
    }

    const snapshot = await db.collection(COLLECTIONS.INCIDENTS).limit(500).get();
    const incidents = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((inc) => isWithinDateWindow(inc.event_time || inc.source_updated_at, dateWindow))
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
      meta: { count: incidents.length, lat, lon, radiusKm, days },
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

    const incidentData = { id: doc.id, ...doc.data() };

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

    const enriched = enrichIncidentData(incidentData);

    res.json({
      data: enriched,
      sources: sources.length > 0 ? sources : (enriched.evidence || []),
      evidenceBreakdown: enriched.evidenceBreakdown,
      recommendations,
    });
  } catch (error) {
    console.error("[Incidents GET/:id] Error:", error.message);
    res.status(500).json({ error: "FETCH_FAILED", message: error.message });
  }
});

/**
 * Helper to compute derived news counts, source breakdown, and priority metadata
 */
function enrichIncidentData(inc) {
  if (!inc) return inc;
  const evidenceList = Array.isArray(inc.evidence) ? inc.evidence : [];

  let newsCount = 0;
  let officialCount = 0;
  let otherCount = 0;

  for (const item of evidenceList) {
    const src = (item.source || item.sourceType || "").toLowerCase();
    if (src.includes("gdelt") || src.includes("news") || src.includes("reliefweb") || src.includes("media") || src.includes("press")) {
      newsCount++;
    } else if (src.includes("usgs") || src.includes("gdacs") || src.includes("eonet") || src.includes("sensor") || src.includes("seismic") || src.includes("official") || src.includes("government")) {
      officialCount++;
    } else {
      otherCount++;
    }
  }

  // Fallback if evidence list was empty but primary source exists
  if (evidenceList.length === 0 && inc.source) {
    const src = inc.source.toLowerCase();
    if (src.includes("gdelt") || src.includes("news") || src.includes("reliefweb")) {
      newsCount = 1;
    } else if (src.includes("usgs") || src.includes("gdacs") || src.includes("eonet") || src.includes("sensor")) {
      officialCount = 1;
    } else {
      otherCount = 1;
    }
  }

  const priorityCalc = priorityEngine.calculate({
    severity: inc.severity,
    confidence: inc.confidence,
    sourceCount: inc.sourceCount || (newsCount + officialCount + otherCount) || 1,
    eventTime: inc.event_time || inc.source_updated_at,
  });

  const priority = inc.priority || priorityCalc.priority;
  const priorityScore = inc.priorityScore ?? priorityCalc.priorityScore;

  return {
    ...inc,
    newsEvidenceCount: newsCount,
    officialEvidenceCount: officialCount,
    otherEvidenceCount: otherCount,
    priority,
    priorityScore,
    evidenceSources: evidenceList.map((e) => ({
      source: e.source || e.sourceType || "External Feed",
      url: e.source_url || e.url || "",
      event_time: e.event_time || e.source_timestamp,
      relationship: e.relationship || "Corroborating Feed",
      confidence: e.confidence || 0.7,
    })),
    evidenceBreakdown: {
      newsCount,
      officialCount,
      otherCount,
      totalCount: inc.sourceCount || (newsCount + officialCount + otherCount) || 1,
      status: inc.verificationStatus || (inc.verified ? "VERIFIED" : "UNVERIFIED"),
      confidencePercent: inc.confidencePercent || Math.round((inc.confidence || 0.7) * 100),
      priority,
      priorityScore,
    },
  };
}

/**
 * POST /api/incidents — Create incident (authenticated)
 */
router.post("/", authenticateUser, requireRole(...OPERATIONAL_ROLES), async (req, res) => {
  try {
    const db = getDb();
    const data = req.body;
    const nowIso = new Date().toISOString();

    const payload = {
      title: data.title || "Untitled Incident",
      description: data.description || "",
      disasterType: data.disasterType || "other",
      severity: data.severity || "medium",
      status: data.status || "reported",
      source_status: "CURRENT",
      application_status: APPLICATION_STATUS.LIVE,
      event_time: data.event_time || data.timestamp || nowIso,
      location: {
        latitude: Number(data.location?.latitude) || 0,
        longitude: Number(data.location?.longitude) || 0,
        address: data.location?.address || "Unknown Location",
      },
      source: data.source || "User Ingested",
      source_event_id: data.source_event_id || `manual_${Date.now()}`,
      sourceUrl: data.sourceUrl || "",
      source_url: data.sourceUrl || "",
      source_updated_at: nowIso,
      ingested_at: nowIso,
      last_seen_at: nowIso,
      sourceCount: 1,
      verified: false,
      verificationStatus: "UNVERIFIED",
      confidence: 0.6,
      confidenceFactors: [],
      evidence: [
        {
          source: data.source || "User Ingested",
          source_event_id: data.source_event_id || `manual_${Date.now()}`,
          source_url: data.sourceUrl || "",
          event_time: data.event_time || nowIso,
          source_timestamp: nowIso,
          retrieved_at: nowIso,
          relationship: "Direct Operator Incident Entry",
          confidence: 0.6,
        },
      ],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      reportedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: req.user.uid,
    };

    const docRef = await db.collection(COLLECTIONS.INCIDENTS).add(payload);

    await db.collection(COLLECTIONS.AUDIT_LOGS).add({
      action: "INCIDENT_CREATED_MANUAL",
      details: `${req.user.email} logged incident: ${payload.title}`,
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
