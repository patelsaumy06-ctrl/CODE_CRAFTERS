import { api } from "./apiClient"

/**
 * Fetch live intelligence feed from backend API
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
    console.warn("Intelligence API unavailable:", error.message)
    return []
  }
}

/**
 * Real-time intelligence feed listener via Express REST API polling
 */
export const listenToIntelligenceFeed = (callback) => {
  let isSubscribed = true

  const fetchAndNotify = () => {
    fetchIntelligenceFeed()
      .then((items) => {
        if (isSubscribed) callback(items || [])
      })
      .catch((err) => {
        console.error("Error fetching live intelligence feed:", err)
        if (isSubscribed) callback([])
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
  const latRaw = data.latitude ?? data.location?.latitude ?? data.location?.lat
  const lngRaw = data.longitude ?? data.location?.longitude ?? data.location?.lng
  const lat = Number(latRaw)
  const lng = Number(lngRaw)

  const latitude = !Number.isNaN(lat) && latRaw !== undefined ? lat : 0
  const longitude = !Number.isNaN(lng) && lngRaw !== undefined ? lng : 0

  const res = await api.post("/api/ingest/citizen", {
    title: data.title || data.text?.slice(0, 80) || "Citizen Report",
    description: data.text || data.description || "",
    latitude,
    longitude,
    timestamp: data.timestamp || new Date().toISOString(),
    source: data.source || "Citizen Stream",
  })
  return res.data
}

/**
 * Fetch external disaster news & humanitarian reports from GDELT & ReliefWeb
 */
export const fetchDisasterNews = async (filters = {}) => {
  try {
    const params = new URLSearchParams()
    if (filters.query) params.set("query", filters.query)
    if (filters.location) params.set("location", filters.location)
    if (filters.limit) params.set("limit", filters.limit)
    const qs = params.toString()
    const res = await api.get(`/api/disasters/news${qs ? `?${qs}` : ""}`)
    return res.data || []
  } catch (error) {
    console.warn("Disaster news API unavailable:", error.message)
    return []
  }
}

/**
 * Request AI Multi-Source Incident Verification
 */
export const verifyDisasterAI = async (payload) => {
  try {
    const res = await api.post("/api/ai/verify", payload)
    return res.verification || null
  } catch (error) {
    console.warn("AI verification API unavailable:", error.message)
    return null
  }
}

/**
 * Request Open-Meteo Weather and Flood Telemetry Risk Analysis
 */
export const analyzeRisk = async (payload) => {
  try {
    const res = await api.post("/api/risk/analyze", payload)
    return res.analysis || null
  } catch (error) {
    console.warn("Risk analysis API unavailable:", error.message)
    return null
  }
}
