import { cache } from "../../utils/cache.js";

/**
 * Open-Meteo Weather & Flood API Service — DisasterLens AI
 *
 * Provides on-demand, coordinate-based weather forecast and river/flood discharge telemetry.
 * Forecast API: https://api.open-meteo.com/v1/forecast
 * Flood API: https://flood-api.open-meteo.com/v1/flood
 */

const FORECAST_BASE = process.env.OPEN_METEO_BASE_URL || "https://api.open-meteo.com/v1/forecast";
const FLOOD_BASE = process.env.OPEN_METEO_FLOOD_BASE_URL || "https://flood-api.open-meteo.com/v1/flood";

const WEATHER_TTL_MS = 15 * 60 * 1000; // 15 minutes
const FLOOD_TTL_MS = 60 * 60 * 1000;   // 60 minutes

/**
 * Fetch current weather data for coordinates (cached for 15 minutes).
 *
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<{ temperature: number|null, precipitation: number|null, rain: number|null, windSpeed: number|null, weatherCode: number|null, soilMoisture: number|null, cacheHit: boolean, raw: Object|null }>}
 */
export async function fetchWeather(lat, lon) {
  if (typeof lat !== "number" || typeof lon !== "number" || isNaN(lat) || isNaN(lon)) {
    return _emptyWeatherResponse();
  }

  const cacheKey = cache.getCoordKey("weather", lat, lon);
  const cached = cache.get(cacheKey);

  if (cached) {
    return { ...cached, cacheHit: true };
  }

  const url = `${FORECAST_BASE}?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,rain,wind_speed_10m,weather_code,soil_moisture_0_to_1cm`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      throw new Error(`Open-Meteo Forecast HTTP ${response.status}`);
    }

    const data = await response.json();
    const curr = data.current || {};

    const result = {
      temperature: curr.temperature_2m ?? null,
      precipitation: curr.precipitation ?? null,
      rain: curr.rain ?? null,
      windSpeed: curr.wind_speed_10m ?? null,
      weatherCode: curr.weather_code ?? null,
      soilMoisture: curr.soil_moisture_0_to_1cm ?? null,
      cacheHit: false,
      raw: data,
    };

    cache.set(cacheKey, result, WEATHER_TTL_MS);
    return result;
  } catch (error) {
    console.warn(`[Open-Meteo Service] Weather request failed for (${lat}, ${lon}):`, error.message);
    return _emptyWeatherResponse();
  }
}

/**
 * Fetch river discharge and flood telemetry for coordinates (cached for 60 minutes).
 *
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<{ riverDischarge: number|null, maxRiverDischarge: number|null, cacheHit: boolean, raw: Object|null }>}
 */
export async function fetchFloodData(lat, lon) {
  if (typeof lat !== "number" || typeof lon !== "number" || isNaN(lat) || isNaN(lon)) {
    return _emptyFloodResponse();
  }

  const cacheKey = cache.getCoordKey("flood", lat, lon);
  const cached = cache.get(cacheKey);

  if (cached) {
    return { ...cached, cacheHit: true };
  }

  const url = `${FLOOD_BASE}?latitude=${lat}&longitude=${lon}&daily=river_discharge&forecast_days=3`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      throw new Error(`Open-Meteo Flood HTTP ${response.status}`);
    }

    const data = await response.json();
    const daily = data.daily || {};
    const discharges = Array.isArray(daily.river_discharge) ? daily.river_discharge.filter((v) => typeof v === "number") : [];

    const currentDischarge = discharges.length > 0 ? discharges[0] : null;
    const maxDischarge = discharges.length > 0 ? Math.max(...discharges) : null;

    const result = {
      riverDischarge: currentDischarge,
      maxRiverDischarge: maxDischarge,
      cacheHit: false,
      raw: data,
    };

    cache.set(cacheKey, result, FLOOD_TTL_MS);
    return result;
  } catch (error) {
    console.warn(`[Open-Meteo Service] Flood request failed for (${lat}, ${lon}):`, error.message);
    return _emptyFloodResponse();
  }
}

function _emptyWeatherResponse() {
  return {
    temperature: null,
    precipitation: null,
    rain: null,
    windSpeed: null,
    weatherCode: null,
    soilMoisture: null,
    cacheHit: false,
    raw: null,
  };
}

function _emptyFloodResponse() {
  return {
    riverDischarge: null,
    maxRiverDischarge: null,
    cacheHit: false,
    raw: null,
  };
}

export default {
  fetchWeather,
  fetchFloodData,
};
