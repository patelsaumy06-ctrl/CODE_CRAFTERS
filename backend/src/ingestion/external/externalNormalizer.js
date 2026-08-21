import { v4 as uuidv4 } from "uuid";
import { SOURCE_TYPES, APPLICATION_STATUS, SOURCE_STATUS, DISASTER_TYPES } from "../../config/constants.js";

/**
 * External Data Normalizer — DisasterLens AI
 *
 * Converts raw events from GDACS, USGS, NASA EONET, GDELT, and ReliefWeb
 * into canonical NormalizedEvent objects with complete source provenance and
 * distinct timestamps (event_time, source_updated_at, ingested_at, last_seen_at).
 */
export class ExternalNormalizer {
  /**
   * Validate coordinates to prevent placeholder/fabricated/corrupt coordinates.
   *
   * @param {number|null} lat
   * @param {number|null} lon
   * @returns {{ latitude: number|null, longitude: number|null, isValid: boolean }}
   */
  validateCoordinates(lat, lon) {
    const nLat = Number(lat);
    const nLon = Number(lon);

    if (
      lat === null ||
      lon === null ||
      lat === undefined ||
      lon === undefined ||
      Number.isNaN(nLat) ||
      Number.isNaN(nLon) ||
      (nLat === 0 && nLon === 0) ||
      nLat < -90 ||
      nLat > 90 ||
      nLon < -180 ||
      nLon > 180
    ) {
      return { latitude: null, longitude: null, isValid: false };
    }

    return { latitude: nLat, longitude: nLon, isValid: true };
  }

  /**
   * Map GDACS event type codes to standard DisasterLens types.
   */
  mapGdacsEventType(typeStr = "") {
    const t = String(typeStr).toLowerCase().trim();
    if (t === "eq" || t === "earthquake") return DISASTER_TYPES.EARTHQUAKE;
    if (t === "fl" || t === "flood") return DISASTER_TYPES.FLOOD;
    if (t === "tc" || t === "cyclone" || t === "hurricane" || t === "typhoon") return DISASTER_TYPES.CYCLONE;
    if (t === "vo" || t === "volcano") return "volcano";
    if (t === "dr" || t === "drought") return DISASTER_TYPES.DROUGHT;
    if (t === "wf" || t === "wildfire" || t === "fire") return DISASTER_TYPES.WILDFIRE;
    if (t === "ts" || t === "tsunami") return DISASTER_TYPES.TSUNAMI;
    if (t === "st" || t === "storm") return DISASTER_TYPES.STORM;
    return DISASTER_TYPES.OTHER;
  }

  /**
   * Normalize a GDACS alert event into a NormalizedEvent.
   *
   * @param {Object} item - GDACS event object
   * @returns {Object} NormalizedEvent
   */
  normalizeGdacs(item) {
    let sourceEventId = String(
      item.sourceEventId ||
      item.id ||
      item.eventid ||
      item["gdacs:eventid"] ||
      ""
    ).trim();

    if (!sourceEventId && (item.link || item.url || item.sourceUrl)) {
      const u = item.link || item.url || item.sourceUrl;
      const match = u.match(/eventid=([^&]+)/i);
      if (match) sourceEventId = match[1];
    }

    if (!sourceEventId) {
      throw new Error("GDACS record missing authoritative event ID");
    }

    const rawLat = item.latitude ?? item.lat ?? item["geo:lat"] ?? item.location?.latitude ?? item.location?.lat;
    const rawLon = item.longitude ?? item.lon ?? item["geo:long"] ?? item.location?.longitude ?? item.location?.lon;

    const { latitude, longitude, isValid: hasCoords } = this.validateCoordinates(rawLat, rawLon);

    const episodeId = item.episodeId ? String(item.episodeId).trim() : null;
    const rawEventType = String(item.eventType || item.eventtype || item["gdacs:eventtype"] || "unknown").toLowerCase();
    const disasterType = this.mapGdacsEventType(rawEventType);
    const alertLevel = String(item.alertLevel || item.alertlevel || item["gdacs:alertlevel"] || "Green").toLowerCase();
    const alertScore = Number(item.alertScore ?? item.alertscore) || 0;

    const ingestedAt = new Date().toISOString();

    // Authoritative event occurrence time vs source update time
    const rawFromDate = item.fromDate || item.fromdate;
    const rawPubDate = item.pubDate;
    const rawToDate = item.toDate || item.todate;

    const eventTime = rawFromDate
      ? new Date(rawFromDate).toISOString()
      : (rawPubDate ? new Date(rawPubDate).toISOString() : (rawToDate ? new Date(rawToDate).toISOString() : ingestedAt));

    const sourceUpdatedAt = rawPubDate
      ? new Date(rawPubDate).toISOString()
      : (rawToDate ? new Date(rawToDate).toISOString() : eventTime);

    const place = item.country || item.address || "Global Region";
    const title = item.title || `[GDACS ${alertLevel.toUpperCase()}] ${disasterType.toUpperCase()} in ${place}`;
    const officialUrl = item.sourceUrl || item.link ||
      `https://www.gdacs.org/report.aspx?eventtype=${rawEventType.toUpperCase()}&eventid=${sourceEventId}`;

    const isCurrent = item.isCurrent !== false;
    const sourceStatus = isCurrent ? SOURCE_STATUS.CURRENT : SOURCE_STATUS.PAST;

    // Build authentic evidence record
    const evidenceItem = {
      source: "GDACS",
      source_event_id: sourceEventId,
      source_url: officialUrl,
      event_time: eventTime,
      source_timestamp: sourceUpdatedAt,
      retrieved_at: ingestedAt,
      relationship: "Primary Global Disaster Alert Feed",
      alert_level: alertLevel,
      alert_score: alertScore,
      confidence: 0.95,
    };

    return {
      eventId: uuidv4(),
      source: "GDACS",
      sourceType: SOURCE_TYPES.GDACS,
      sourceId: sourceEventId,
      source_event_id: sourceEventId,
      episode_id: episodeId,
      raw_event_type: rawEventType,
      disasterType,
      title,
      text: item.description || `Global Disaster Alert: ${title} (Alert Level: ${alertLevel.toUpperCase()}).`,
      description: item.description || `GDACS Alert for ${rawEventType.toUpperCase()} event ${sourceEventId}. Alert Level: ${alertLevel}. Coordinates: ${latitude}, ${longitude}.`,
      location: {
        latitude: hasCoords ? latitude : 0,
        longitude: hasCoords ? longitude : 0,
        address: place,
        hasValidCoordinates: hasCoords,
      },
      source_status: sourceStatus,
      application_status: APPLICATION_STATUS.LIVE,
      event_time: eventTime,
      source_updated_at: sourceUpdatedAt,
      ingested_at: ingestedAt,
      last_seen_at: ingestedAt,
      source_url: officialUrl,
      media: [],
      timestamp: new Date(eventTime),
      evidence: [evidenceItem],
      metadata: {
        source: "GDACS",
        sourceEventId,
        episodeId,
        alertLevel,
        alertScore,
        rawEventType,
        url: officialUrl,
        country: place,
        fromDate: rawFromDate ? new Date(rawFromDate).toISOString() : null,
        toDate: rawToDate ? new Date(rawToDate).toISOString() : null,
        pubDate: rawPubDate ? new Date(rawPubDate).toISOString() : null,
        isCurrent,
        verified: false,
      },
      raw: item,
    };
  }

  /**
   * Normalize a USGS earthquake feature into a NormalizedEvent.
   *
   * @param {Object} feature - USGS GeoJSON feature
   * @returns {Object} NormalizedEvent
   */
  normalizeUsgs(feature) {
    const props = feature.properties || {};
    const coords = feature.geometry?.coordinates || [0, 0, 0];
    const rawLon = Number(coords[0]);
    const rawLat = Number(coords[1]);
    const depth = Number(coords[2]) || 0;
    const mag = props.mag !== null && props.mag !== undefined ? Number(props.mag) : 0;

    const sourceEventId = String(feature.id || props.code || "").trim();
    if (!sourceEventId) {
      throw new Error("USGS earthquake feature missing authoritative event ID");
    }

    const { latitude, longitude, isValid: hasCoords } = this.validateCoordinates(rawLat, rawLon);
    const place = props.place || "Unknown Seismic Zone";
    const title = props.title || `Earthquake M${mag.toFixed(1)} - ${place}`;

    const ingestedAt = new Date().toISOString();
    const eventTime = props.time ? new Date(props.time).toISOString() : ingestedAt;
    const sourceUpdatedAt = props.updated ? new Date(props.updated).toISOString() : eventTime;
    const officialUrl = props.url || `https://earthquake.usgs.gov/earthquakes/eventpage/${sourceEventId}`;

    const evidenceItem = {
      source: "USGS",
      source_event_id: sourceEventId,
      source_url: officialUrl,
      event_time: eventTime,
      source_timestamp: sourceUpdatedAt,
      retrieved_at: ingestedAt,
      relationship: "Authoritative Seismic Sensor Feed",
      magnitude: mag,
      depth_km: depth,
      confidence: 0.95,
    };

    return {
      eventId: uuidv4(),
      source: "USGS",
      sourceType: SOURCE_TYPES.USGS,
      sourceId: sourceEventId,
      source_event_id: sourceEventId,
      disasterType: DISASTER_TYPES.EARTHQUAKE,
      title,
      text: `USGS Earthquake Report: Magnitude ${mag.toFixed(1)} detected at ${place}. Depth: ${depth} km. Status: ${props.status || "reviewed"}. Tsunami warning: ${props.tsunami ? "YES" : "No"}.`,
      description: `Magnitude ${mag.toFixed(1)} earthquake recorded by USGS seismic stations. Location: ${place} (${latitude}, ${longitude}). Depth: ${depth} km.`,
      location: {
        latitude: hasCoords ? latitude : 0,
        longitude: hasCoords ? longitude : 0,
        address: place,
        hasValidCoordinates: hasCoords,
      },
      source_status: SOURCE_STATUS.CURRENT,
      application_status: APPLICATION_STATUS.LIVE,
      event_time: eventTime,
      source_updated_at: sourceUpdatedAt,
      ingested_at: ingestedAt,
      last_seen_at: ingestedAt,
      source_url: officialUrl,
      media: [],
      timestamp: new Date(eventTime),
      evidence: [evidenceItem],
      metadata: {
        source: "USGS",
        sourceEventId,
        magnitude: mag,
        depthKm: depth,
        alert: props.alert || null,
        tsunami: Boolean(props.tsunami),
        sig: props.sig || 0,
        status: props.status || "reviewed",
        url: officialUrl,
        verified: props.status === "reviewed",
      },
      raw: feature,
    };
  }

  /**
   * Normalize a NASA EONET v3 event into a NormalizedEvent.
   */
  normalizeEonet(event) {
    const sourceEventId = String(event.id || "").trim();
    if (!sourceEventId) {
      throw new Error("EONET event missing authoritative ID");
    }

    const title = event.title || "NASA EONET Natural Event";
    const geometries = event.geometries || [];
    const latestGeom = geometries[geometries.length - 1] || {};
    const coords = latestGeom.coordinates || [0, 0];

    let rawLon = 0;
    let rawLat = 0;
    if (Array.isArray(coords)) {
      if (typeof coords[0] === "number" && typeof coords[1] === "number") {
        rawLon = coords[0];
        rawLat = coords[1];
      } else if (Array.isArray(coords[0]) && typeof coords[0][0] === "number") {
        rawLon = coords[0][0];
        rawLat = coords[0][1];
      }
    }

    const { latitude, longitude, isValid: hasCoords } = this.validateCoordinates(rawLat, rawLon);
    const categoryObj = (event.categories && event.categories[0]) || {};
    const categoryName = categoryObj.title || categoryObj.id || "Natural Event";

    const ingestedAt = new Date().toISOString();
    const dateStr = latestGeom.date || event.closed || ingestedAt;
    const eventTime = new Date(dateStr).toISOString();
    const sourceUpdatedAt = event.updated ? new Date(event.updated).toISOString() : eventTime;
    const officialUrl = (event.sources && event.sources[0]?.url) || event.link || `https://eonet.gsfc.nasa.gov/api/v3/events/${sourceEventId}`;

    const isClosed = Boolean(event.closed);

    const evidenceItem = {
      source: "NASA_EONET",
      source_event_id: sourceEventId,
      source_url: officialUrl,
      event_time: eventTime,
      source_timestamp: sourceUpdatedAt,
      retrieved_at: ingestedAt,
      relationship: "NASA Earth Observatory Tracking",
      confidence: 0.95,
    };

    return {
      eventId: uuidv4(),
      source: "NASA_EONET",
      sourceType: SOURCE_TYPES.EONET,
      sourceId: sourceEventId,
      source_event_id: sourceEventId,
      title: `${categoryName}: ${title}`,
      text: event.description || `NASA EONET tracked natural event: ${title} (${categoryName}).`,
      description: `${title}. Category: ${categoryName}. Recorded by NASA Earth Observatory Natural Event Tracker.`,
      location: {
        latitude: hasCoords ? latitude : 0,
        longitude: hasCoords ? longitude : 0,
        address: `${title} (${categoryName})`,
        hasValidCoordinates: hasCoords,
      },
      source_status: isClosed ? SOURCE_STATUS.CLOSED : SOURCE_STATUS.CURRENT,
      application_status: isClosed ? APPLICATION_STATUS.HISTORICAL : APPLICATION_STATUS.LIVE,
      event_time: eventTime,
      source_updated_at: sourceUpdatedAt,
      ingested_at: ingestedAt,
      last_seen_at: ingestedAt,
      source_url: officialUrl,
      media: [],
      timestamp: new Date(eventTime),
      evidence: [evidenceItem],
      metadata: {
        source: "NASA_EONET",
        sourceEventId,
        category: categoryName,
        categoryId: categoryObj.id || "",
        link: event.link || "",
        sourceUrl: officialUrl,
      },
      raw: event,
    };
  }

  /**
   * Normalize a GDELT news article into a NormalizedEvent.
   */
  normalizeGdelt(article) {
    const title = article.title || "GDELT Disaster News";
    const sourceEventId = String(article.url || article.id || `gdelt_${Date.now()}`);
    const domain = article.domain || article.source || "news-wire";
    const text = `${title}. Source: ${domain}.`;

    let timestamp = new Date();
    if (article.seendate) {
      const s = String(article.seendate);
      if (/^\d{14}$/.test(s)) {
        const yr = s.slice(0, 4), mo = s.slice(4, 6), da = s.slice(6, 8);
        const hr = s.slice(8, 10), mi = s.slice(10, 12), se = s.slice(12, 14);
        const d = new Date(`${yr}-${mo}-${da}T${hr}:${mi}:${se}Z`);
        if (!isNaN(d.getTime())) timestamp = d;
      } else {
        const parsed = new Date(s);
        if (!isNaN(parsed.getTime())) timestamp = parsed;
      }
    }

    const { latitude, longitude, isValid: hasCoords } = this.validateCoordinates(
      article.latitude ?? article.location?.latitude ?? article.lat,
      article.longitude ?? article.location?.longitude ?? article.lon
    );

    const ingestedAt = new Date().toISOString();
    const eventTime = timestamp.toISOString();
    const sourceUpdatedAt = eventTime;
    const officialUrl = article.url || "";
    const place = article.sourcecountry || article.location?.address || article.country || domain;

    const evidenceItem = {
      source: "GDELT",
      source_event_id: sourceEventId,
      source_url: officialUrl,
      event_time: eventTime,
      source_timestamp: sourceUpdatedAt,
      retrieved_at: ingestedAt,
      relationship: "News Wire Corroboration",
      confidence: 0.55,
    };

    return {
      eventId: uuidv4(),
      source: "GDELT",
      sourceType: SOURCE_TYPES.GDELT,
      sourceId: sourceEventId,
      source_event_id: sourceEventId,
      title: `[News] ${title}`,
      text,
      description: `Disaster news reported by ${domain}: ${title}`,
      location: {
        latitude: hasCoords ? latitude : 0,
        longitude: hasCoords ? longitude : 0,
        address: place,
        hasValidCoordinates: hasCoords,
      },
      source_status: SOURCE_STATUS.CURRENT,
      application_status: APPLICATION_STATUS.LIVE,
      event_time: eventTime,
      source_updated_at: sourceUpdatedAt,
      ingested_at: ingestedAt,
      last_seen_at: ingestedAt,
      source_url: officialUrl,
      media: article.socialimage ? [article.socialimage] : [],
      timestamp,
      evidence: [evidenceItem],
      metadata: {
        source: "GDELT",
        sourceEventId,
        url: officialUrl,
        domain,
        language: article.language || "English",
        sourceCountry: article.sourcecountry || "",
        relevanceScore: article.relevanceScore || 0.7,
        verified: false,
      },
      raw: article,
    };
  }

  /**
   * Normalize a ReliefWeb report into a NormalizedEvent.
   */
  normalizeReliefWeb(item) {
    const fields = item.fields || item;
    const sourceEventId = String(fields.id || item.id || `rw_${Date.now()}`);
    const title = fields.title || "ReliefWeb Humanitarian Report";

    const bodyText = fields.body ? fields.body.slice(0, 500) : "";
    const sourceOrg = fields.source?.[0]?.name || fields.source?.[0]?.shortname || "Humanitarian Partner";
    const country = fields.primary_country || fields.country?.[0] || {};
    const countryName = country.name || "Global / Regional";
    const coords = country.location || {};

    const { latitude, longitude, isValid: hasCoords } = this.validateCoordinates(coords.lat, coords.lon);

    const ingestedAt = new Date().toISOString();
    const dateStr = fields.date?.created || fields.date?.original || fields.date?.changed;
    const eventTime = dateStr ? new Date(dateStr).toISOString() : ingestedAt;
    const sourceUpdatedAt = fields.date?.changed ? new Date(fields.date.changed).toISOString() : eventTime;
    const officialUrl = fields.url || `https://reliefweb.int/node/${sourceEventId}`;

    const evidenceItem = {
      source: "RELIEFWEB",
      source_event_id: sourceEventId,
      source_url: officialUrl,
      event_time: eventTime,
      source_timestamp: sourceUpdatedAt,
      retrieved_at: ingestedAt,
      relationship: "Humanitarian Partner Report",
      confidence: 0.85,
    };

    return {
      eventId: uuidv4(),
      source: "RELIEFWEB",
      sourceType: SOURCE_TYPES.RELIEFWEB,
      sourceId: sourceEventId,
      source_event_id: sourceEventId,
      title: `[ReliefWeb] ${title}`,
      text: bodyText ? `${title} — ${bodyText}` : title,
      description: `Humanitarian situation report by ${sourceOrg}: ${title}`,
      location: {
        latitude: hasCoords ? latitude : 0,
        longitude: hasCoords ? longitude : 0,
        address: countryName,
        hasValidCoordinates: hasCoords,
      },
      source_status: SOURCE_STATUS.CURRENT,
      application_status: APPLICATION_STATUS.LIVE,
      event_time: eventTime,
      source_updated_at: sourceUpdatedAt,
      ingested_at: ingestedAt,
      last_seen_at: ingestedAt,
      source_url: officialUrl,
      media: [],
      timestamp: new Date(eventTime),
      evidence: [evidenceItem],
      metadata: {
        source: "RELIEFWEB",
        sourceEventId,
        sourceOrg,
        country: countryName,
        url: officialUrl,
        disaster: fields.disaster || [],
        verified: false,
      },
      raw: item,
    };
  }
}

export const externalNormalizer = new ExternalNormalizer();
