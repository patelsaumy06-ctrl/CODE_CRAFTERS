import { fetchWeather, fetchFloodData } from "../ingestion/external/openMeteoService.js";

/**
 * Weather Correlation Service — DisasterLens AI
 *
 * Correlates incident location & disaster type with live Open-Meteo weather and river data
 * to calculate weather relevance and signal strength.
 */
export class WeatherCorrelationService {
  /**
   * Analyze weather risk and correlation for coordinates and disaster type.
   *
   * @param {Object} input - { latitude, longitude, disasterType }
   * @returns {Promise<Object>} Weather correlation result
   */
  async analyzeWeatherRisk(input = {}) {
    const lat = Number(input.latitude);
    const lon = Number(input.longitude);
    const disasterType = (input.disasterType || "other").toLowerCase();

    // Validate coordinates
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return {
        error: "INVALID_COORDINATES",
        message: "Latitude must be between -90 and 90, longitude between -180 and 180.",
        location: { latitude: input.latitude, longitude: input.longitude },
        weather: null,
        flood: null,
        signals: [],
        correlation: { relevance: "none", score: 0 },
        timestamp: new Date().toISOString(),
      };
    }

    // Fetch weather & flood telemetry concurrently
    const [weatherRes, floodRes] = await Promise.all([
      fetchWeather(lat, lon),
      fetchFloodData(lat, lon),
    ]);

    const cacheHit = weatherRes.cacheHit || floodRes.cacheHit;
    const signals = [];
    let correlationScore = 0;
    let relevance = "low";

    const hasWeatherData = weatherRes.temperature !== null || weatherRes.precipitation !== null;

    if (!hasWeatherData && floodRes.riverDischarge === null) {
      return {
        location: { latitude: lat, longitude: lon },
        disasterType,
        weather: null,
        flood: null,
        signals: [],
        correlation: { relevance: "unavailable", score: 0 },
        cacheHit,
        timestamp: new Date().toISOString(),
      };
    }

    // Disaster-specific correlation rules
    switch (disasterType) {
      case "flood":
        correlationScore = this._evaluateFloodSignals(weatherRes, floodRes, signals);
        break;
      case "cyclone":
      case "storm":
      case "hurricane":
      case "typhoon":
        correlationScore = this._evaluateStormSignals(weatherRes, signals);
        break;
      case "wildfire":
      case "fire":
        correlationScore = this._evaluateWildfireSignals(weatherRes, signals);
        break;
      case "earthquake":
      case "tsunami":
        // Weather has neutral / non-corroborative effect on seismic events
        relevance = "neutral";
        correlationScore = 0;
        break;
      default:
        correlationScore = this._evaluateGenericSignals(weatherRes, signals);
        break;
    }

    if (disasterType !== "earthquake" && disasterType !== "tsunami") {
      if (correlationScore >= 0.7) relevance = "high";
      else if (correlationScore >= 0.35) relevance = "moderate";
      else relevance = "low";
    }

    return {
      location: { latitude: lat, longitude: lon },
      disasterType,
      weather: {
        temperature: weatherRes.temperature,
        precipitation: weatherRes.precipitation,
        rain: weatherRes.rain,
        windSpeed: weatherRes.windSpeed,
        weatherCode: weatherRes.weatherCode,
        soilMoisture: weatherRes.soilMoisture,
      },
      flood: {
        riverDischarge: floodRes.riverDischarge,
        maxRiverDischarge: floodRes.maxRiverDischarge,
      },
      signals,
      correlation: {
        relevance,
        score: Number(correlationScore.toFixed(2)),
      },
      cacheHit,
      timestamp: new Date().toISOString(),
    };
  }

  _evaluateFloodSignals(weather, flood, signals) {
    let score = 0;

    const precip = weather.precipitation || weather.rain || 0;
    if (precip >= 15) {
      signals.push({ type: "heavy_rainfall", detected: true, detail: `Extreme precipitation (${precip} mm/h)` });
      score += 0.45;
    } else if (precip >= 5) {
      signals.push({ type: "moderate_rainfall", detected: true, detail: `Moderate precipitation (${precip} mm/h)` });
      score += 0.25;
    }

    const discharge = flood.riverDischarge || 0;
    if (discharge >= 100) {
      signals.push({ type: "high_river_discharge", detected: true, detail: `Elevated river discharge (${discharge} m³/s)` });
      score += 0.45;
    } else if (discharge >= 30) {
      signals.push({ type: "moderate_river_discharge", detected: true, detail: `Moderate river discharge (${discharge} m³/s)` });
      score += 0.2;
    }

    const moisture = weather.soilMoisture || 0;
    if (moisture >= 0.35) {
      signals.push({ type: "saturated_soil", detected: true, detail: `High soil moisture saturation (${moisture})` });
      score += 0.2;
    }

    return Math.min(1.0, score);
  }

  _evaluateStormSignals(weather, signals) {
    let score = 0;

    const wind = weather.windSpeed || 0;
    if (wind >= 60) {
      signals.push({ type: "storm_force_winds", detected: true, detail: `Severe wind speeds (${wind} km/h)` });
      score += 0.55;
    } else if (wind >= 35) {
      signals.push({ type: "gale_force_winds", detected: true, detail: `Elevated wind speeds (${wind} km/h)` });
      score += 0.35;
    }

    const precip = weather.precipitation || weather.rain || 0;
    if (precip >= 10) {
      signals.push({ type: "heavy_precipitation", detected: true, detail: `Heavy precipitation (${precip} mm/h)` });
      score += 0.35;
    }

    const code = weather.weatherCode || 0;
    if (code >= 80) {
      signals.push({ type: "active_convective_storm", detected: true, detail: `Weather code ${code} indicates storm/rain` });
      score += 0.2;
    }

    return Math.min(1.0, score);
  }

  _evaluateWildfireSignals(weather, signals) {
    let score = 0;

    const temp = weather.temperature || 0;
    if (temp >= 35) {
      signals.push({ type: "extreme_heat", detected: true, detail: `Extreme ambient temperature (${temp} °C)` });
      score += 0.4;
    } else if (temp >= 28) {
      signals.push({ type: "high_heat", detected: true, detail: `High temperature (${temp} °C)` });
      score += 0.2;
    }

    const wind = weather.windSpeed || 0;
    if (wind >= 25) {
      signals.push({ type: "wind_spread_hazard", detected: true, detail: `High wind speed spreading hazard (${wind} km/h)` });
      score += 0.35;
    }

    const precip = weather.precipitation || 0;
    if (precip < 0.2) {
      signals.push({ type: "dry_conditions", detected: true, detail: "Low precipitation / dry conditions" });
      score += 0.25;
    }

    return Math.min(1.0, score);
  }

  _evaluateGenericSignals(weather, signals) {
    let score = 0;
    if ((weather.precipitation || 0) > 10) {
      signals.push({ type: "precipitation", detected: true, detail: `Precipitation (${weather.precipitation} mm)` });
      score += 0.3;
    }
    if ((weather.windSpeed || 0) > 40) {
      signals.push({ type: "high_wind", detected: true, detail: `High wind speed (${weather.windSpeed} km/h)` });
      score += 0.3;
    }
    return Math.min(1.0, score);
  }
}

export const weatherCorrelationService = new WeatherCorrelationService();
