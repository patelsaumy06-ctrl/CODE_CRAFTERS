/**
 * GDACS (Global Disaster Alert and Coordination System) Service — DisasterLens AI
 *
 * Fetches multi-disaster alerts (earthquakes, floods, cyclones, volcanoes, droughts).
 * Official Source: https://www.gdacs.org/
 * RSS Feed: https://www.gdacs.org/xml/rss.xml
 * API: https://www.gdacs.org/gdacsapi/api/events/geteventlist/M
 */

const BASE_URL = process.env.GDACS_BASE_URL || "https://www.gdacs.org/";

/**
 * Fetch current global disaster alerts from GDACS RSS feed or API.
 *
 * @returns {Promise<Object[]>} Normalized list of raw GDACS event items
 */
export async function fetchAlerts() {
  // Try JSON API first
  try {
    const jsonUrl = `${BASE_URL}gdacsapi/api/events/geteventlist/M`;
    const response = await fetch(jsonUrl, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
      if (data.features && Array.isArray(data.features)) {
        return data.features;
      }
    }
  } catch (jsonErr) {
    // Fall back to RSS XML
  }

  // Fallback to RSS feed
  try {
    const rssUrl = `${BASE_URL}xml/rss.xml`;
    const response = await fetch(rssUrl, {
      headers: { Accept: "application/xml, text/xml, */*" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`GDACS RSS returned HTTP ${response.status}`);
    }

    const xmlText = await response.text();
    return parseGdacsRssXml(xmlText);
  } catch (rssErr) {
    console.warn("[GDACS Service] Failed to fetch GDACS alerts:", rssErr.message);
    return [];
  }
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
    const eventType = getTag("gdacs:eventtype") || getTag("eventtype");
    const alertLevel = getTag("gdacs:alertlevel") || getTag("alertlevel");
    const eventId = getTag("gdacs:eventid") || getTag("eventid");

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    if (title) {
      items.push({
        id: eventId || `gdacs_${Date.now()}_${items.length}`,
        title,
        description,
        link,
        pubDate,
        latitude: !isNaN(lat) ? lat : null,
        longitude: !isNaN(lon) ? lon : null,
        eventType: (eventType || "unknown").toLowerCase(),
        alertLevel: (alertLevel || "Green").toLowerCase(),
        rawXml: itemXml,
      });
    }
  }

  return items;
}

export default {
  fetchAlerts,
  parseGdacsRssXml,
};
