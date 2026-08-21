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

// ─── Priority Levels ────────────────────────────────────────────
export const PRIORITY = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
};

export const PRIORITY_ORDER = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };

// ─── Status Enums ────────────────────────────────────────────────
export const APPLICATION_STATUS = {
  LIVE: "LIVE",
  HISTORICAL: "HISTORICAL",
  EXPIRED: "EXPIRED",
  STALE: "STALE",
};

export const SOURCE_STATUS = {
  CURRENT: "CURRENT",
  PAST: "PAST",
  CLOSED: "CLOSED",
  UNKNOWN: "UNKNOWN",
};

export const SYNC_STATUS = {
  HEALTHY: "LIVE",
  SYNCING: "SYNCING",
  STALE: "STALE",
  OFFLINE: "OFFLINE",
  DEGRADED: "DEGRADED",
};

export const VERIFICATION_STATUS = {
  UNVERIFIED: "UNVERIFIED",
  CORROBORATED: "CORROBORATED",
  OFFICIALLY_CONFIRMED: "OFFICIALLY_CONFIRMED",
  CONFLICTING: "CONFLICTING",
};

// ─── Dynamic Rolling Date Window Helper (UTC) ───────────────────
/**
 * Calculates dynamic rolling calendar day window in UTC relative to system date.
 * [Day -(days-1) 00:00:00.000 UTC, Today 23:59:59.999 UTC]
 *
 * @param {number} days - Number of inclusive calendar days (default: 3)
 * @param {Date|string|number} referenceDate - Current system time or mock date
 * @returns {{ days: number, start: string, end: string, startTimeMs: number, endTimeMs: number }}
 */
export function getRollingDateWindow(days = 3, referenceDate = new Date()) {
  const ref = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
  const now = isNaN(ref.getTime()) ? new Date() : ref;

  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (days - 1), 0, 0, 0, 0));

  return {
    days,
    start: start.toISOString(),
    end: end.toISOString(),
    startTimeMs: start.getTime(),
    endTimeMs: end.getTime(),
  };
}

/**
 * Validates whether an authoritative event occurrence time falls within the given date window.
 *
 * @param {Date|string|number} eventTime
 * @param {Object} window - Output of getRollingDateWindow()
 * @returns {boolean}
 */
export function isWithinDateWindow(eventTime, window = getRollingDateWindow(3)) {
  if (!eventTime) return false;
  const ts = eventTime instanceof Date ? eventTime.getTime() : new Date(eventTime).getTime();
  if (isNaN(ts)) return false;
  return ts >= window.startTimeMs && ts <= window.endTimeMs;
}

// ─── Source Freshness Windows (ms) ──────────────────────────────
export const FRESHNESS_CONFIG = {
  GDACS_WINDOW_MS: parseInt(process.env.GDACS_FRESHNESS_WINDOW_MS, 10) || 15 * 60 * 1000,   // GDACS refreshed every ~6 min
  USGS_WINDOW_MS: parseInt(process.env.USGS_FRESHNESS_WINDOW_MS, 10) || 15 * 60 * 1000,     // USGS refreshed every ~5 min
  EONET_WINDOW_MS: parseInt(process.env.EONET_FRESHNESS_WINDOW_MS, 10) || 30 * 60 * 1000,
  GDELT_WINDOW_MS: parseInt(process.env.GDELT_FRESHNESS_WINDOW_MS, 10) || 30 * 60 * 1000,
  RELIEFWEB_WINDOW_MS: parseInt(process.env.RELIEFWEB_FRESHNESS_WINDOW_MS, 10) || 60 * 60 * 1000,
};

// ─── User Roles ─────────────────────────────────────────────────
export const ROLES = {
  ADMIN: "admin",
  RESPONDER: "responder",
  VIEWER: "viewer",
};

export const ADMIN_ROLES = [ROLES.ADMIN];
export const OPERATIONAL_ROLES = [ROLES.ADMIN, ROLES.RESPONDER];
export const VIEWER_ROLES = [ROLES.ADMIN, ROLES.RESPONDER, ROLES.VIEWER];

// ─── Source Types ───────────────────────────────────────────────
export const SOURCE_TYPES = {
  CITIZEN: "citizen_report",
  NEWS: "news_report",
  SENSOR: "sensor_reading",
  SOCIAL: "social_media",
  SATELLITE: "satellite",
  GOVERNMENT: "government_agency",
  REDDIT: "reddit",
  USGS: "usgs",
  EONET: "nasa_eonet",
  GDACS: "gdacs",
  GDELT: "gdelt",
  RELIEFWEB: "reliefweb",
  OPEN_METEO: "open_meteo",
};

// ─── Source Reliability Weights (0-1) ───────────────────────────
export const SOURCE_RELIABILITY = {
  [SOURCE_TYPES.SENSOR]: 0.95,
  [SOURCE_TYPES.USGS]: 0.95,
  [SOURCE_TYPES.EONET]: 0.95,
  [SOURCE_TYPES.GDACS]: 0.95,
  [SOURCE_TYPES.GOVERNMENT]: 0.90,
  [SOURCE_TYPES.SATELLITE]: 0.92,
  [SOURCE_TYPES.RELIEFWEB]: 0.85,
  [SOURCE_TYPES.NEWS]: 0.75,
  [SOURCE_TYPES.CITIZEN]: 0.60,
  [SOURCE_TYPES.REDDIT]: 0.55,
  [SOURCE_TYPES.SOCIAL]: 0.50,
  [SOURCE_TYPES.GDELT]: 0.50,
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
  PROCESSED_ARTICLES: "processed_articles",
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
