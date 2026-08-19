import { getDb } from "../config/firebase.js";
import { COLLECTIONS, CLUSTERING } from "../config/constants.js";
import admin from "firebase-admin";

/**
 * Geo-Temporal Incident Clustering Service
 *
 * Matches incoming events to existing incidents by:
 * 1. Geographic distance (haversine)
 * 2. Time window
 * 3. Disaster type
 * 4. Text similarity (keyword overlap)
 *
 * Creates new incidents or merges events into existing clusters.
 */
export class ClusterService {
  /**
   * Find a matching incident for an incoming event, or create a new one.
   *
   * @param {Object} event - NormalizedEvent with classification
   * @returns {{ incidentId, isNew, matchScore }}
   */
  async matchOrCreate(event) {
    const db = getDb();
    const now = Date.now();

    // Fetch recent incidents of the same disaster type
    const cutoff = new Date(now - CLUSTERING.MAX_TIME_WINDOW_MS);
    let existingQuery;

    try {
      existingQuery = await db
        .collection(COLLECTIONS.INCIDENTS)
        .where("disasterType", "==", event.classification?.disasterType || event.disasterType)
        .where("createdAt", ">=", cutoff)
        .orderBy("createdAt", "desc")
        .limit(50)
        .get();
    } catch {
      // If composite index doesn't exist, fallback to simpler query
      existingQuery = await db
        .collection(COLLECTIONS.INCIDENTS)
        .where("disasterType", "==", event.classification?.disasterType || event.disasterType)
        .limit(50)
        .get();
    }

    let bestMatch = null;
    let bestScore = 0;

    for (const doc of existingQuery.docs) {
      const incident = doc.data();
      const score = this._calculateMatchScore(event, incident);

      if (score > bestScore && score >= CLUSTERING.MIN_SIMILARITY_SCORE) {
        bestScore = score;
        bestMatch = { id: doc.id, ...incident };
      }
    }

    if (bestMatch) {
      // Merge into existing incident
      await this._mergeIntoIncident(db, bestMatch.id, event);
      return { incidentId: bestMatch.id, isNew: false, matchScore: bestScore };
    }

    // Create new incident
    const incidentId = await this._createNewIncident(db, event);
    return { incidentId, isNew: true, matchScore: 0 };
  }

  /**
   * Calculate match score between event and existing incident (0-1).
   */
  _calculateMatchScore(event, incident) {
    let score = 0;
    let totalWeight = 0;

    // Geographic proximity (weight: 0.4)
    const geoWeight = 0.4;
    totalWeight += geoWeight;
    if (event.location && incident.location) {
      const distKm = this._haversineKm(
        event.location.latitude,
        event.location.longitude,
        incident.location.latitude || 0,
        incident.location.longitude || 0
      );
      if (distKm <= CLUSTERING.MAX_DISTANCE_KM) {
        score += geoWeight * (1 - distKm / CLUSTERING.MAX_DISTANCE_KM);
      }
    }

    // Time proximity (weight: 0.3)
    const timeWeight = 0.3;
    totalWeight += timeWeight;
    const eventTime = event.timestamp instanceof Date ? event.timestamp.getTime() : (event.timestamp ? new Date(event.timestamp).getTime() : Date.now());
    const incidentTime = incident.createdAt instanceof Date
      ? incident.createdAt.getTime()
      : (typeof incident.createdAt?.toMillis === "function"
        ? incident.createdAt.toMillis()
        : (incident.createdAt?.seconds
          ? incident.createdAt.seconds * 1000
          : (incident.createdAt ? new Date(incident.createdAt).getTime() : Date.now())));
    const timeDiff = Math.abs(eventTime - incidentTime);
    if (timeDiff <= CLUSTERING.MAX_TIME_WINDOW_MS) {
      score += timeWeight * (1 - timeDiff / CLUSTERING.MAX_TIME_WINDOW_MS);
    }

    // Text similarity — keyword overlap (weight: 0.3)
    const textWeight = 0.3;
    totalWeight += textWeight;
    const eventWords = new Set(
      `${event.title} ${event.text}`.toLowerCase().split(/\W+/).filter((w) => w.length > 3)
    );
    const incidentWords = new Set(
      `${incident.title || ""} ${incident.description || ""}`.toLowerCase().split(/\W+/).filter((w) => w.length > 3)
    );
    const overlap = [...eventWords].filter((w) => incidentWords.has(w)).length;
    const unionSize = new Set([...eventWords, ...incidentWords]).size;
    if (unionSize > 0) {
      score += textWeight * (overlap / unionSize);
    }

    return totalWeight > 0 ? score / totalWeight * totalWeight : 0;
  }

  /**
   * Haversine distance in kilometers.
   */
  _haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = this._toRad(lat2 - lat1);
    const dLon = this._toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this._toRad(lat1)) * Math.cos(this._toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  _toRad(deg) {
    return (deg * Math.PI) / 180;
  }

  /**
   * Merge an event into an existing incident — add source, update metadata & evidence.
   */
  async _mergeIntoIncident(db, incidentId, event) {
    const incidentRef = db.collection(COLLECTIONS.INCIDENTS).doc(incidentId);

    // Add event as a source document
    await db.collection(COLLECTIONS.INCIDENT_SOURCES).add({
      incidentId,
      eventId: event.eventId,
      sourceType: event.sourceType,
      sourceId: event.sourceId,
      text: event.text,
      location: event.location,
      timestamp: event.timestamp,
      metadata: event.metadata || {},
      addedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const safeTimestamp = (ts) => {
      if (!ts) return new Date().toISOString();
      const d = new Date(ts);
      return !isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString();
    };

    const evidenceItem = {
      source: event.sourceType,
      sourceId: event.sourceId,
      confidence: event.classification?.confidence || 0.5,
      timestamp: safeTimestamp(event.timestamp),
    };

    // Update incident source count and evidence array
    await incidentRef.update({
      sourceCount: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastSourceType: event.sourceType,
      evidence: admin.firestore.FieldValue.arrayUnion(evidenceItem),
    });
  }

  /**
   * Create a new incident from an event.
   */
  async _createNewIncident(db, event) {
    const classification = event.classification || {};

    const safeTimestamp = (ts) => {
      if (!ts) return new Date().toISOString();
      const d = new Date(ts);
      return !isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString();
    };

    const initialEvidence = [
      {
        source: event.sourceType,
        sourceId: event.sourceId,
        confidence: classification.confidence || 0.5,
        timestamp: safeTimestamp(event.timestamp),
      },
    ];

    const incident = {
      title: event.title || "New Incident",
      description: event.text || "",
      disasterType: classification.disasterType || "other",
      severity: classification.urgency === "critical" ? "critical" : "medium",
      status: "reported",
      location: event.location || { latitude: 0, longitude: 0, address: "" },
      source: event.sourceType || "User Ingested",
      sourceUrl: event.metadata?.url || "",
      sourceCount: 1,
      evidence: initialEvidence,
      verified: false,
      confidence: classification.confidence || 0.5,
      classificationReason: classification.classificationReason || "",
      matchedKeywords: classification.matchedKeywords || [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: event.sourceId || "ingestion-pipeline",
      reportedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection(COLLECTIONS.INCIDENTS).add(incident);

    // Save initial source
    await db.collection(COLLECTIONS.INCIDENT_SOURCES).add({
      incidentId: docRef.id,
      eventId: event.eventId,
      sourceType: event.sourceType,
      sourceId: event.sourceId,
      text: event.text,
      location: event.location,
      timestamp: event.timestamp,
      metadata: event.metadata || {},
      addedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return docRef.id;
  }
}

export const clusterService = new ClusterService();
