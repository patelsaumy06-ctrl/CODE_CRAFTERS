/**
 * GDACS (Global Disaster Alert and Coordination System) Service — DisasterLens AI
 *
 * Fetches multi-disaster alerts (earthquakes, floods, cyclones, volcanoes, droughts, wildfires).
 * Official Source: https://www.gdacs.org/
 * RSS Feed: https://www.gdacs.org/xml/rss.xml
 * API: https://www.gdacs.org/gdacsapi/api/events/geteventlist/M
 */

const BASE_URL = process.env.GDACS_BASE_URL || "https://www.gdacs.org/";

/**
 * Fetch current global disaster alerts from GDACS API or RSS feed.
 *
 * @returns {Promise<Object[]>} List of raw GDACS event items with exact source IDs and timestamps
 */
export async function fetchAlerts() {
  let errors = [];

  // 1. Try JSON API first
  try {
    const jsonUrl = `${BASE_URL.replace(/\/?$/, "/")}gdacsapi/api/events/geteventlist/M`;
    const response = await fetch(jsonUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "DisasterLens-AI-LiveMonitor/1.0",
      },
      signal: AbortSignal.timeout(12000),
    });

    if (response.ok) {
      const data = await response.json();
      const rawEvents = Array.isArray(data)
        ? data
        : (data.features && Array.isArray(data.features) ? data.features : []);

      if (rawEvents.length > 0) {
        const parsed = parseGdacsJson(rawEvents);
        if (parsed.length > 0) {
          return parsed;
        }
      }
    } else {
      errors.push(`JSON API returned HTTP ${response.status}`);
    }
  } catch (jsonErr) {
    errors.push(`JSON API error: ${jsonErr.message}`);
  }

  // 2. Fall back to RSS XML feed
  try {
    const rssUrl = `${BASE_URL.replace(/\/?$/, "/")}xml/rss.xml`;
    const response = await fetch(rssUrl, {
      headers: {
        Accept: "application/xml, text/xml, */*",
        "User-Agent": "DisasterLens-AI-LiveMonitor/1.0",
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      throw new Error(`GDACS RSS returned HTTP ${response.status}`);
    }

    const xmlText = await response.text();
    const parsed = parseGdacsRssXml(xmlText);
    if (parsed.length > 0) {
      return parsed;
    }
    return [];
  } catch (rssErr) {
    errors.push(`RSS feed error: ${rssErr.message}`);
    const finalErr = new Error(`GDACS live sources unavailable: ${errors.join("; ")}`);
    console.warn("[GDACS Service]", finalErr.message);
    throw finalErr;
  }
}

/**
 * Parse GDACS JSON API items or GeoJSON features.
 *
 * @param {Object[]} items
 * @returns {Object[]}
 */
export function parseGdacsJson(items) {
  const results = [];

  for (const item of items) {
    const props = item.properties || item;
    const geom = item.geometry || {};

    const eventId = String(props.eventid || props.id || item.id || "").trim();
    if (!eventId) continue; // Must have authentic source event ID

    const eventType = String(props.eventtype || props.eventType || "").toUpperCase();
    const episodeId = String(props.episodeid || props.episodeId || "");
    const alertLevel = String(props.alertlevel || props.alertLevel || "Green");
    const alertScore = Number(props.alertscore ?? props.alertScore) || 0;
    const name = props.name || props.eventname || props.title || `GDACS Alert ${eventType} ${eventId}`;
    const description = props.description || props.htmldescription || "";
    const country = props.country || props.iso3 || "";
    const fromDate = props.fromdate || props.fromDate || null;
    const toDate = props.todate || props.toDate || null;
    const isCurrent = props.iscurrent !== undefined ? Boolean(props.iscurrent === "true" || props.iscurrent === true) : true;

    // Coordinate extraction
    let lat = null;
    let lon = null;
    if (geom.coordinates && Array.isArray(geom.coordinates)) {
      lon = Number(geom.coordinates[0]);
      lat = Number(geom.coordinates[1]);
    } else if (props.latitude !== undefined && props.longitude !== undefined) {
      lat = Number(props.latitude);
      lon = Number(props.longitude);
    }

    // Official event report URL
    const officialUrl = props.url?.report || props.url?.details || props.link ||
      `https://www.gdacs.org/report.aspx?eventtype=${eventType}&eventid=${eventId}`;

    const sourceUpdatedAt = toDate || fromDate || new Date().toISOString();

    results.push({
      id: eventId,
      sourceEventId: eventId,
      episodeId: episodeId || null,
      eventType: eventType.toLowerCase(),
      alertLevel: alertLevel.toLowerCase(),
      alertScore,
      title: `[GDACS ${alertLevel.toUpperCase()}] ${name}`,
      description: description || `GDACS Alert for ${eventType} event ${eventId} in ${country || "global region"}.`,
      country,
      fromDate,
      toDate,
      isCurrent,
      link: officialUrl,
      sourceUrl: officialUrl,
      pubDate: sourceUpdatedAt,
      latitude: !isNaN(lat) && lat !== null ? lat : null,
      longitude: !isNaN(lon) && lon !== null ? lon : null,
      raw: item,
    });
  }

  return results;
}

/**
 * Parse GDACS RSS XML using regex (no external XML dependencies required).
 *
 * @param {string} xmlText
 * @returns {Object[]}
 */
export function parseGdacsRssXml(xmlText) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemXml = match[1];

    const getTag = (tag) => {
      const tagRegex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
      const m = itemXml.match(tagRegex);
      return m ? m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1").trim() : "";
    };

    const title = getTag("title");
    const description = getTag("description");
    const link = getTag("link");
    const pubDate = getTag("pubDate");
    const latStr = getTag("geo:lat") || getTag("latitude");
    const lonStr = getTag("geo:long") || getTag("longitude");
    const eventType = getTag("gdacs:eventtype") || getTag("eventtype") || "unknown";
    const alertLevel = getTag("gdacs:alertlevel") || getTag("alertlevel") || "Green";
    const eventId = getTag("gdacs:eventid") || getTag("eventid");
    const episodeId = getTag("gdacs:episodeid") || getTag("episodeid");
    const alertScoreStr = getTag("gdacs:alertscore") || getTag("alertscore");
    const country = getTag("gdacs:country") || getTag("country");
    const isCurrentStr = getTag("gdacs:iscurrent") || getTag("iscurrent");

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    if (title && eventId) {
      const officialUrl = link || `https://www.gdacs.org/report.aspx?eventtype=${eventType.toUpperCase()}&eventid=${eventId}`;
      const isCurrent = isCurrentStr ? (isCurrentStr.toLowerCase() === "true" || isCurrentStr.toLowerCase() === "yes") : true;

      items.push({
        id: String(eventId).trim(),
        sourceEventId: String(eventId).trim(),
        episodeId: episodeId ? String(episodeId).trim() : null,
        title,
        description,
        link: officialUrl,
        sourceUrl: officialUrl,
        pubDate: pubDate || new Date().toISOString(),
        latitude: !isNaN(lat) ? lat : null,
        longitude: !isNaN(lon) ? lon : null,
        eventType: eventType.toLowerCase(),
        alertLevel: alertLevel.toLowerCase(),
        alertScore: parseFloat(alertScoreStr) || 0,
        country: country || "",
        isCurrent,
        rawXml: itemXml,
      });
    }
  }

  return items;
}

export default {
  fetchAlerts,
  parseGdacsJson,
  parseGdacsRssXml,
};
