import { CONFIDENCE_WEIGHTS, SOURCE_RELIABILITY, CLUSTERING } from "../config/constants.js";

/**
 * Explainable Confidence Scoring Engine
 *
 * Produces a confidence score with a full factor breakdown,
 * so operators can understand WHY a report is rated at a given level.
 */
export class ConfidenceEngine {
  /**
   * Calculate confidence score for an incident cluster.
   *
   * @param {Object} params
   * @param {Object[]} params.sources - Array of { sourceType, timestamp, location, text }
   * @param {boolean} params.hasSensorCorroboration - Sensor data confirms the event
   * @param {number} params.geographicSpreadKm - Spread of reports in km
   * @param {number} params.timeSpreadMs - Time window of reports in ms
   * @param {number} params.classifierConfidence - AI classifier's raw confidence (0-1)
   *
   * @returns {{ confidence: number, factors: Object[], breakdown: Object }}
   */
  calculate({ sources = [], hasSensorCorroboration = false, geographicSpreadKm = 0, timeSpreadMs = 0, classifierConfidence = 0.5 }) {
    const factors = [];
    const breakdown = {};

    // ─── Factor 1: Source Reliability (weighted average) ───
    const reliabilityScores = sources.map(
      (s) => SOURCE_RELIABILITY[s.sourceType] || 0.5
    );
    const avgReliability = reliabilityScores.length > 0
      ? reliabilityScores.reduce((a, b) => a + b, 0) / reliabilityScores.length
      : 0.5;

    breakdown.sourceReliability = avgReliability;
    factors.push({
      factor: "Source Reliability",
      score: Number(avgReliability.toFixed(3)),
      weight: CONFIDENCE_WEIGHTS.SOURCE_RELIABILITY,
      detail: `Average reliability of ${sources.length} source(s): ${(avgReliability * 100).toFixed(1)}%`,
    });

    // ─── Factor 2: Source Count ───
    const sourceCountScore = Math.min(sources.length / CLUSTERING.MIN_SOURCES_FOR_VERIFIED, 1);
    breakdown.sourceCount = sourceCountScore;
    factors.push({
      factor: "Source Corroboration Count",
      score: Number(sourceCountScore.toFixed(3)),
      weight: CONFIDENCE_WEIGHTS.SOURCE_COUNT,
      detail: `${sources.length} source(s) vs. ${CLUSTERING.MIN_SOURCES_FOR_VERIFIED} needed for verified`,
    });

    // ─── Factor 3: Sensor Corroboration ───
    const sensorScore = hasSensorCorroboration ? 1.0 : 0.0;
    breakdown.sensorCorroboration = sensorScore;
    factors.push({
      factor: "Sensor Corroboration",
      score: sensorScore,
      weight: CONFIDENCE_WEIGHTS.SENSOR_CORROBORATION,
      detail: hasSensorCorroboration
        ? "Confirmed by IoT/sensor data"
        : "No sensor corroboration available",
    });

    // ─── Factor 4: Geographic Consistency ───
    const maxDist = CLUSTERING.MAX_DISTANCE_KM;
    const geoScore = geographicSpreadKm <= maxDist
      ? 1 - (geographicSpreadKm / maxDist) * 0.5
      : Math.max(0.2, 1 - geographicSpreadKm / (maxDist * 3));
    breakdown.geographicConsistency = Number(geoScore.toFixed(3));
    factors.push({
      factor: "Geographic Consistency",
      score: Number(geoScore.toFixed(3)),
      weight: CONFIDENCE_WEIGHTS.GEOGRAPHIC_CONSISTENCY,
      detail: `Reports spread across ${geographicSpreadKm.toFixed(1)} km (threshold: ${maxDist} km)`,
    });

    // ─── Factor 5: Time Consistency ───
    const maxTime = CLUSTERING.MAX_TIME_WINDOW_MS;
    const timeScore = timeSpreadMs <= maxTime
      ? 1 - (timeSpreadMs / maxTime) * 0.3
      : Math.max(0.2, 1 - timeSpreadMs / (maxTime * 2));
    breakdown.timeConsistency = Number(timeScore.toFixed(3));
    factors.push({
      factor: "Temporal Consistency",
      score: Number(timeScore.toFixed(3)),
      weight: CONFIDENCE_WEIGHTS.TIME_CONSISTENCY,
      detail: `Reports span ${(timeSpreadMs / 60000).toFixed(0)} minutes (window: ${maxTime / 60000} min)`,
    });

    // ─── Factor 6: Semantic/Classifier Confidence ───
    breakdown.semanticSimilarity = Number(classifierConfidence.toFixed(3));
    factors.push({
      factor: "AI Classification Confidence",
      score: Number(classifierConfidence.toFixed(3)),
      weight: CONFIDENCE_WEIGHTS.SEMANTIC_SIMILARITY,
      detail: `Classifier returned ${(classifierConfidence * 100).toFixed(1)}% confidence`,
    });

    // ─── Weighted Sum ───
    const confidence =
      avgReliability * CONFIDENCE_WEIGHTS.SOURCE_RELIABILITY +
      sourceCountScore * CONFIDENCE_WEIGHTS.SOURCE_COUNT +
      sensorScore * CONFIDENCE_WEIGHTS.SENSOR_CORROBORATION +
      geoScore * CONFIDENCE_WEIGHTS.GEOGRAPHIC_CONSISTENCY +
      timeScore * CONFIDENCE_WEIGHTS.TIME_CONSISTENCY +
      classifierConfidence * CONFIDENCE_WEIGHTS.SEMANTIC_SIMILARITY;

    return {
      confidence: Number(Math.min(confidence, 1).toFixed(3)),
      factors,
      breakdown,
    };
  }
}

export const confidenceEngine = new ConfidenceEngine();
