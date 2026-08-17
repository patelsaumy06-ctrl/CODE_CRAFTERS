import { api } from "./apiClient"

/** Demo-only feed items — marked with isDemo: true */
export const DEMO_FEED = [
  {
    source: "X/Twitter Stream",
    handle: "@city_resident",
    text: "[DEMO] Water level rising fast near 4th street bridge! Roads completely impassable.",
    urgency: "High",
    sentiment: "Panic / Crisis",
    confidence: 91,
    isDemo: true,
  },
  {
    source: "NOAA Sensor API",
    handle: "Station #402",
    text: "[DEMO] Telemetry spike: Water Gauge reading +2.4 meters above normal baseline.",
    urgency: "Critical",
    sentiment: "Sensor Trigger",
    confidence: 99,
    isDemo: true,
  },
]

/**
 * Fetch intelligence feed from backend API
 */
export const fetchIntelligenceFeed = async (filters = {}) => {
  try {
    const params = new URLSearchParams()
    if (filters.urgency) params.set("urgency", filters.urgency)
    if (filters.source) params.set("source", filters.source)
    if (filters.limit) params.set("limit", filters.limit)
    const qs = params.toString()
    const res = await api.get(`/api/intelligence/feed${qs ? `?${qs}` : ""}`)
    return res.data || []
  } catch (error) {
    console.warn("Intelligence API unavailable, using demo fallback:", error.message)
    return DEMO_FEED
  }
}

/**
 * Real-time intelligence feed via Express REST API polling
 */
export const listenToIntelligenceFeed = (callback) => {
  let isSubscribed = true

  const fetchAndNotify = () => {
    fetchIntelligenceFeed()
      .then((items) => {
        if (isSubscribed) callback(items.length > 0 ? items : DEMO_FEED)
      })
      .catch(() => {
        if (isSubscribed) callback(DEMO_FEED)
      })
  }

  fetchAndNotify()
  const intervalId = setInterval(fetchAndNotify, 4000)

  return () => {
    isSubscribed = false
    clearInterval(intervalId)
  }
}

/**
 * Ingest citizen report via backend pipeline
 */
export const createIntelligenceItem = async (data) => {
  const res = await api.post("/api/ingest/citizen", {
    title: data.title || data.text?.slice(0, 80) || "Citizen Report",
    description: data.text || data.description || "",
    location: {
      lat: Number(data.latitude ?? data.location?.latitude ?? data.location?.lat) || 0,
      lng: Number(data.longitude ?? data.location?.longitude ?? data.location?.lng) || 0,
    },
  })
  return res.data
}
