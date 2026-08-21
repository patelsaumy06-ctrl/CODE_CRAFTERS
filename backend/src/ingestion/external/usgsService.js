/**
 * USGS Earthquake API Service — DisasterLens AI
 *
 * Fetches real-time seismic data from USGS GeoJSON feeds and FDSNWS Event Web Service.
 * Official Source: https://earthquake.usgs.gov/fdsnws/event/1/
 * GeoJSON Feeds: https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php
 */

const BASE_URL = process.env.USGS_API_BASE_URL || "https://earthquake.usgs.gov/fdsnws/event/1/";
const GEOJSON_FEED_BASE = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/";

/**
 * Fetch USGS earthquakes from real-time GeoJSON summary feeds.
 *
 * @param {"all_hour"|"all_day"|"2.5_day"|"4.5_day"|"significant_day"} feedType
 * @returns {Promise<Object[]>} List of raw USGS feature objects
 */
export async function fetchRecentEarthquakes(feedType = "2.5_day") {
  const feedMap = {
    all_hour: "all_hour.geojson",
    all_day: "all_day.geojson",
    "2.5_day": "2.5_day.geojson",
    "4.5_day": "4.5_day.geojson",
    significant_day: "significant_day.geojson",
  };

  const filename = feedMap[feedType] || "2.5_day.geojson";
  const url = `${GEOJSON_FEED_BASE}${filename}`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "DisasterLens-AI-LiveMonitor/1.0",
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      throw new Error(`USGS feed returned HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.features || [];
  } catch (error) {
    console.warn(`[USGS Service] Failed to fetch feed '${feedType}':`, error.message);
    throw error;
  }
}

/**
 * Query USGS FDSNWS Event Web Service with filter parameters.
 *
 * @param {Object} params - { minmagnitude, maxmagnitude, starttime, endtime, latitude, longitude, maxradiuskm, limit }
 * @returns {Promise<Object[]>}
 */
export async function queryEarthquakes(params = {}) {
  const queryParams = new URLSearchParams({
    format: "geojson",
    limit: String(params.limit || 50),
    minmagnitude: String(params.minmagnitude || 2.5),
  });

  if (params.starttime) queryParams.set("starttime", params.starttime);
  if (params.endtime) queryParams.set("endtime", params.endtime);
  if (params.latitude) queryParams.set("latitude", String(params.latitude));
  if (params.longitude) queryParams.set("longitude", String(params.longitude));
  if (params.maxradiuskm) queryParams.set("maxradiuskm", String(params.maxradiuskm));

  const url = `${BASE_URL}query?${queryParams.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "DisasterLens-AI-LiveMonitor/1.0",
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      throw new Error(`USGS query API returned HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.features || [];
  } catch (error) {
    console.warn("[USGS Service] Query failed:", error.message);
    throw error;
  }
}

export default {
  fetchRecentEarthquakes,
  queryEarthquakes,
};
