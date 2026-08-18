import { normalizer } from "../ingestion/normalizer.js";
import { classifier } from "../ai/classifier.js";
import { analyzeDisasterEvent, isLLMEnabled } from "../ai/llmService.js";
import { confidenceEngine } from "../ai/confidenceEngine.js";
import { severityEngine } from "../ai/severityEngine.js";
import { clusterService } from "../clustering/clusterService.js";
import { alertEngine } from "../alerts/alertEngine.js";
import { recommendationEngine } from "../recommendations/recommendationEngine.js";
import { getDb } from "../config/firebase.js";
import { COLLECTIONS, SOURCE_TYPES } from "../config/constants.js";
import admin from "firebase-admin";

/**
 * Processing Pipeline Orchestrator
 *
 * Full flow: Normalize → Classify → Cluster → Score Confidence →
 *           Calculate Severity → Check Alert Rules → Generate Recommendations →
 *           Write to Firestore
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
   * @param {Object} rawData - Raw event data from any source
   * @returns {{ success, incidentId, isNew, severity, confidence, alert, recommendations, processingTime }}
   */
  async process(sourceType, rawData) {
    const startTime = Date.now();
    const pipelineId = `PL_${Date.now()}`;

    console.log(`[Pipeline:${pipelineId}] Starting — source: ${sourceType}`);

    try {
      // ─── Step 1: Normalize ───
      const normalized = normalizer.normalize(sourceType, rawData);
      console.log(`[Pipeline:${pipelineId}] Normalized: "${normalized.title}"`);

      // ─── Step 2a: LLM Analysis (optional enhancement) ───
      let llmAnalysis = null;
      if (isLLMEnabled()) {
        try {
          llmAnalysis = await analyzeDisasterEvent(normalized);
          console.log(`[Pipeline:${pipelineId}] LLM Analysis: ${llmAnalysis.disasterType} (source: ${llmAnalysis.source})`);
        } catch (llmError) {
          console.warn(`[Pipeline:${pipelineId}] LLM analysis failed, using deterministic classifier:`, llmError.message);
        }
      }

      // ─── Step 2b: Deterministic Classifier (always runs as authoritative fallback) ───
      const classification = classifier.classify(normalized);

      // Merge LLM insights if available and confident enough
      if (llmAnalysis && llmAnalysis.source === "llm" && llmAnalysis.confidence > classification.confidence) {
        classification.disasterType = llmAnalysis.disasterType;
        classification.confidence = Math.max(classification.confidence, llmAnalysis.confidence);
        classification.llmEnhanced = true;
        classification.llmSummary = llmAnalysis.summary;
        classification.llmEntities = llmAnalysis.extractedEntities;
        classification.llmReasoning = llmAnalysis.reasoning;
      }

      normalized.classification = classification;
      console.log(
        `[Pipeline:${pipelineId}] Classified: ${classification.disasterType} ` +
        `(confidence: ${(classification.confidence * 100).toFixed(1)}%, urgency: ${classification.urgency}` +
        `${classification.llmEnhanced ? ", LLM-enhanced" : ""})`
      );

      // ─── Step 3: Cluster — Match or create incident ───
      const clusterResult = await clusterService.matchOrCreate(normalized);
      console.log(
        `[Pipeline:${pipelineId}] Clustered: incident=${clusterResult.incidentId} ` +
        `(${clusterResult.isNew ? "NEW" : "MERGED"}, score: ${clusterResult.matchScore.toFixed(2)})`
      );

      // ─── Step 4: Fetch incident sources for confidence/severity calculation ───
      const db = getDb();
      const sourcesSnap = await db
        .collection(COLLECTIONS.INCIDENT_SOURCES)
        .where("incidentId", "==", clusterResult.incidentId)
        .get();

      const sources = sourcesSnap.docs.map((d) => d.data());
      const hasSensor = sources.some((s) => s.sourceType === SOURCE_TYPES.SENSOR);
      const sensorMeta = normalized.metadata || {};

      // Calculate geographic spread
      const lats = sources.map((s) => s.location?.latitude).filter(Boolean);
      const lons = sources.map((s) => s.location?.longitude).filter(Boolean);
      const geoSpread = this._calcSpreadKm(lats, lons);

      // Calculate time spread
      const times = sources
        .map((s) => s.timestamp?.toMillis?.() || s.timestamp?.getTime?.() || 0)
        .filter((t) => t > 0);
      const timeSpread = times.length > 1 ? Math.max(...times) - Math.min(...times) : 0;

      // ─── Step 5: Confidence Score ───
      const confidenceResult = confidenceEngine.calculate({
        sources: sources.map((s) => ({ sourceType: s.sourceType })),
        hasSensorCorroboration: hasSensor,
        geographicSpreadKm: geoSpread,
        timeSpreadMs: timeSpread,
        classifierConfidence: classification.confidence,
      });
      console.log(`[Pipeline:${pipelineId}] Confidence: ${(confidenceResult.confidence * 100).toFixed(1)}%`);

      // ─── Step 6: Severity ───
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
      console.log(
        `[Pipeline:${pipelineId}] Severity: ${severityResult.severity}` +
        `${severityResult.escalated ? " (ESCALATED)" : ""}`
      );

      // ─── Step 7: Update incident in Firestore ───
      const update = {
        severity: severityResult.severity,
        confidence: confidenceResult.confidence,
        confidenceFactors: confidenceResult.factors,
        severityFactors: severityResult.factors,
        verified: sources.length >= 3,
        sourceCount: sources.length,
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

        if (alertResult.shouldAlert) {
          console.log(`[Pipeline:${pipelineId}] ALERT TRIGGERED: ${alertResult.reason}`);
        }
      } catch (alertError) {
        console.warn(`[Pipeline:${pipelineId}] Alert evaluation error:`, alertError.message);
      }

      // ─── Step 9: Generate recommendations ───
      let recommendations = null;
      if (severityResult.severity === "critical" || severityResult.severity === "high") {
        recommendations = recommendationEngine.generate({
          disasterType: classification.disasterType,
          severity: severityResult.severity,
          location: normalized.location,
          confidence: confidenceResult.confidence,
          sourceCount: sources.length,
        });

        // Persist recommendations
        await db.collection(COLLECTIONS.RECOMMENDATIONS).add({
          incidentId: clusterResult.incidentId,
          ...recommendations,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // ─── Step 10: Write to intelligence feed ───
      await db.collection(COLLECTIONS.INTELLIGENCE).add({
        source: this._sourceLabel(sourceType),
        handle: normalized.sourceId,
        text: normalized.text,
        urgency: classification.urgency === "critical" ? "Critical" : classification.urgency === "high" ? "High" : "Moderate",
        sentiment: this._sentimentLabel(classification),
        media: (normalized.media && normalized.media[0]) || null,
        confidence: Math.round(confidenceResult.confidence * 100),
        incidentId: clusterResult.incidentId,
        disasterType: classification.disasterType,
        processedBy: "DisasterLens AI Pipeline",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // ─── Step 11: Audit log ───
      await db.collection(COLLECTIONS.AUDIT_LOGS).add({
        action: clusterResult.isNew ? "INCIDENT_CREATED_BY_PIPELINE" : "INCIDENT_UPDATED_BY_PIPELINE",
        details: `${sourceType} → ${classification.disasterType} (${severityResult.severity}) | Confidence: ${(confidenceResult.confidence * 100).toFixed(0)}%`,
        user: "PROCESSING_PIPELINE",
        ip: "internal",
        status: "Automated",
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
      console.log(`[Pipeline:${pipelineId}] Complete in ${processingTime}ms`);

      return {
        success: true,
        pipelineId,
        incidentId: clusterResult.incidentId,
        isNew: clusterResult.isNew,
        classification,
        severity: severityResult,
        confidence: confidenceResult,
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
      [SOURCE_TYPES.CITIZEN]: "Citizen Report App",
      [SOURCE_TYPES.NEWS]: "News Wire Service",
      [SOURCE_TYPES.SENSOR]: "IoT Sensor Network",
      [SOURCE_TYPES.SOCIAL]: "Social Media Stream",
      [SOURCE_TYPES.SATELLITE]: "Satellite Imagery",
      [SOURCE_TYPES.GOVERNMENT]: "Government Agency",
      [SOURCE_TYPES.REDDIT]: "Reddit Intelligence",
      "reddit": "Reddit Intelligence",
    };
    return labels[sourceType] || sourceType;
  }

  _sentimentLabel(classification) {
    if (classification.urgency === "critical") return "Panic / Crisis";
    if (classification.urgency === "high") return "Alarm / Urgent";
    if (classification.urgency === "moderate") return "Concern / Alert";
    return "General Observation";
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
