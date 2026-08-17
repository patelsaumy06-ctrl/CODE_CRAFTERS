// ─── Disaster Types ─────────────────────────────────────────────
export const DISASTER_TYPES = {
  FLOOD: "flood",
  EARTHQUAKE: "earthquake",
  CYCLONE: "cyclone",
  LANDSLIDE: "landslide",
  WILDFIRE: "wildfire",
  DROUGHT: "drought",
  STORM: "storm",
  TSUNAMI: "tsunami",
  INDUSTRIAL: "industrial",
  INFRASTRUCTURE: "infrastructure",
  OTHER: "other",
};

// ─── Severity Levels ────────────────────────────────────────────
export const SEVERITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
};

export const SEVERITY_ORDER = { low: 0, medium: 1, high: 2, critical: 3 };

// ─── User Roles ─────────────────────────────────────────────────
export const ROLES = {
  ADMIN: "admin",
  COMMANDER: "commander",
  RESPONDER: "responder",
  ANALYST: "analyst",
  CITIZEN: "citizen",
  USER: "user",
};

export const ADMIN_ROLES = [ROLES.ADMIN, ROLES.COMMANDER];
export const OPERATIONAL_ROLES = [ROLES.ADMIN, ROLES.COMMANDER, ROLES.RESPONDER];

// ─── Source Types ───────────────────────────────────────────────
export const SOURCE_TYPES = {
  CITIZEN: "citizen_report",
  NEWS: "news_report",
  SENSOR: "sensor_reading",
  SOCIAL: "social_media",
  SATELLITE: "satellite",
  GOVERNMENT: "government_agency",
};

// ─── Source Reliability Weights (0-1) ───────────────────────────
export const SOURCE_RELIABILITY = {
  [SOURCE_TYPES.SENSOR]: 0.95,
  [SOURCE_TYPES.GOVERNMENT]: 0.90,
  [SOURCE_TYPES.SATELLITE]: 0.92,
  [SOURCE_TYPES.NEWS]: 0.75,
  [SOURCE_TYPES.CITIZEN]: 0.60,
  [SOURCE_TYPES.SOCIAL]: 0.50,
};

// ─── Confidence Engine Weights ──────────────────────────────────
export const CONFIDENCE_WEIGHTS = {
  SOURCE_RELIABILITY: 0.25,
  SOURCE_COUNT: 0.20,
  SENSOR_CORROBORATION: 0.20,
  GEOGRAPHIC_CONSISTENCY: 0.15,
  TIME_CONSISTENCY: 0.10,
  SEMANTIC_SIMILARITY: 0.10,
};

// ─── Severity Engine Weights ────────────────────────────────────
export const SEVERITY_WEIGHTS = {
  REPORTED_CASUALTIES: 0.25,
  AFFECTED_POPULATION: 0.20,
  INFRASTRUCTURE_DAMAGE: 0.15,
  GEOGRAPHIC_SPREAD: 0.10,
  SENSOR_THRESHOLDS: 0.15,
  SOURCE_CORROBORATION: 0.10,
  RATE_OF_CHANGE: 0.05,
};

// ─── Clustering Thresholds ──────────────────────────────────────
export const CLUSTERING = {
  MAX_DISTANCE_KM: 25,          // Max geographic distance for same cluster
  MAX_TIME_WINDOW_MS: 6 * 60 * 60 * 1000,  // 6 hours
  MIN_SIMILARITY_SCORE: 0.3,    // Minimum text similarity for match
  MIN_SOURCES_FOR_VERIFIED: 3,  // Sources needed for "verified" status
};

// ─── Alert Thresholds ───────────────────────────────────────────
export const ALERT_THRESHOLDS = {
  AUTO_ALERT_SEVERITY: SEVERITY.CRITICAL,
  AUTO_ALERT_CONFIDENCE: 0.75,
  RAPID_ESCALATION_WINDOW_MS: 15 * 60 * 1000,  // 15 min
  MIN_SOURCES_FOR_AUTO_ALERT: 2,
};

// ─── Firestore Collections ──────────────────────────────────────
export const COLLECTIONS = {
  USERS: "users",
  INCIDENTS: "incidents",
  INCIDENT_SOURCES: "incident_sources",
  INCIDENT_CLUSTERS: "incident_clusters",
  ALERTS: "alerts",
  INTELLIGENCE: "intelligence",
  SENSOR_READINGS: "sensor_readings",
  RECOMMENDATIONS: "response_recommendations",
  AUDIT_LOGS: "audit_logs",
  SYSTEM_HEALTH: "system_health",
};

// ─── Disaster Keyword Maps (for deterministic classifier) ───────
export const DISASTER_KEYWORDS = {
  [DISASTER_TYPES.FLOOD]: [
    "flood", "flooding", "inundation", "deluge", "water level", "levee",
    "dam breach", "overflow", "submerged", "waterlogged", "flash flood",
    "river surge", "water rising", "embankment", "drainage", "monsoon flood",
  ],
  [DISASTER_TYPES.EARTHQUAKE]: [
    "earthquake", "seismic", "tremor", "quake", "richter", "magnitude",
    "aftershock", "epicenter", "tectonic", "fault line", "ground shaking",
  ],
  [DISASTER_TYPES.CYCLONE]: [
    "cyclone", "hurricane", "typhoon", "tropical storm", "wind speed",
    "eye of storm", "storm surge", "gale", "depression",
  ],
  [DISASTER_TYPES.LANDSLIDE]: [
    "landslide", "mudslide", "rockfall", "debris flow", "slope failure",
    "earth slip", "hillside collapse", "terrain instability",
  ],
  [DISASTER_TYPES.WILDFIRE]: [
    "wildfire", "forest fire", "bushfire", "blaze", "fire spread",
    "smoke", "burning", "fire front", "conflagration", "arson",
  ],
  [DISASTER_TYPES.DROUGHT]: [
    "drought", "water shortage", "arid", "dry spell", "famine",
    "crop failure", "desertification", "water scarcity",
  ],
  [DISASTER_TYPES.STORM]: [
    "storm", "thunderstorm", "lightning", "hailstorm", "tornado",
    "twister", "squall", "blizzard", "nor'easter", "ice storm",
  ],
  [DISASTER_TYPES.TSUNAMI]: [
    "tsunami", "tidal wave", "ocean surge", "seismic sea wave",
  ],
  [DISASTER_TYPES.INDUSTRIAL]: [
    "gas leak", "chemical spill", "explosion", "industrial accident",
    "toxic release", "hazmat", "refinery", "pipeline burst", "radiation",
  ],
  [DISASTER_TYPES.INFRASTRUCTURE]: [
    "bridge collapse", "building collapse", "power outage", "grid failure",
    "road damage", "structural failure", "utility failure", "blackout",
    "sub-station", "electric pole", "power cut",
  ],
};
