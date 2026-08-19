import { v4 as uuidv4 } from "uuid";
import { SOURCE_TYPES } from "../../config/constants.js";

/**
 * External Data Normalizer — DisasterLens AI
 *
 * Converts raw events from USGS, NASA EONET, and GDACS into canonical NormalizedEvent objects.
 */
export class ExternalNormalizer {
  /**
   * Normalize a USGS earthquake feature into a NormalizedEvent.
   *
   * @param {Object} feature - USGS GeoJSON feature
   * @returns {Object} NormalizedEvent
   */
  normalizeUsgs(feature) {
    const props = feature.properties || {};
    const coords = feature.geometry?.coordinates || [0, 0, 0];
    const lon = Number(coords[0]) || 0;
    const lat = Number(coords[1]) || 0;
    const depth = Number(coords[2]) || 0;
    const mag = props.mag !== null && props.mag !== undefined ? Number(props.mag) : 0;

    const sourceId = feature.id || props.code || `usgs_${Date.now()}`;
    const place = props.place || "Unknown location";
    const title = props.title || `Earthquake M${mag.toFixed(1)} - ${place}`;
    const timestamp = props.time ? new Date(props.time) : new Date();

    return {
      eventId: uuidv4(),
      sourceType: SOURCE_TYPES.USGS,
      sourceId,
      title,
      text: `USGS Earthquake Report: Magnitude ${mag.toFixed(1)} detected at ${place}. Depth: ${depth} km. Alert level: ${props.alert || "none"}. Tsunami warning: ${props.tsunami ? "YES" : "No"}.`,
      description: `Magnitude ${mag.toFixed(1)} earthquake recorded by USGS seismic stations. Location: ${place} (${lat}, ${lon}). Depth: ${depth} km.`,
      location: {
        latitude: lat,
        longitude: lon,
        address: place,
      },
      media: [],
      timestamp,
      metadata: {
        magnitude: mag,
        depthKm: depth,
        alert: props.alert || null,
        tsunami: Boolean(props.tsunami),
        sig: props.sig || 0,
        status: props.status || "reviewed",
        url: props.url || "",
      },
      raw: feature,
    };
  }

  /**
   * Normalize a NASA EONET v3 event into a NormalizedEvent.
   *
   * @param {Object} event - NASA EONET event object
   * @returns {Object} NormalizedEvent
   */
  normalizeEonet(event) {
    const sourceId = event.id || `eonet_${Date.now()}`;
    const title = event.title || "NASA EONET Natural Event";

    // Extract geometry (most recent coordinate)
    const geometries = event.geometries || [];
    const latestGeom = geometries[geometries.length - 1] || {};
    const coords = latestGeom.coordinates || [0, 0];

    let lat = 0;
    let lon = 0;

    if (Array.isArray(coords)) {
      if (typeof coords[0] === "number" && typeof coords[1] === "number") {
        lon = coords[0];
        lat = coords[1];
      } else if (Array.isArray(coords[0]) && typeof coords[0][0] === "number") {
        lon = coords[0][0];
        lat = coords[0][1];
      }
    }

    const categoryObj = (event.categories && event.categories[0]) || {};
    const categoryName = categoryObj.title || categoryObj.id || "natural_disaster";
    const dateStr = latestGeom.date || event.closed || new Date().toISOString();
    const timestamp = new Date(dateStr);
    const sourceUrl = (event.sources && event.sources[0]?.url) || event.link || "";

    return {
      eventId: uuidv4(),
      sourceType: SOURCE_TYPES.EONET,
      sourceId,
      title: `${categoryName}: ${title}`,
      text: event.description || `NASA EONET tracked natural event: ${title} (${categoryName}).`,
      description: `${title}. Category: ${categoryName}. Recorded by NASA Earth Observatory Natural Event Tracker.`,
      location: {
        latitude: lat,
        longitude: lon,
        address: `${title} (${categoryName})`,
      },
      media: [],
      timestamp,
      metadata: {
        category: categoryName,
        categoryId: categoryObj.id || "",
        link: event.link || "",
        sourceUrl,
      },
      raw: event,
    };
  }

  /**
   * Normalize a GDACS alert event into a NormalizedEvent.
   *
   * @param {Object} item - GDACS event object
   * @returns {Object} NormalizedEvent
   */
  normalizeGdacs(item) {
    const sourceId = item.id || item.eventid || `gdacs_${Date.now()}`;
    const title = item.title || item.name || "GDACS Disaster Alert";
    const lat = item.latitude !== null && item.latitude !== undefined ? Number(item.latitude) : 0;
    const lon = item.longitude !== null && item.longitude !== undefined ? Number(item.longitude) : 0;

    const alertLevel = (item.alertLevel || item.alertlevel || "Green").toLowerCase();
    const eventType = item.eventType || item.eventtype || "disaster";
    const timestamp = item.pubDate ? new Date(item.pubDate) : new Date();

    return {
      eventId: uuidv4(),
      sourceType: SOURCE_TYPES.GDACS,
      sourceId,
      title: `[GDACS ${alertLevel.toUpperCase()}] ${title}`,
      text: item.description || `Global Disaster Alert: ${title} (Alert Level: ${alertLevel.toUpperCase()}).`,
      description: item.description || `GDACS Alert for ${eventType} event. Alert Level: ${alertLevel}. Coordinates: ${lat}, ${lon}.`,
      location: {
        latitude: lat,
        longitude: lon,
        address: title,
      },
      media: [],
      timestamp,
      metadata: {
        alertLevel,
        eventType,
        link: item.link || "",
      },
      raw: item,
    };
  }

  /**
   * Normalize a GDELT news article into a NormalizedEvent.
   *
   * @param {Object} article - GDELT article object
   * @returns {Object} NormalizedEvent
   */
  normalizeGdelt(article) {
    const title = article.title || "GDELT Disaster News";
    const sourceId = article.url || `gdelt_${Date.now()}`;
    const domain = article.domain || article.source || "news-source";
    const text = `${title}. Source: ${domain}.`;

    // Parse GDELT seendate (e.g. 20260819T040000Z or standard ISO)
    let timestamp = new Date();
    if (article.seendate) {
      const s = String(article.seendate);
      if (s.includes("-")) {
        const parsed = new Date(s);
        if (!isNaN(parsed.getTime())) timestamp = parsed;
      } else if (s.length >= 15 && s.includes("T")) {
        const year = s.slice(0, 4);
        const month = s.slice(4, 6);
        const day = s.slice(6, 8);
        const hour = s.slice(9, 11);
        const min = s.slice(11, 13);
        const sec = s.slice(13, 15);
        const parsed = new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}Z`);
        if (!isNaN(parsed.getTime())) timestamp = parsed;
      } else {
        const parsed = new Date(s);
        if (!isNaN(parsed.getTime())) timestamp = parsed;
      }
    }

    const lat = Number(article.latitude ?? article.location?.latitude ?? article.lat) || 0;
    const lon = Number(article.longitude ?? article.location?.longitude ?? article.lon) || 0;

    return {
      eventId: uuidv4(),
      sourceType: SOURCE_TYPES.GDELT,
      sourceId,
      title: `[News] ${title}`,
      text,
      description: `Disaster news reported by ${domain}: ${title}`,
      location: {
        latitude: lat,
        longitude: lon,
        address: article.sourcecountry || article.location?.address || domain,
      },
      media: article.socialimage ? [article.socialimage] : [],
      timestamp,
      metadata: {
        url: article.url || "",
        domain,
        language: article.language || "English",
        sourceCountry: article.sourcecountry || "",
        verified: false, // News is strictly unverified initially
      },
      raw: article,
    };
  }

  /**
   * Normalize a ReliefWeb humanitarian report into a NormalizedEvent.
   *
   * @param {Object} item - ReliefWeb report object
   * @returns {Object} NormalizedEvent
   */
  normalizeReliefWeb(item) {
    const fields = item.fields || item;
    const sourceId = String(fields.id || item.id || `rw_${Date.now()}`);
    const title = fields.title || "ReliefWeb Humanitarian Report";

    const bodyText = fields.body ? fields.body.slice(0, 500) : "";
    const sourceOrg = fields.source?.[0]?.name || fields.source?.[0]?.shortname || "Humanitarian Partner";
    const country = fields.primary_country || fields.country?.[0] || {};
    const countryName = country.name || "";
    const coords = country.location || {};

    const lat = Number(coords.lat) || 0;
    const lon = Number(coords.lon) || 0;

    const dateStr = fields.date?.created || fields.date?.original || fields.date?.changed;
    const timestamp = dateStr ? new Date(dateStr) : new Date();

    return {
      eventId: uuidv4(),
      sourceType: SOURCE_TYPES.RELIEFWEB,
      sourceId,
      title: `[ReliefWeb] ${title}`,
      text: bodyText ? `${title} — ${bodyText}` : title,
      description: `Humanitarian situation report by ${sourceOrg}: ${title}`,
      location: {
        latitude: lat,
        longitude: lon,
        address: countryName || "Global / Regional",
      },
      media: [],
      timestamp,
      metadata: {
        sourceOrg,
        country: countryName,
        url: fields.url || `https://reliefweb.int/node/${sourceId}`,
        disaster: fields.disaster || [],
        verified: false, // Trusted humanitarian source, but unverified alone
      },
      raw: item,
    };
  }
}

export const externalNormalizer = new ExternalNormalizer();
