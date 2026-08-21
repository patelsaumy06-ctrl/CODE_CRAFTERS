import { DISASTER_KEYWORDS, DISASTER_TYPES } from "../config/constants.js";

/**
 * Disaster Relevance Filter — DisasterLens AI
 *
 * Filters out irrelevant, metaphorical, political, sports, and entertainment news
 * before raw news wire events enter the heavy disaster processing pipeline.
 */
export class DisasterRelevanceFilter {
  constructor() {
    // False-positive metaphorical and non-disaster indicator terms
    this.metaphoricalSignals = [
      "landslide victory",
      "political landslide",
      "election landslide",
      "landslide win",
      "flood of calls",
      "flood of emails",
      "flood of applications",
      "flood of tears",
      "flood of complaints",
      "flood of tributes",
      "flood of comments",
      "flood of visitors",
      "flood of tourists",
      "flood of investors",
      "flood of money",
      "earthquake in politics",
      "political earthquake",
      "diplomatic earthquake",
      "economic earthquake",
      "cultural earthquake",
      "firepower",
      "firewall",
      "under fire",
      "opened fire",
      "friendly fire",
      "fire sale",
      "fired from job",
      "fire coach",
      "fire manager",
      "avalanche of questions",
      "avalanche of goals",
      "avalanche of bets",
      "perfect storm for markets",
      "storm of controversy",
      "twitter storm",
      "social media storm",
      "tsunami of debt",
      "tsunami of cases",
      "box office disaster",
      "movie disaster",
      "fashion disaster",
    ];

    // Positive physical disaster context confirmation signals
    this.emergencyContextSignals = [
      "evacuate", "evacuation", "evacuated",
      "rescue", "rescuers", "rescued", "search and rescue",
      "casualties", "fatalities", "deaths", "injured", "missing persons",
      "emergency services", "disaster management", "national guard", "red cross", "fema",
      "ndrf", "civil defence", "first responders",
      "water level", "submerged", "inundated", "inundation", "overflow", "embankment",
      "richter", "epicenter", "magnitude", "depth km", "seismic tremor", "aftershock",
      "hectares burned", "acres burned", "containment", "wildfire spreading", "forest blaze",
      "wind gust", "storm surge", "category 3", "category 4", "category 5", "cyclone warning",
      "debris flow", "mudslide", "rockfall", "slope failure",
      "damage to homes", "destroyed buildings", "infrastructure damaged", "power outage",
      "meteorological department", "weather bureau", "geological survey",
    ];
  }

  /**
   * Evaluate whether a raw news article is genuinely related to a disaster.
   *
   * @param {Object} article - { title, description, text, url }
   * @returns {{ isDisasterRelated: boolean, relevanceScore: number, disasterType: string, reason: string }}
   */
  evaluate(article) {
    const title = (article.title || "").toLowerCase();
    const text = `${title} ${article.description || ""} ${article.text || ""}`.toLowerCase();

    if (!text.trim()) {
      return {
        isDisasterRelated: false,
        relevanceScore: 0,
        disasterType: DISASTER_TYPES.OTHER,
        reason: "Empty content",
      };
    }

    // 1. Check for prominent metaphorical indicators
    for (const metaphor of this.metaphoricalSignals) {
      if (text.includes(metaphor)) {
        return {
          isDisasterRelated: false,
          relevanceScore: 0.1,
          disasterType: DISASTER_TYPES.OTHER,
          reason: `Filtered metaphorical/non-disaster phrase: "${metaphor}"`,
        };
      }
    }

    // 2. Score positive disaster hazard keywords
    const keywordMatches = [];
    let detectedType = DISASTER_TYPES.OTHER;
    let highestTypeScore = 0;

    for (const [type, keywords] of Object.entries(DISASTER_KEYWORDS)) {
      let typeScore = 0;
      for (const kw of keywords) {
        if (text.includes(kw)) {
          typeScore += kw.includes(" ") ? 2.0 : 1.0;
          keywordMatches.push(kw);
        }
      }
      if (typeScore > highestTypeScore) {
        highestTypeScore = typeScore;
        detectedType = type;
      }
    }

    if (highestTypeScore === 0) {
      return {
        isDisasterRelated: false,
        relevanceScore: 0.15,
        disasterType: DISASTER_TYPES.OTHER,
        reason: "No recognized disaster hazard keywords",
      };
    }

    // 3. Score emergency context signals
    const contextMatches = [];
    for (const signal of this.emergencyContextSignals) {
      if (text.includes(signal)) {
        contextMatches.push(signal);
      }
    }

    // Calculate composite relevance score (0 - 1)
    const keywordFactor = Math.min(highestTypeScore / 4, 1) * 0.5;
    const contextFactor = Math.min(contextMatches.length / 3, 1) * 0.5;
    const relevanceScore = Number((keywordFactor + contextFactor).toFixed(2));

    // Threshold: Must have at least 1 strong hazard keyword match and positive context, or strong multi-hazard mentions
    const isDisasterRelated = relevanceScore >= 0.35 || highestTypeScore >= 2.0 || contextMatches.length >= 1;

    return {
      isDisasterRelated,
      relevanceScore: Math.max(relevanceScore, isDisasterRelated ? 0.6 : 0.2),
      disasterType: detectedType,
      reason: isDisasterRelated
        ? `Relevant disaster intelligence (${detectedType}): ${keywordMatches.slice(0, 3).join(", ")}`
        : "Low contextual disaster relevance",
      matchedKeywords: keywordMatches,
      contextSignals: contextMatches,
    };
  }
}

export const relevanceFilter = new DisasterRelevanceFilter();
export default relevanceFilter;
