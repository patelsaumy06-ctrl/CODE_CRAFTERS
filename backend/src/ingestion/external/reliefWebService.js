import { cache } from "../../utils/cache.js";

/**
 * ReliefWeb API Service — DisasterLens AI
 *
 * Queries humanitarian situation reports, disaster updates, and response assessments.
 * Official Documentation: https://apidoc.rwlabs.org/
 * Base URL: https://api.reliefweb.int/v2/reports
 */

const BASE_URL = process.env.RELIEFWEB_API_BASE_URL || "https://api.reliefweb.int/v2/reports";
const RELIEFWEB_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Fetch recent disaster and humanitarian reports from ReliefWeb.
 *
 * @param {Object} opts - { query, limit: 20 }
 * @returns {Promise<Object[]>} Array of raw ReliefWeb report objects
 */
export async function fetchDisasterReports(opts = {}) {
  const queryStr = opts.query || "disaster OR flood OR earthquake OR cyclone OR wildfire OR storm OR emergency";
  const limit = Math.min(Math.max(Number(opts.limit) || 20, 5), 50);

  const cacheKey = `reliefweb:${encodeURIComponent(queryStr)}:${limit}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const params = new URLSearchParams({
    appname: "disasterlens-ai",
    limit: String(limit),
    "query[value]": queryStr,
    "sort[]": "date:desc",
    profile: "full",
  });

  const url = `${BASE_URL}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "DisasterLensAI/1.0 (Humanitarian/Disaster-Response)",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`ReliefWeb API HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const reports = data.data || [];

    cache.set(cacheKey, reports, RELIEFWEB_CACHE_TTL_MS);
    return reports;
  } catch (error) {
    console.warn("[ReliefWeb Service] Failed to fetch reports:", error.message);
    return [];
  }
}

/**
 * Fetch reports for a specific country or region.
 *
 * @param {string} countryName
 * @param {string} disasterType
 * @returns {Promise<Object[]>}
 */
export async function fetchCountryReports(countryName, disasterType = "") {
  if (!countryName) return [];
  const query = disasterType ? `${countryName} ${disasterType}` : `${countryName} (disaster OR flood OR emergency)`;
  return fetchDisasterReports({ query });
}

export default {
  fetchDisasterReports,
  fetchCountryReports,
};
