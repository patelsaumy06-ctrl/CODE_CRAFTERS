import { cache } from "../../utils/cache.js";

/**
 * GDELT DOC API Service — DisasterLens AI
 *
 * Queries global news articles related to natural disasters and emerging incidents.
 * Official Documentation: https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/
 * Base URL: https://api.gdeltproject.org/api/v2/doc/doc
 */

const BASE_URL = process.env.GDELT_API_BASE_URL || "https://api.gdeltproject.org/api/v2/doc/doc";
const GDELT_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

const DEFAULT_DISASTER_KEYWORDS = [
  "earthquake",
  "flood",
  "flooding",
  "cyclone",
  "hurricane",
  "wildfire",
  "landslide",
  "volcano",
  "storm",
  "disaster",
  "tsunami",
];

/**
 * Search global news for disaster events using GDELT DOC API.
 *
 * @param {Object} opts - { query, maxRecords: 25, sort: "DateDesc", mode: "artlist" }
 * @returns {Promise<Object[]>} Array of raw GDELT article objects
 */
export async function searchDisasterNews(opts = {}) {
  const queryStr = opts.query || `(${DEFAULT_DISASTER_KEYWORDS.join(" OR ")}) sourcelang:eng`;
  const maxRecords = Math.min(Math.max(Number(opts.maxRecords) || 25, 5), 75);
  const mode = opts.mode || "artlist";
  const sort = opts.sort || "DateDesc";

  const cacheKey = `gdelt:${encodeURIComponent(queryStr)}:${maxRecords}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const params = new URLSearchParams({
    query: queryStr,
    mode,
    maxrecords: String(maxRecords),
    format: "json",
    sort,
  });

  const url = `${BASE_URL}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "DisasterLensAI/1.0 (Research/Disaster-Response)",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`GDELT API HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    // GDELT might return empty string or HTML on rate limit / no results
    if (!text || text.trim().startsWith("<")) {
      return [];
    }

    const data = JSON.parse(text);
    const articles = data.articles || [];

    cache.set(cacheKey, articles, GDELT_CACHE_TTL_MS);
    return articles;
  } catch (error) {
    console.warn("[GDELT Service] Failed to fetch news:", error.message);
    return [];
  }
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
  const keyword = disasterType ? `"${locationName}" ${disasterType}` : `"${locationName}" (disaster OR flood OR earthquake OR fire)`;
  return searchDisasterNews({ query: `${keyword} sourcelang:eng` });
}

export default {
  searchDisasterNews,
  searchLocationNews,
};
