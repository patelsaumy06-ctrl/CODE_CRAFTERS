import { normalizer } from "../ingestion/normalizer.js";
import { classifier } from "../ai/classifier.js";
import { analyzeDisasterEvent, isLLMEnabled } from "../ai/llmService.js";
import { confidenceEngine } from "../ai/confidenceEngine.js";
import { severityEngine } from "../ai/severityEngine.js";
import { clusterService } from "../clustering/clusterService.js";
import { alertEngine } from "../alerts/alertEngine.js";
import { recommendationEngine } from "../recommendations/recommendationEngine.js";
import { getDb } from "../config/firebase.js";
import { COLLECTIONS, SOURCE_TYPES, VERIFICATION_STATUS, APPLICATION_STATUS, SOURCE_STATUS } from "../config/constants.js";
import admin from "firebase-admin";

/**
 * Processing Pipeline Orchestrator — DisasterLens AI
 *
 * Full live flow:
 * Normalize → Classify → Cluster/Deduplicate → Traceable Confidence →
 * Calculate Severity → Strict Verification Assessment → Write with Full Provenance
 */
export class ProcessingPipeline {
  constructor() {
    this.stats = {
      processed: 0,
      incidents_created: 0,
      incidents_merged: 0,
      alerts_triggered: 0,
      errors: 0,
      lastProcessedAt: null,
    };
  }

  /**
   * Process a raw incoming event through the full pipeline.
   *
   * @param {string} sourceType - One of SOURCE_TYPES
   * @param {Object} rawData - Raw event data from authoritative provider
   * @returns {{ success, incidentId, isNew, severity, confidence, alert, recommendations, processingTime }}
   */
  async process(sourceType, rawData) {
    const startTime = Date.now();
    const pipelineId = `PL_${Date.now()}`;

    console.log(`[Pipeline:${pipelineId}] Starting live processing — source: ${sourceType}`);

    try {
      // ─── Step 1: Normalize with full source provenance ───
      const normalized = normalizer.normalize(sourceType, rawData);
      console.log(`[Pipeline:${pipelineId}] Normalized: "${normalized.title}" (ID: ${normalized.source_event_id})`);

      // ─── Step 2a: LLM Analysis (Unstructured / text news sources only) ───
      const ambiguousSources = [
        SOURCE_TYPES.CITIZEN,
        SOURCE_TYPES.SOCIAL,
        SOURCE_TYPES.NEWS,
        SOURCE_TYPES.REDDIT,
        SOURCE_TYPES.GDELT,
        SOURCE_TYPES.RELIEFWEB,
        "citizen",
        "social",
        "news",
        "reddit",
        "gdelt",
        "reliefweb",
      ];
      let llmAnalysis = null;
      if (isLLMEnabled() && ambiguousSources.includes(sourceType)) {
        try {
          llmAnalysis = await analyzeDisasterEvent(normalized);
        } catch (llmError) {
          console.warn(`[Pipeline:${pipelineId}] LLM analysis note:`, llmError.message);
        }
      }

      // ─── Step 2b: Deterministic Classifier ───
      const classification = classifier.classify(normalized);

      if (llmAnalysis && llmAnalysis.source === "llm" && llmAnalysis.confidence > classification.confidence) {
        classification.disasterType = llmAnalysis.disasterType;
        classification.confidence = Math.max(classification.confidence, llmAnalysis.confidence);
        classification.llmEnhanced = true;
        classification.llmSummary = llmAnalysis.summary;
        classification.llmEntities = llmAnalysis.extractedEntities;
        classification.llmReasoning = llmAnalysis.reasoning;
      }

      normalized.classification = classification;

      // ─── Step 3: Cluster — Match or create incident ───
      const clusterResult = await clusterService.matchOrCreate(normalized);
      console.log(
        `[Pipeline:${pipelineId}] Cluster Result: incident=${clusterResult.incidentId} ` +
        `(${clusterResult.isNew ? "NEW" : "UPDATED/MERGED"}, matchScore: ${clusterResult.matchScore.toFixed(2)})`
      );

      // ─── Step 4: Fetch incident sources for confidence & verification calculation ───
      const db = getDb();
      const sourcesSnap = await db
        .collection(COLLECTIONS.INCIDENT_SOURCES)
        .where("incidentId", "==", clusterResult.incidentId)
        .get();

      const sources = sourcesSnap.docs.map((d) => d.data());
      const hasSensor = sources.some(
        (s) => s.sourceType === SOURCE_TYPES.SENSOR || s.sourceType === SOURCE_TYPES.USGS || s.sourceType === "usgs"
      );
      const sensorMeta = normalized.metadata || {};

      // Calculate geographic spread
      const lats = sources.map((s) => s.location?.latitude).filter((v) => typeof v === "number" && v !== 0);
      const lons = sources.map((s) => s.location?.longitude).filter((v) => typeof v === "number" && v !== 0);
      const geoSpread = this._calcSpreadKm(lats, lons);

      // Calculate time spread
      const times = sources
        .map((s) => s.timestamp?.toMillis?.() || (s.timestamp instanceof Date ? s.timestamp.getTime() : new Date(s.timestamp || 0).getTime()))
        .filter((t) => t > 0);
      const timeSpread = times.length > 1 ? Math.max(...times) - Math.min(...times) : 0;

      // ─── Step 5: Traceable Confidence Score ───
      const confidenceResult = confidenceEngine.calculate({
        sources: sources.map((s) => ({ sourceType: s.sourceType, sourceId: s.sourceId })),
        hasSensorCorroboration: hasSensor,
        geographicSpreadKm: geoSpread,
        timeSpreadMs: timeSpread,
        classifierConfidence: classification.confidence,
      });

      // ─── Step 6: Severity Calculation ───
      const incidentDoc = await db.collection(COLLECTIONS.INCIDENTS).doc(clusterResult.incidentId).get();
      const currentIncident = incidentDoc.data() || {};

      const severityResult = severityEngine.calculate({
        reportedCasualties: Number(sensorMeta.casualties || normalized.metadata?.casualties) || 0,
        affectedPopulation: Number(sensorMeta.affectedCount || normalized.metadata?.affectedCount) || 0,
        infrastructureDamage: classification.urgency === "critical" ? 0.7 : classification.urgency === "high" ? 0.4 : 0.1,
        geographicSpreadKm: geoSpread,
        sensorExceedance: sensorMeta.exceedance || 0,
        sourceCount: sources.length,
        rateOfChange: clusterResult.isNew ? 0.3 : 0.6,
        currentSeverity: currentIncident.severity || null,
      });

      // ─── Step 7: Strict Verification Status (Rule 7) ───
      const uniqueSourceTypes = new Set(sources.map((s) => s.sourceType)).size;
      const isOfficialConfirmed =
        (sourceType === SOURCE_TYPES.USGS && normalized.metadata?.status === "reviewed") ||
        (sources.some((s) => s.sourceType === SOURCE_TYPES.GOVERNMENT || s.sourceType === "government_agency")) ||
        (hasSensor && uniqueSourceTypes >= 2);

      let verificationStatus = VERIFICATION_STATUS.UNVERIFIED;
      let isVerified = false;

      if (isOfficialConfirmed) {
        verificationStatus = VERIFICATION_STATUS.OFFICIALLY_CONFIRMED;
        isVerified = true;
      } else if (uniqueSourceTypes >= 2 || sources.length >= 2) {
        verificationStatus = VERIFICATION_STATUS.CORROBORATED;
        isVerified = false; // Corroborated, but not officially confirmed
      } else {
        verificationStatus = VERIFICATION_STATUS.UNVERIFIED;
        isVerified = false;
      }

      const nowIso = new Date().toISOString();
      const sourceUpdatedAt = normalized.source_updated_at || (normalized.timestamp ? new Date(normalized.timestamp).toISOString() : nowIso);

      const update = {
        severity: severityResult.severity,
        confidence: confidenceResult.confidence,
        confidencePercent: confidenceResult.confidencePercent,
        confidenceFactors: confidenceResult.factors,
        confidenceExplanation: confidenceResult.explanation,
        severityFactors: severityResult.factors,
        verified: isVerified,
        verificationStatus,
        sourceCount: sources.length,
        source_status: normalized.source_status || SOURCE_STATUS.CURRENT,
        application_status: APPLICATION_STATUS.LIVE,
        event_time: normalized.event_time || sourceUpdatedAt,
        source_updated_at: sourceUpdatedAt,
        last_seen_at: nowIso,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (severityResult.escalated) {
        update.previousSeverity = severityResult.previousSeverity;
        update.escalatedAt = admin.firestore.FieldValue.serverTimestamp();
      }

      await db.collection(COLLECTIONS.INCIDENTS).doc(clusterResult.incidentId).update(update);

      // ─── Step 8: Alert evaluation ───
      let alertResult = { shouldAlert: false, alert: null };
      try {
        alertResult = await alertEngine.evaluate(
          {
            id: clusterResult.incidentId,
            ...currentIncident,
            ...update,
            title: currentIncident.title || normalized.title,
            disasterType: currentIncident.disasterType || classification.disasterType,
            location: currentIncident.location || normalized.location,
          },
          {
            isEscalation: severityResult.escalated,
            previousSeverity: severityResult.previousSeverity,
            sensorExceedance: sensorMeta.exceedance || 0,
          }
        );
      } catch (alertError) {
        console.warn(`[Pipeline:${pipelineId}] Alert check warning:`, alertError.message);
      }

      // ─── Step 9: Generate recommendations ───
      let recommendations = null;
      if (severityResult.severity === "critical" || severityResult.severity === "high") {
        recommendations = recommendationEngine.generate({
          disasterType: classification.disasterType,
          severity: severityResult.severity,
          location: normalized.location,
          confidence: confidenceResult.confidence || 0.7,
          sourceCount: sources.length,
        });

        await db.collection(COLLECTIONS.RECOMMENDATIONS).add({
          incidentId: clusterResult.incidentId,
          ...recommendations,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // ─── Step 10: Write to intelligence feed ───
      await db.collection(COLLECTIONS.INTELLIGENCE).add({
        source: this._sourceLabel(sourceType),
        handle: normalized.source_event_id || normalized.sourceId,
        text: normalized.text,
        urgency: classification.urgency === "critical" ? "Critical" : classification.urgency === "high" ? "High" : "Moderate",
        sentiment: this._sentimentLabel(classification),
        media: (normalized.media && normalized.media[0]) || null,
        confidence: confidenceResult.confidencePercent || 70,
        incidentId: clusterResult.incidentId,
        disasterType: classification.disasterType,
        source_url: normalized.source_url || "",
        processedBy: "DisasterLens Live Pipeline",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // ─── Step 11: Audit log ───
      await db.collection(COLLECTIONS.AUDIT_LOGS).add({
        action: clusterResult.isNew ? "INCIDENT_INGESTED_LIVE" : "INCIDENT_UPDATED_LIVE",
        details: `${sourceType} (${normalized.source_event_id}) → ${classification.disasterType} [${severityResult.severity}] | ${verificationStatus}`,
        user: "LIVE_PIPELINE",
        ip: "internal",
        status: "Live Synchronized",
        pipelineId,
        incidentId: clusterResult.incidentId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // ─── Update stats ───
      this.stats.processed++;
      if (clusterResult.isNew) this.stats.incidents_created++;
      else this.stats.incidents_merged++;
      if (alertResult.shouldAlert) this.stats.alerts_triggered++;
      this.stats.lastProcessedAt = new Date().toISOString();

      const processingTime = Date.now() - startTime;
      console.log(`[Pipeline:${pipelineId}] Completed in ${processingTime}ms (${verificationStatus}, ${confidenceResult.confidencePercent}%)`);

      return {
        success: true,
        pipelineId,
        incidentId: clusterResult.incidentId,
        isNew: clusterResult.isNew,
        classification,
        severity: severityResult,
        confidence: confidenceResult,
        verificationStatus,
        alert: alertResult,
        recommendations,
        processingTimeMs: processingTime,
      };
    } catch (error) {
      this.stats.errors++;
      console.error(`[Pipeline:${pipelineId}] ERROR:`, error);
      return {
        success: false,
        pipelineId,
        error: error.message,
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  _sourceLabel(sourceType) {
    const labels = {
      [SOURCE_TYPES.CITIZEN]: "Citizen Report",
      [SOURCE_TYPES.NEWS]: "News Wire",
      [SOURCE_TYPES.SENSOR]: "IoT Sensor Network",
      [SOURCE_TYPES.SOCIAL]: "Social Stream",
      [SOURCE_TYPES.SATELLITE]: "Satellite Imagery",
      [SOURCE_TYPES.GOVERNMENT]: "Government Agency",
      [SOURCE_TYPES.REDDIT]: "Reddit Intelligence",
      [SOURCE_TYPES.USGS]: "USGS Earthquake Hazard Feed",
      [SOURCE_TYPES.EONET]: "NASA EONET Observatory",
      [SOURCE_TYPES.GDACS]: "GDACS Global Alert Feed",
      [SOURCE_TYPES.GDELT]: "GDELT News Monitor",
      [SOURCE_TYPES.RELIEFWEB]: "ReliefWeb Reports",
      [SOURCE_TYPES.OPEN_METEO]: "Open-Meteo Weather Service",
    };
    return labels[sourceType] || sourceType;
  }

  _sentimentLabel(classification) {
    if (classification.urgency === "critical") return "Crisis";
    if (classification.urgency === "high") return "Urgent";
    if (classification.urgency === "moderate") return "Alert";
    return "Advisory";
  }

  getStats() {
    return { ...this.stats };
  }
}

export const pipeline = new ProcessingPipeline();

/**
 * Calculate geographic spread in km from arrays of lat/lon.
 */
ProcessingPipeline.prototype._calcSpreadKm = function (lats, lons) {
  if (lats.length < 2) return 0;
  let maxDist = 0;
  for (let i = 0; i < lats.length; i++) {
    for (let j = i + 1; j < lats.length; j++) {
      const dist = haversineKm(lats[i], lons[i], lats[j], lons[j]);
      if (dist > maxDist) maxDist = dist;
    }
  }
  return maxDist;
};

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
