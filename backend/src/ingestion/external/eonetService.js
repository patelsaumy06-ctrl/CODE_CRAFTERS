/**
 * NASA EONET (Earth Observatory Natural Event Tracker) API Service — DisasterLens AI
 *
 * Fetches real-time natural event data (wildfires, storms, volcanoes, floods).
 * Official Source: https://eonet.gsfc.nasa.gov/api/v3/events
 */

const BASE_URL = process.env.NASA_EONET_BASE_URL || "https://eonet.gsfc.nasa.gov/api/v3/";

/**
 * Fetch active natural events from NASA EONET.
 *
 * @param {Object} opts - { category, status: "open"|"closed"|"all", limit: 50, days: 30 }
 * @returns {Promise<Object[]>} Array of raw EONET event objects
 */
export async function fetchRecentEvents(opts = {}) {
  const params = new URLSearchParams({
    status: opts.status || "open",
    limit: String(opts.limit || 50),
    days: String(opts.days || 30),
  });

  if (opts.category) {
    params.set("category", opts.category);
  }

  const url = `${BASE_URL}events?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`NASA EONET returned HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.events || [];
  } catch (error) {
    console.warn("[NASA EONET Service] Failed to fetch events:", error.message);
    return [];
  }
}

/**
 * Fetch a single EONET event by ID.
 *
 * @param {string} eventId
 * @returns {Promise<Object|null>}
 */
export async function fetchEventById(eventId) {
  const url = `${BASE_URL}events/${eventId}`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.warn(`[NASA EONET Service] Failed to fetch event ${eventId}:`, error.message);
    return null;
  }
}

export default {
  fetchRecentEvents,
  fetchEventById,
};
