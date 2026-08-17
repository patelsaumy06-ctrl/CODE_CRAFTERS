import { DISASTER_KEYWORDS, DISASTER_TYPES } from "../config/constants.js";

/**
 * Deterministic AI Disaster Classifier
 *
 * Classifies raw text + metadata into disaster type, urgency, and initial confidence.
 * Designed to be replaced with an actual ML/LLM API while keeping the same interface.
 */
export class DisasterClassifier {
  /**
   * Classify a normalized event.
   * @param {Object} event - { text, title, source, metadata }
   * @returns {{ disasterType, urgency, confidence, matchedKeywords[], classificationReason }}
   */
  classify(event) {
    const text = `${event.title || ""} ${event.text || ""} ${event.description || ""}`.toLowerCase();
    const scores = {};
    const matchedKeywords = {};

    // Score each disaster type by keyword matches
    for (const [type, keywords] of Object.entries(DISASTER_KEYWORDS)) {
      scores[type] = 0;
      matchedKeywords[type] = [];

      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          // Longer keywords score higher (more specific)
          const weight = Math.min(keyword.split(" ").length * 1.5, 4);
          scores[type] += weight;
          matchedKeywords[type].push(keyword);
        }
      }
    }

    // Find the top-scoring type
    const sortedTypes = Object.entries(scores)
      .filter(([, score]) => score > 0)
      .sort((a, b) => b[1] - a[1]);

    if (sortedTypes.length === 0) {
      return {
        disasterType: DISASTER_TYPES.OTHER,
        urgency: "low",
        confidence: 0.3,
        matchedKeywords: [],
        classificationReason: "No recognized disaster keywords found in text.",
      };
    }

    const [topType, topScore] = sortedTypes[0];
    const keywords = matchedKeywords[topType];

    // Calculate classification confidence (0-1)
    const maxPossible = DISASTER_KEYWORDS[topType].length * 2;
    const rawConfidence = Math.min(topScore / Math.max(maxPossible, 1), 1);
    const confidence = 0.4 + rawConfidence * 0.55; // Range: 0.4 - 0.95

    // Determine urgency from text signals
    const urgency = this._assessUrgency(text, confidence);

    return {
      disasterType: topType,
      urgency,
      confidence: Number(confidence.toFixed(3)),
      matchedKeywords: keywords,
      classificationReason: `Matched ${keywords.length} keyword(s) for "${topType}": ${keywords.slice(0, 5).join(", ")}`,
    };
  }

  /**
   * Assess urgency from text signals
   */
  _assessUrgency(text, confidence) {
    const criticalSignals = [
      "immediate", "emergency", "evacuate", "critical", "life-threatening",
      "casualties", "deaths", "trapped", "collapse", "breach", "explosion",
      "rescue needed", "sos", "mayday", "dire",
    ];
    const highSignals = [
      "warning", "danger", "severe", "rapidly", "escalating", "spreading",
      "rising fast", "alert", "threat", "hazardous",
    ];

    const criticalHits = criticalSignals.filter((s) => text.includes(s)).length;
    const highHits = highSignals.filter((s) => text.includes(s)).length;

    if (criticalHits >= 2 || (criticalHits >= 1 && confidence > 0.7)) return "critical";
    if (highHits >= 2 || criticalHits >= 1) return "high";
    if (highHits >= 1 || confidence > 0.6) return "moderate";
    return "low";
  }

  /**
   * Batch classify multiple events
   */
  classifyBatch(events) {
    return events.map((event) => ({
      ...event,
      classification: this.classify(event),
    }));
  }
}

export const classifier = new DisasterClassifier();
