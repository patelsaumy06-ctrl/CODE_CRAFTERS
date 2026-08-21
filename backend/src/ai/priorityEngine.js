import { PRIORITY } from "../config/constants.js";

/**
 * Operational Priority Engine — DisasterLens AI
 *
 * Computes an operational priority score (0–100) and priority level
 * (LOW, MEDIUM, HIGH, CRITICAL) for emergency dispatchers and commanders.
 *
 * Formula:
 * Priority Score = Severity Weight (0-40) + Confidence Weight (0-30) +
 *                  Evidence Count Weight (0-20) + Recency Weight (0-10)
 */
export class PriorityEngine {
  /**
   * Calculate operational priority score and level.
   *
   * @param {Object} params
   * @param {string} params.severity - "critical" | "high" | "medium" | "low"
   * @param {number} params.confidence - 0 to 1 (or 0 to 100)
   * @param {number} params.sourceCount - Number of supporting evidence sources
   * @param {string|Date|number} params.eventTime - Occurrence / update timestamp
   * @returns {{ priority: string, priorityScore: number, factors: Object[] }}
   */
  calculate({
    severity = "medium",
    confidence = 0.7,
    sourceCount = 1,
    eventTime = new Date(),
  }) {
    const factors = [];

    // 1. Severity Component (0 - 40 points)
    const sev = String(severity || "medium").toLowerCase();
    let severityPts = 16;
    if (sev === "critical") severityPts = 40;
    else if (sev === "high") severityPts = 28;
    else if (sev === "medium") severityPts = 16;
    else severityPts = 6;

    factors.push({
      factor: "Severity Urgency",
      points: severityPts,
      maxPoints: 40,
      detail: `${sev.toUpperCase()} hazard level`,
    });

    // 2. Confidence Component (0 - 30 points)
    const confVal = Number(confidence) <= 1 ? Number(confidence) : Number(confidence) / 100;
    const normalizedConf = Math.max(0, Math.min(isNaN(confVal) ? 0.7 : confVal, 1));
    const confidencePts = Math.round(normalizedConf * 30);

    factors.push({
      factor: "Intelligence Confidence",
      points: confidencePts,
      maxPoints: 30,
      detail: `${Math.round(normalizedConf * 100)}% verified confidence`,
    });

    // 3. Evidence / Corroboration Component (0 - 20 points)
    const count = Math.max(Number(sourceCount) || 1, 1);
    const countScore = Math.min(count / 5, 1);
    const evidencePts = Math.round(countScore * 20);

    factors.push({
      factor: "Evidence Corroboration",
      points: evidencePts,
      maxPoints: 20,
      detail: `${count} independent source(s)`,
    });

    // 4. Event Recency Component (0 - 10 points)
    const now = Date.now();
    const ts = eventTime instanceof Date ? eventTime.getTime() : new Date(eventTime || 0).getTime();
    const ageHours = isNaN(ts) || ts <= 0 ? 1 : Math.max(0, (now - ts) / (3600 * 1000));

    let recencyPts = 10;
    if (ageHours <= 6) recencyPts = 10;
    else if (ageHours <= 24) recencyPts = 7;
    else if (ageHours <= 48) recencyPts = 4;
    else recencyPts = 2;

    factors.push({
      factor: "Operational Recency",
      points: recencyPts,
      maxPoints: 10,
      detail: ageHours < 1 ? "Under 1 hour fresh" : `~${Math.round(ageHours)}h elapsed`,
    });

    // Total Priority Score (0 - 100)
    const priorityScore = Math.min(100, Math.max(0, severityPts + confidencePts + evidencePts + recencyPts));

    // Map to Priority Classification
    let priority = PRIORITY.LOW;
    if (priorityScore >= 75) {
      priority = PRIORITY.CRITICAL;
    } else if (priorityScore >= 50) {
      priority = PRIORITY.HIGH;
    } else if (priorityScore >= 25) {
      priority = PRIORITY.MEDIUM;
    } else {
      priority = PRIORITY.LOW;
    }

    return {
      priority,
      priorityScore,
      factors,
    };
  }
}

export const priorityEngine = new PriorityEngine();
export default priorityEngine;
