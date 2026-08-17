import { DISASTER_TYPES, SEVERITY } from "../config/constants.js";

/**
 * Response Recommendation Engine
 *
 * Generates prioritized, actionable decision-support recommendations
 * based on disaster type, severity, location context, and operational metrics.
 *
 * All outputs are clearly labeled as DECISION SUPPORT — not autonomous directives.
 */
export class RecommendationEngine {
  /**
   * Generate recommendations for an incident.
   *
   * @param {Object} incident - { disasterType, severity, location, sourceCount, confidence }
   * @returns {{ recommendations: Object[], generatedAt, disclaimer }}
   */
  generate(incident) {
    const type = incident.disasterType || DISASTER_TYPES.OTHER;
    const severity = incident.severity || SEVERITY.MEDIUM;

    const recommendations = [];

    // ─── Immediate Actions (all incident types) ───
    recommendations.push(...this._getImmediateActions(type, severity, incident));

    // ─── Type-Specific Recommendations ───
    recommendations.push(...this._getTypeSpecificActions(type, severity));

    // ─── Resource Recommendations ───
    recommendations.push(...this._getResourceRecommendations(type, severity));

    // Assign priorities
    recommendations.forEach((rec, i) => {
      rec.priority = i + 1;
      rec.id = `REC_${Date.now()}_${i}`;
    });

    return {
      recommendations,
      generatedAt: new Date().toISOString(),
      disclaimer: "DECISION SUPPORT ONLY — All actions require human authorization before execution.",
      incidentContext: {
        disasterType: type,
        severity,
        confidence: incident.confidence || 0,
        sourceCount: incident.sourceCount || 0,
      },
    };
  }

  _getImmediateActions(type, severity) {
    const actions = [];

    if (severity === SEVERITY.CRITICAL) {
      actions.push({
        category: "IMMEDIATE",
        action: "Activate Emergency Operations Center (EOC)",
        rationale: "Critical severity requires centralized coordination.",
        urgency: "IMMEDIATE",
      });
      actions.push({
        category: "IMMEDIATE",
        action: "Dispatch first responders to incident area",
        rationale: "Critical incidents require on-ground presence within 15 minutes.",
        urgency: "IMMEDIATE",
      });
    }

    if (severity === SEVERITY.CRITICAL || severity === SEVERITY.HIGH) {
      actions.push({
        category: "COMMUNICATION",
        action: "Issue public emergency broadcast via EAS/Cell Broadcast",
        rationale: "Public safety requires immediate notification of affected populations.",
        urgency: severity === SEVERITY.CRITICAL ? "IMMEDIATE" : "URGENT",
      });
    }

    actions.push({
      category: "ASSESSMENT",
      action: "Deploy ground reconnaissance team for situation assessment",
      rationale: "First-hand verification improves accuracy of remote intelligence.",
      urgency: severity === SEVERITY.CRITICAL ? "IMMEDIATE" : "STANDARD",
    });

    return actions;
  }

  _getTypeSpecificActions(type, severity) {
    const actionMap = {
      [DISASTER_TYPES.FLOOD]: [
        { category: "EVACUATION", action: "Activate flood evacuation routes to designated shelters", rationale: "Flood waters can rise rapidly, requiring preemptive evacuation." },
        { category: "INFRASTRUCTURE", action: "Monitor and reinforce levee/embankment structures", rationale: "Levee integrity is critical to prevent catastrophic breach." },
        { category: "RESCUE", action: "Stage swift-water rescue teams at flood zones", rationale: "Flash floods require specialized water rescue capability." },
      ],
      [DISASTER_TYPES.EARTHQUAKE]: [
        { category: "SEARCH_RESCUE", action: "Deploy USAR (Urban Search and Rescue) teams", rationale: "Structural collapses require specialized extraction capabilities." },
        { category: "INFRASTRUCTURE", action: "Inspect critical infrastructure (bridges, hospitals, utilities)", rationale: "Aftershocks may cause secondary collapses in damaged structures." },
        { category: "MEDICAL", action: "Establish field triage stations near affected zones", rationale: "Mass casualty events require distributed medical capacity." },
      ],
      [DISASTER_TYPES.WILDFIRE]: [
        { category: "CONTAINMENT", action: "Establish fire lines and deploy aerial suppression", rationale: "Early containment prevents exponential fire spread." },
        { category: "EVACUATION", action: "Execute staged evacuation of downwind communities", rationale: "Wind shifts can rapidly change fire direction and threaten inhabited areas." },
        { category: "HEALTH", action: "Issue air quality advisory for smoke-affected regions", rationale: "Wildfire smoke is a significant respiratory health hazard." },
      ],
      [DISASTER_TYPES.CYCLONE]: [
        { category: "SHELTER", action: "Open and staff emergency cyclone shelters", rationale: "Cyclone-rated shelters protect against extreme wind and storm surge." },
        { category: "INFRASTRUCTURE", action: "Secure power grid and communication infrastructure", rationale: "Post-cyclone restoration depends on pre-event infrastructure protection." },
        { category: "MARITIME", action: "Issue maritime warnings and recall fishing vessels", rationale: "Storm surge and extreme seas are the primary cyclone casualty source." },
      ],
      [DISASTER_TYPES.INDUSTRIAL]: [
        { category: "HAZMAT", action: "Establish safety perimeter and deploy hazmat teams", rationale: "Chemical/gas releases require specialized containment and PPE." },
        { category: "EVACUATION", action: "Evacuate downwind population within safety radius", rationale: "Toxic plume dispersion follows wind patterns." },
        { category: "MEDICAL", action: "Alert hospitals for potential chemical exposure casualties", rationale: "Chemical exposure requires specific decontamination protocols." },
      ],
    };

    const actions = actionMap[type] || [
      { category: "GENERAL", action: "Establish incident command post at safe location", rationale: "Centralized command improves coordination and resource allocation." },
      { category: "GENERAL", action: "Activate mutual aid agreements with neighboring jurisdictions", rationale: "Multi-agency response improves capacity for significant incidents." },
    ];

    return actions.map((a) => ({
      ...a,
      urgency: severity === SEVERITY.CRITICAL ? "URGENT" : "STANDARD",
    }));
  }

  _getResourceRecommendations(type, severity) {
    const resources = [];

    if (severity === SEVERITY.CRITICAL || severity === SEVERITY.HIGH) {
      resources.push({
        category: "LOGISTICS",
        action: "Pre-position emergency supplies (water, medical kits, blankets) at staging areas",
        rationale: "Critical incidents typically generate displacement requiring immediate provisioning.",
        urgency: "URGENT",
      });
    }

    resources.push({
      category: "COORDINATION",
      action: "Activate inter-agency communication protocols (NDMA/SDMA coordination)",
      rationale: "Multi-source disasters require unified command across agencies.",
      urgency: "STANDARD",
    });

    return resources;
  }
}

export const recommendationEngine = new RecommendationEngine();
