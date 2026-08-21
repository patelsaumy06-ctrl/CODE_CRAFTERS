import { CONFIDENCE_WEIGHTS, SOURCE_RELIABILITY, CLUSTERING } from "../config/constants.js";

/**
 * Explainable Confidence Scoring Engine — DisasterLens AI
 *
 * Produces a traceable confidence score with a detailed factor breakdown,
 * so operators and automated systems understand WHY an incident is rated at a given level.
 */
export class ConfidenceEngine {
  /**
   * Calculate confidence score for an incident cluster.
   *
   * @param {Object} params
   * @param {Object[]} params.sources - Array of { sourceType, sourceId, timestamp, location, text }
   * @param {boolean} params.hasSensorCorroboration - Sensor data confirms the event
   * @param {number} params.geographicSpreadKm - Spread of reports in km
   * @param {number} params.timeSpreadMs - Time window of reports in ms
   * @param {number} params.classifierConfidence - AI classifier's raw confidence (0-1)
   *
   * @returns {{ confidence: number|null, confidencePercent: number|null, factors: Object[], explanation: string, breakdown: Object }}
   */
  calculate({
    sources = [],
    hasSensorCorroboration = false,
    geographicSpreadKm = 0,
    timeSpreadMs = 0,
    classifierConfidence = 0.5,
  }) {
    if (!Array.isArray(sources) || sources.length === 0) {
      return {
        confidence: null,
        confidencePercent: null,
        factors: [],
        explanation: "Confidence: Not calculated (No source records provided)",
        breakdown: {},
      };
    }

    const factors = [];
    const breakdown = {};

    // ─── Factor 1: Source Reliability (weighted average) ───
    const reliabilityScores = sources.map(
      (s) => SOURCE_RELIABILITY[s.sourceType || s.source] || 0.6
    );
    const avgReliability =
      reliabilityScores.reduce((a, b) => a + b, 0) / reliabilityScores.length;

    const sourceRelContribution = avgReliability * CONFIDENCE_WEIGHTS.SOURCE_RELIABILITY;
    breakdown.sourceReliability = avgReliability;
    factors.push({
      factor: "Authoritative Source Reliability",
      score: Number(avgReliability.toFixed(3)),
      weight: CONFIDENCE_WEIGHTS.SOURCE_RELIABILITY,
      contributionPercent: Math.round(sourceRelContribution * 100),
      detail: `Average reliability across ${sources.length} authoritative source(s): ${(avgReliability * 100).toFixed(1)}%`,
    });

    // ─── Factor 2: Independent Corroboration Count ───
    const uniqueSourceTypes = new Set(sources.map((s) => s.sourceType || s.source)).size;
    const sourceCountScore = Math.min(
      (sources.length * 0.6 + uniqueSourceTypes * 0.4) / CLUSTERING.MIN_SOURCES_FOR_VERIFIED,
      1
    );
    const countContribution = sourceCountScore * CONFIDENCE_WEIGHTS.SOURCE_COUNT;
    breakdown.sourceCount = sourceCountScore;
    factors.push({
      factor: "Multi-Source Corroboration",
      score: Number(sourceCountScore.toFixed(3)),
      weight: CONFIDENCE_WEIGHTS.SOURCE_COUNT,
      contributionPercent: Math.round(countContribution * 100),
      detail: `${sources.length} source record(s) (${uniqueSourceTypes} independent provider${uniqueSourceTypes > 1 ? "s" : ""})`,
    });

    // ─── Factor 3: Sensor / Telemetry Corroboration ───
    const sensorScore = hasSensorCorroboration ? 1.0 : 0.0;
    const sensorContribution = sensorScore * CONFIDENCE_WEIGHTS.SENSOR_CORROBORATION;
    breakdown.sensorCorroboration = sensorScore;
    factors.push({
      factor: "Sensor & Ground Telemetry",
      score: sensorScore,
      weight: CONFIDENCE_WEIGHTS.SENSOR_CORROBORATION,
      contributionPercent: Math.round(sensorContribution * 100),
      detail: hasSensorCorroboration
        ? "Corroborated by physical sensor / seismic network"
        : "No direct sensor cross-reference",
    });

    // ─── Factor 4: Geographic Consistency ───
    const maxDist = CLUSTERING.MAX_DISTANCE_KM;
    const geoScore =
      geographicSpreadKm <= maxDist
        ? 1 - (geographicSpreadKm / maxDist) * 0.4
        : Math.max(0.2, 1 - geographicSpreadKm / (maxDist * 3));
    const geoContribution = geoScore * CONFIDENCE_WEIGHTS.GEOGRAPHIC_CONSISTENCY;
    breakdown.geographicConsistency = Number(geoScore.toFixed(3));
    factors.push({
      factor: "Geographic Coherence",
      score: Number(geoScore.toFixed(3)),
      weight: CONFIDENCE_WEIGHTS.GEOGRAPHIC_CONSISTENCY,
      contributionPercent: Math.round(geoContribution * 100),
      detail: `Geographic distribution clustered within ${geographicSpreadKm.toFixed(1)} km`,
    });

    // ─── Factor 5: Temporal Consistency ───
    const maxTime = CLUSTERING.MAX_TIME_WINDOW_MS;
    const timeScore =
      timeSpreadMs <= maxTime
        ? 1 - (timeSpreadMs / maxTime) * 0.3
        : Math.max(0.2, 1 - timeSpreadMs / (maxTime * 2));
    const timeContribution = timeScore * CONFIDENCE_WEIGHTS.TIME_CONSISTENCY;
    breakdown.timeConsistency = Number(timeScore.toFixed(3));
    factors.push({
      factor: "Temporal Coherence",
      score: Number(timeScore.toFixed(3)),
      weight: CONFIDENCE_WEIGHTS.TIME_CONSISTENCY,
      contributionPercent: Math.round(timeContribution * 100),
      detail: `Event timestamps synchronized within ${(timeSpreadMs / 60000).toFixed(0)} minutes`,
    });

    // ─── Factor 6: Semantic / AI Classification ───
    const clampedClassifier = Math.max(0, Math.min(1, Number(classifierConfidence) || 0.5));
    const semanticContribution = clampedClassifier * CONFIDENCE_WEIGHTS.SEMANTIC_SIMILARITY;
    breakdown.semanticSimilarity = Number(clampedClassifier.toFixed(3));
    factors.push({
      factor: "Classification Consistency",
      score: Number(clampedClassifier.toFixed(3)),
      weight: CONFIDENCE_WEIGHTS.SEMANTIC_SIMILARITY,
      contributionPercent: Math.round(semanticContribution * 100),
      detail: `Classifier consistency score: ${(clampedClassifier * 100).toFixed(0)}%`,
    });

    // ─── Weighted Sum ───
    const rawConfidence =
      sourceRelContribution +
      countContribution +
      sensorContribution +
      geoContribution +
      timeContribution +
      semanticContribution;

    const confidence = Number(Math.max(0.1, Math.min(rawConfidence, 1)).toFixed(3));
    const confidencePercent = Math.round(confidence * 100);

    const explanation = `Calculated confidence: ${confidencePercent}% based on ${sources.length} source(s) and multi-factor verification.`;

    return {
      confidence,
      confidencePercent,
      factors,
      explanation,
      breakdown,
    };
  }
}

export const confidenceEngine = new ConfidenceEngine();
export default confidenceEngine;
