import { v4 as uuidv4 } from "uuid";
import { SOURCE_TYPES } from "../config/constants.js";

/**
 * Normalizes any source format into a common NormalizedEvent schema.
 *
 * Every ingestion provider transforms raw data into this standard format
 * before it enters the processing pipeline.
 */
export class EventNormalizer {
  /**
   * Normalize raw input into a standard event.
   *
   * @param {string} sourceType - One of SOURCE_TYPES
   * @param {Object} rawData - Raw input from provider
   * @returns {NormalizedEvent}
   */
  normalize(sourceType, rawData) {
    switch (sourceType) {
      case SOURCE_TYPES.CITIZEN:
        return this._normalizeCitizen(rawData);
      case SOURCE_TYPES.NEWS:
        return this._normalizeNews(rawData);
      case SOURCE_TYPES.SENSOR:
        return this._normalizeSensor(rawData);
      case SOURCE_TYPES.SOCIAL:
        return this._normalizeSocial(rawData);
      default:
        return this._normalizeGeneric(sourceType, rawData);
    }
  }

  _normalizeCitizen(data) {
    return {
      eventId: uuidv4(),
      sourceType: SOURCE_TYPES.CITIZEN,
      sourceId: data.userId || "anonymous",
      title: data.title || "Citizen Report",
      text: data.description || data.text || "",
      location: {
        latitude: Number(data.latitude || data.location?.latitude) || 0,
        longitude: Number(data.longitude || data.location?.longitude) || 0,
        address: data.address || data.location?.address || "",
      },
      media: data.mediaUrls || data.media || [],
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      metadata: {
        reporterVerified: Boolean(data.verified),
        contactInfo: data.contact || null,
        casualties: Number(data.casualties) || 0,
        affectedCount: Number(data.affectedPeople) || 0,
      },
      raw: data,
    };
  }

  _normalizeNews(data) {
    return {
      eventId: uuidv4(),
      sourceType: SOURCE_TYPES.NEWS,
      sourceId: data.sourceUrl || data.url || "news-source",
      title: data.headline || data.title || "News Report",
      text: data.body || data.content || data.summary || "",
      location: {
        latitude: Number(data.latitude || data.location?.latitude) || 0,
        longitude: Number(data.longitude || data.location?.longitude) || 0,
        address: data.locationText || data.location?.address || "",
      },
      media: data.images || [],
      timestamp: data.publishedAt ? new Date(data.publishedAt) : new Date(),
      metadata: {
        publisher: data.source || data.publisher || "Unknown",
        url: data.url || data.sourceUrl || "",
        author: data.author || "",
      },
      raw: data,
    };
  }

  _normalizeSensor(data) {
    const value = Number(data.value || data.reading || 0);
    const threshold = Number(data.threshold || data.normalMax || 0);
    const exceedance = threshold > 0 ? Math.max(0, (value - threshold) / threshold) : 0;

    return {
      eventId: uuidv4(),
      sourceType: SOURCE_TYPES.SENSOR,
      sourceId: data.stationId || data.sensorId || "sensor-unknown",
      title: `Sensor Alert: ${data.sensorType || data.type || "Reading"} at ${data.stationName || data.stationId || "Station"}`,
      text: `${data.sensorType || "Sensor"} reading: ${value} ${data.unit || ""} (threshold: ${threshold} ${data.unit || ""}). ${data.description || ""}`.trim(),
      location: {
        latitude: Number(data.latitude || data.location?.latitude) || 0,
        longitude: Number(data.longitude || data.location?.longitude) || 0,
        address: data.stationName || data.location?.address || "",
      },
      media: [],
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      metadata: {
        sensorType: data.sensorType || data.type || "generic",
        value,
        unit: data.unit || "",
        threshold,
        exceedance: Number(exceedance.toFixed(3)),
        stationId: data.stationId || data.sensorId || "",
        stationName: data.stationName || "",
      },
      raw: data,
    };
  }

  _normalizeSocial(data) {
    return {
      eventId: uuidv4(),
      sourceType: SOURCE_TYPES.SOCIAL,
      sourceId: data.handle || data.userId || "social-user",
      title: `Social Report from ${data.handle || data.platform || "Social Media"}`,
      text: data.text || data.content || "",
      location: {
        latitude: Number(data.latitude) || 0,
        longitude: Number(data.longitude) || 0,
        address: data.locationText || "",
      },
      media: data.mediaUrls || [],
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      metadata: {
        platform: data.platform || "unknown",
        handle: data.handle || "",
        followers: Number(data.followers) || 0,
        engagement: Number(data.likes || 0) + Number(data.retweets || 0),
      },
      raw: data,
    };
  }

  _normalizeGeneric(sourceType, data) {
    return {
      eventId: uuidv4(),
      sourceType,
      sourceId: data.id || "generic-source",
      title: data.title || "Report",
      text: data.text || data.description || "",
      location: {
        latitude: Number(data.latitude || data.location?.latitude) || 0,
        longitude: Number(data.longitude || data.location?.longitude) || 0,
        address: data.address || data.location?.address || "",
      },
      media: [],
      timestamp: new Date(),
      metadata: {},
      raw: data,
    };
  }
}

export const normalizer = new EventNormalizer();
