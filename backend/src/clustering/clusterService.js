import { getDb } from "../config/firebase.js";
import { COLLECTIONS, CLUSTERING, APPLICATION_STATUS, SOURCE_STATUS, VERIFICATION_STATUS } from "../config/constants.js";
import { priorityEngine } from "../ai/priorityEngine.js";
import admin from "firebase-admin";

/**
 * Geo-Temporal Incident Clustering & Deduplication Service
 *
 * Matches incoming events to existing incidents by:
 * 1. Exact Source Event ID (authoritative match)
 * 2. Geographic distance (haversine)
 * 3. Time window
 * 4. Disaster type
 * 5. Text similarity (keyword overlap)
 *
 * Creates new incidents or updates existing clusters with authentic source provenance and distinct timestamps.
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
    const sourceId = event.source_event_id || event.sourceId;
    const sourceType = event.source || event.sourceType;

    // ─── Direct Deduplication: Check if exact source event ID already exists ───
    if (sourceId && sourceType) {
      try {
        const exactMatchSnap = await db
          .collection(COLLECTIONS.INCIDENTS)
          .where("source_event_id", "==", String(sourceId))
          .where("source", "==", String(sourceType))
          .limit(1)
          .get();

        if (!exactMatchSnap.empty) {
          const doc = exactMatchSnap.docs[0];
          await this._updateExistingIncident(db, doc.id, event);
          return { incidentId: doc.id, isNew: false, matchScore: 1.0 };
        }
      } catch (err) {
        console.warn("[Cluster Service] Exact ID lookup fallback:", err.message);
      }
    }

    // ─── Spatial-Temporal Matching ───
    const now = Date.now();
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
    const eventTime = event.event_time
      ? new Date(event.event_time).getTime()
      : (event.timestamp instanceof Date ? event.timestamp.getTime() : (event.timestamp ? new Date(event.timestamp).getTime() : Date.now()));

    const incidentTime = incident.event_time
      ? new Date(incident.event_time).getTime()
      : (incident.createdAt instanceof Date
        ? incident.createdAt.getTime()
        : (typeof incident.createdAt?.toMillis === "function"
          ? incident.createdAt.toMillis()
          : (incident.createdAt?.seconds
            ? incident.createdAt.seconds * 1000
            : (incident.createdAt ? new Date(incident.createdAt).getTime() : Date.now()))));

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

    return totalWeight > 0 ? (score / totalWeight) * totalWeight : 0;
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
   * Update an existing incident with latest live feed synchronization.
   */
  async _updateExistingIncident(db, incidentId, event) {
    const incidentRef = db.collection(COLLECTIONS.INCIDENTS).doc(incidentId);
    const nowIso = new Date().toISOString();
    const sourceUpdatedAt = event.source_updated_at || nowIso;
    const eventTime = event.event_time || sourceUpdatedAt;

    const evidenceItem = (event.evidence && event.evidence[0]) || {
      source: event.source || event.sourceType,
      source_event_id: String(event.source_event_id || event.sourceId),
      source_url: event.source_url || event.metadata?.url || "",
      event_time: eventTime,
      source_timestamp: sourceUpdatedAt,
      retrieved_at: nowIso,
      relationship: "Synchronized disaster alert update",
      confidence: event.classification?.confidence || 0.9,
    };

    const updates = {
      title: event.title,
      description: event.text || event.description,
      last_seen_at: nowIso,
      source_updated_at: sourceUpdatedAt,
      source_status: event.source_status || SOURCE_STATUS.CURRENT,
      application_status: event.application_status || APPLICATION_STATUS.LIVE,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      evidence: admin.firestore.FieldValue.arrayUnion(evidenceItem),
    };

    if (event.metadata?.alertLevel) updates.alertLevel = event.metadata.alertLevel;
    if (event.metadata?.alertScore !== undefined) updates.alertScore = event.metadata.alertScore;

    await incidentRef.update(updates);
  }

  /**
   * Merge an event into an existing incident — add source, update metadata & evidence.
   */
  async _mergeIntoIncident(db, incidentId, event) {
    const incidentRef = db.collection(COLLECTIONS.INCIDENTS).doc(incidentId);
    const nowIso = new Date().toISOString();
    const sourceUpdatedAt = event.source_updated_at || nowIso;
    const eventTime = event.event_time || sourceUpdatedAt;

    // Add event as a source document
    await db.collection(COLLECTIONS.INCIDENT_SOURCES).add({
      incidentId,
      eventId: event.eventId,
      sourceType: event.sourceType || event.source,
      sourceId: event.source_event_id || event.sourceId,
      text: event.text,
      location: event.location,
      timestamp: event.timestamp,
      metadata: event.metadata || {},
      addedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const evidenceItem = (event.evidence && event.evidence[0]) || {
      source: event.source || event.sourceType,
      source_event_id: String(event.source_event_id || event.sourceId),
      source_url: event.source_url || event.metadata?.url || "",
      event_time: eventTime,
      source_timestamp: sourceUpdatedAt,
      retrieved_at: nowIso,
      relationship: "Independent Corroborating Feed",
      confidence: event.classification?.confidence || 0.85,
    };

    // Update incident source count and evidence array
    await incidentRef.update({
      sourceCount: admin.firestore.FieldValue.increment(1),
      last_seen_at: nowIso,
      application_status: APPLICATION_STATUS.LIVE,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastSourceType: event.sourceType || event.source,
      evidence: admin.firestore.FieldValue.arrayUnion(evidenceItem),
    });
  }

  /**
   * Create a new incident from an event.
   */
  async _createNewIncident(db, event) {
    const classification = event.classification || {};
    const nowIso = new Date().toISOString();
    const sourceUpdatedAt = event.source_updated_at || (event.timestamp ? new Date(event.timestamp).toISOString() : nowIso);
    const eventTime = event.event_time || (event.timestamp ? new Date(event.timestamp).toISOString() : sourceUpdatedAt);
    const sourceEventId = String(event.source_event_id || event.sourceId || "").trim();
    const sourceName = event.source || event.sourceType || "External Feed";
    const officialUrl = event.source_url || event.metadata?.url || "";

    const initialEvidence = Array.isArray(event.evidence) && event.evidence.length > 0
      ? event.evidence
      : [
          {
            source: sourceName,
            source_event_id: sourceEventId,
            source_url: officialUrl,
            event_time: eventTime,
            source_timestamp: sourceUpdatedAt,
            retrieved_at: nowIso,
            relationship: "Primary Authoritative Alert Feed",
            confidence: classification.confidence || 0.95,
          },
        ];

    const severity = classification.urgency === "critical" ? "critical" : (classification.urgency === "high" ? "high" : "medium");
    const confidence = classification.confidence || 0.7;
    const priorityResult = priorityEngine.calculate({
      severity,
      confidence,
      sourceCount: 1,
      eventTime,
    });

    const incident = {
      title: event.title || "New Incident",
      description: event.text || event.description || "",
      disasterType: classification.disasterType || event.disasterType || "other",
      raw_event_type: event.raw_event_type || null,
      severity,
      priority: priorityResult.priority,
      priorityScore: priorityResult.priorityScore,
      status: "active",
      source_status: event.source_status || SOURCE_STATUS.CURRENT,
      application_status: event.application_status || APPLICATION_STATUS.LIVE,
      event_time: eventTime,
      location: event.location || { latitude: 0, longitude: 0, address: "Global Region" },
      source: sourceName,
      source_event_id: sourceEventId,
      episode_id: event.episode_id || null,
      source_url: officialUrl,
      sourceUrl: officialUrl,
      source_updated_at: sourceUpdatedAt,
      ingested_at: event.ingested_at || nowIso,
      last_seen_at: event.last_seen_at || nowIso,
      sourceCount: 1,
      evidence: initialEvidence,
      verified: false,
      verificationStatus: VERIFICATION_STATUS.UNVERIFIED,
      confidence: classification.confidence || 0.7,
      confidenceFactors: [],
      confidenceExplanation: "Initial ingestion from authoritative source feed.",
      classificationReason: classification.classificationReason || "",
      matchedKeywords: classification.matchedKeywords || [],
      alertLevel: event.metadata?.alertLevel || null,
      alertScore: event.metadata?.alertScore || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: sourceEventId || "ingestion-pipeline",
      reportedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection(COLLECTIONS.INCIDENTS).add(incident);

    // Save initial source document
    await db.collection(COLLECTIONS.INCIDENT_SOURCES).add({
      incidentId: docRef.id,
      eventId: event.eventId,
      sourceType: sourceName,
      sourceId: sourceEventId,
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
