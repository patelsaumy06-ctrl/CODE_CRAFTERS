import { cache } from "../../utils/cache.js";

/**
 * GDELT DOC 2.0 API Service — DisasterLens AI
 *
 * Free global news intelligence stream for multi-source disaster verification.
 * Official Documentation: https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/
 * Base URL: https://api.gdeltproject.org/api/v2/doc/doc
 *
 * Rate Limit Compliance:
 * GDELT requires requests to be spaced at least ~5 seconds apart.
 * This service implements rate-limit spacing (MIN_REQUEST_INTERVAL_MS = 5000),
 * request serialization, exponential backoff on HTTP 429, and client cache.
 */

const BASE_URL = process.env.GDELT_API_BASE_URL || "https://api.gdeltproject.org/api/v2/doc/doc";
const GDELT_CACHE_TTL_MS = 25 * 1000; // 25 seconds
const MIN_REQUEST_INTERVAL_MS = 5000; // 5 seconds mandatory minimum request spacing

const DEFAULT_DISASTER_KEYWORDS = [
  "flood",
  "flooding",
  "earthquake",
  "cyclone",
  "hurricane",
  "typhoon",
  "wildfire",
  "landslide",
  "mudslide",
  "tsunami",
  "storm",
  '"dam breach"',
  '"flash flood"',
  '"cloudburst"',
];

// Single-flight rate-limiting state
let lastRequestTimestamp = 0;
let rateLimitCooldownUntil = 0;
let requestQueue = Promise.resolve();

/**
 * Ensure at least 5000ms has elapsed since the last outbound GDELT request.
 * @returns {Promise<void>}
 */
async function enforceRateLimitSpacing() {
  const now = Date.now();

  // If in 429 cooldown, wait until cooldown expires
  if (now < rateLimitCooldownUntil) {
    const cooldownWait = rateLimitCooldownUntil - now;
    console.log(`[GDELT Service] Respecting HTTP 429 cooldown (${cooldownWait}ms remaining)...`);
    await new Promise((resolve) => setTimeout(resolve, cooldownWait));
  }

  const elapsed = Date.now() - lastRequestTimestamp;
  if (elapsed < MIN_REQUEST_INTERVAL_MS) {
    const delay = MIN_REQUEST_INTERVAL_MS - elapsed;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  lastRequestTimestamp = Date.now();
}

/**
 * Search global news for disaster events using GDELT DOC API.
 *
 * @param {Object} opts - { query, maxRecords: 15, sort: "DateDesc", mode: "artlist" }
 * @returns {Promise<Object[]>} Array of raw GDELT article objects
 */
export async function searchDisasterNews(opts = {}) {
  const queryTerms = opts.query || `(${DEFAULT_DISASTER_KEYWORDS.join(" OR ")}) sourcelang:eng`;
  const maxRecords = Math.min(Math.max(Number(opts.maxRecords) || 15, 10), 20);
  const mode = opts.mode || "artlist";
  const sort = opts.sort || "DateDesc";

  const cacheKey = `gdelt:${encodeURIComponent(queryTerms)}:${maxRecords}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Serialize outbound GDELT requests to ensure atomic >= 5s spacing
  return new Promise((resolve) => {
    requestQueue = requestQueue.then(async () => {
      let result = [];
      let retries = 0;
      const maxRetries = 2;

      while (retries <= maxRetries) {
        try {
          await enforceRateLimitSpacing();

          const params = new URLSearchParams({
            query: queryTerms,
            mode,
            maxrecords: String(maxRecords),
            format: "json",
            sort,
          });

          const url = `${BASE_URL}?${params.toString()}`;

          const response = await fetch(url, {
            headers: {
              Accept: "application/json",
              "User-Agent": "DisasterLensAI-Intelligence/1.0 (Emergency-Response)",
            },
            signal: AbortSignal.timeout(10000),
          });

          // Handle 429 Too Many Requests with exponential backoff
          if (response.status === 429) {
            retries++;
            const backoffMs = 5000 * Math.pow(2, retries);
            rateLimitCooldownUntil = Date.now() + backoffMs;
            console.warn(`[GDELT Service] Rate limit 429 received. Backing off for ${backoffMs}ms (attempt ${retries}/${maxRetries})...`);
            if (retries <= maxRetries) {
              await new Promise((r) => setTimeout(r, backoffMs));
              continue;
            }
            break;
          }

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const text = await response.text();
          // GDELT returns empty string or HTML on rate limit / no results
          if (!text || text.trim().startsWith("<") || text.trim().startsWith("<!")) {
            result = [];
            break;
          }

          const data = JSON.parse(text);
          result = Array.isArray(data.articles) ? data.articles : [];
          cache.set(cacheKey, result, GDELT_CACHE_TTL_MS);
          break;
        } catch (error) {
          retries++;
          if (retries > maxRetries) {
            console.warn("[GDELT Service] News fetch warning:", error.message);
            result = [];
            break;
          }
          await new Promise((r) => setTimeout(r, 2000 * retries));
        }
      }

      resolve(result);
    });
  });
}

/**
 * Query GDELT articles filtered by location keyword.
 *
 * @param {string} locationName
 * @param {string} disasterType
 * @returns {Promise<Object[]>}
 */
export async function searchLocationNews(locationName, disasterType = "") {
  if (!locationName) return [];
  const keyword = disasterType
    ? `"${locationName}" ${disasterType}`
    : `"${locationName}" (disaster OR flood OR earthquake OR fire OR cyclone)`;
  return searchDisasterNews({ query: `${keyword} sourcelang:eng`, maxRecords: 15 });
}

export default {
  searchDisasterNews,
  searchLocationNews,
};
