import { SEVERITY, SEVERITY_WEIGHTS, SEVERITY_ORDER } from "../config/constants.js";

/**
 * Severity Calculation Engine
 *
 * Computes incident severity (LOW/MEDIUM/HIGH/CRITICAL) from
 * multiple configurable weighted factors.
 */
export class SeverityEngine {
  /**
   * Calculate severity for an incident.
   *
   * @param {Object} params
   * @param {number} params.reportedCasualties - Number of casualties/injuries (0+)
   * @param {number} params.affectedPopulation - Estimated people affected (0+)
   * @param {number} params.infrastructureDamage - 0-1 scale of damage
   * @param {number} params.geographicSpreadKm - Area covered
   * @param {number} params.sensorExceedance - How far above threshold (0-1)
   * @param {number} params.sourceCount - Number of independent sources
   * @param {number} params.rateOfChange - Escalation rate (0-1)
   * @param {string} params.currentSeverity - Current severity to prevent downgrade
   *
   * @returns {{ severity, score, factors[], previousSeverity, escalated }}
   */
  calculate({
    reportedCasualties = 0,
    affectedPopulation = 0,
    infrastructureDamage = 0,
    geographicSpreadKm = 0,
    sensorExceedance = 0,
    sourceCount = 1,
    rateOfChange = 0,
    currentSeverity = null,
  }) {
    const factors = [];

    // ─── Factor 1: Reported Casualties ───
    const casualtyScore = Math.min(reportedCasualties / 50, 1);
    factors.push({
      factor: "Reported Casualties / Injuries",
      score: Number(casualtyScore.toFixed(3)),
      weight: SEVERITY_WEIGHTS.REPORTED_CASUALTIES,
      detail: `${reportedCasualties} casualties reported`,
    });

    // ─── Factor 2: Affected Population ───
    const popScore = Math.min(affectedPopulation / 10000, 1);
    factors.push({
      factor: "Affected Population",
      score: Number(popScore.toFixed(3)),
      weight: SEVERITY_WEIGHTS.AFFECTED_POPULATION,
      detail: `~${affectedPopulation.toLocaleString()} people affected`,
    });

    // ─── Factor 3: Infrastructure Damage ───
    const infraScore = Math.min(Math.max(infrastructureDamage, 0), 1);
    factors.push({
      factor: "Infrastructure Damage",
      score: Number(infraScore.toFixed(3)),
      weight: SEVERITY_WEIGHTS.INFRASTRUCTURE_DAMAGE,
      detail: `${(infraScore * 100).toFixed(0)}% infrastructure impact`,
    });

    // ─── Factor 4: Geographic Spread ───
    const geoScore = Math.min(geographicSpreadKm / 100, 1);
    factors.push({
      factor: "Geographic Spread",
      score: Number(geoScore.toFixed(3)),
      weight: SEVERITY_WEIGHTS.GEOGRAPHIC_SPREAD,
      detail: `Spread across ${geographicSpreadKm.toFixed(1)} km`,
    });

    // ─── Factor 5: Sensor Thresholds ───
    const sensorScore = Math.min(Math.max(sensorExceedance, 0), 1);
    factors.push({
      factor: "Sensor Threshold Exceedance",
      score: Number(sensorScore.toFixed(3)),
      weight: SEVERITY_WEIGHTS.SENSOR_THRESHOLDS,
      detail: sensorExceedance > 0
        ? `Sensor readings ${(sensorExceedance * 100).toFixed(0)}% above threshold`
        : "No sensor threshold breach",
    });

    // ─── Factor 6: Source Corroboration ───
    const corrobScore = Math.min(sourceCount / 5, 1);
    factors.push({
      factor: "Source Corroboration",
      score: Number(corrobScore.toFixed(3)),
      weight: SEVERITY_WEIGHTS.SOURCE_CORROBORATION,
      detail: `${sourceCount} independent source(s)`,
    });

    // ─── Factor 7: Rate of Change ───
    const rateScore = Math.min(Math.max(rateOfChange, 0), 1);
    factors.push({
      factor: "Rate of Escalation",
      score: Number(rateScore.toFixed(3)),
      weight: SEVERITY_WEIGHTS.RATE_OF_CHANGE,
      detail: rateOfChange > 0.5 ? "Rapidly escalating" : "Stable or slowly developing",
    });

    // ─── Weighted Sum ───
    const totalScore =
      casualtyScore * SEVERITY_WEIGHTS.REPORTED_CASUALTIES +
      popScore * SEVERITY_WEIGHTS.AFFECTED_POPULATION +
      infraScore * SEVERITY_WEIGHTS.INFRASTRUCTURE_DAMAGE +
      geoScore * SEVERITY_WEIGHTS.GEOGRAPHIC_SPREAD +
      sensorScore * SEVERITY_WEIGHTS.SENSOR_THRESHOLDS +
      corrobScore * SEVERITY_WEIGHTS.SOURCE_CORROBORATION +
      rateScore * SEVERITY_WEIGHTS.RATE_OF_CHANGE;

    // Map score to severity level
    let severity;
    if (totalScore >= 0.75) severity = SEVERITY.CRITICAL;
    else if (totalScore >= 0.50) severity = SEVERITY.HIGH;
    else if (totalScore >= 0.25) severity = SEVERITY.MEDIUM;
    else severity = SEVERITY.LOW;

    // Never downgrade severity
    const escalated =
      currentSeverity &&
      SEVERITY_ORDER[severity] > SEVERITY_ORDER[currentSeverity];

    if (currentSeverity && SEVERITY_ORDER[currentSeverity] > SEVERITY_ORDER[severity]) {
      severity = currentSeverity;
    }

    return {
      severity,
      score: Number(totalScore.toFixed(3)),
      factors,
      previousSeverity: currentSeverity,
      escalated: Boolean(escalated),
    };
  }
}

export const severityEngine = new SeverityEngine();
