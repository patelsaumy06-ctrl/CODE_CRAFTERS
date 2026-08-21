import { api } from "./apiClient"

/**
 * Creates a new incident via backend API
 */
export const createIncident = async (data) => {
  const payload = {
    title: data.title || "Untitled Incident",
    description: data.description || "",
    disasterType: data.disasterType || "other",
    severity: data.severity || "medium",
    status: data.status || "reported",
    location: {
      latitude: Number(data.location?.latitude ?? data.location?.lat) || 0,
      longitude: Number(data.location?.longitude ?? data.location?.lng) || 0,
      address: data.location?.address || "Unknown Location",
    },
    source: data.source || "User Ingested",
    source_event_id: data.source_event_id || `manual_${Date.now()}`,
    sourceUrl: data.sourceUrl || "",
    verified: Boolean(data.verified || false),
  }

  const res = await api.post("/api/incidents", payload, { auth: true })
  return res.data
}

/**
 * Retrieves all live incidents within the rolling 3-day window from backend API
 */
export const getIncidents = async (filters = {}) => {
  const params = new URLSearchParams()
  params.set("days", filters.days || "3")
  if (filters.disasterType && filters.disasterType !== "All") params.set("disasterType", filters.disasterType)
  if (filters.severity && filters.severity !== "All") params.set("severity", filters.severity)
  if (filters.status && filters.status !== "All") params.set("status", filters.status)
  if (filters.includeHistorical) params.set("includeHistorical", "true")

  const qs = params.toString()
  const res = await api.get(`/api/incidents${qs ? `?${qs}` : ""}`)
  return {
    data: res.data || res.incidents || [],
    incidents: res.incidents || res.data || [],
    date_window: res.date_window || null,
    is_live: res.is_live ?? true,
    count: res.count || 0,
    sources_health: res.sources_health || {},
    provenance: res.provenance || null,
    meta: res.meta || {},
  }
}

/**
 * Fetch multi-source data integrity and provenance status
 */
export const fetchProvenance = async (days = 3) => {
  try {
    const res = await api.get(`/api/incidents/provenance?days=${days}`)
    return res.data || null
  } catch (error) {
    console.warn("Failed to fetch data provenance:", error.message)
    return null
  }
}

/**
 * Trigger on-demand live synchronization from external feeds (GDACS, USGS)
 */
export const triggerLiveSync = async (service = null, days = 3) => {
  const res = await api.post("/api/incidents/sync", { service, days })
  return {
    data: res.data || res.incidents || [],
    incidents: res.incidents || res.data || [],
    date_window: res.date_window || null,
    is_live: res.is_live ?? true,
    count: res.count || 0,
    sources_health: res.sources_health || {},
    provenance: res.provenance || null,
    syncResults: res.syncResults || {},
  }
}

/**
 * Real-time incident listener via Express REST API polling
 */
export const listenToIncidents = (callback, days = 3) => {
  let isSubscribed = true

  const fetchAndNotify = () => {
    getIncidents({ days })
      .then((result) => {
        if (isSubscribed) {
          callback({
            incidents: result.incidents || result.data || [],
            data: result.data || result.incidents || [],
            date_window: result.date_window,
            is_live: result.is_live,
            count: result.count,
            sources_health: result.sources_health,
            provenance: result.provenance,
            meta: result.meta,
            error: null,
          })
        }
      })
      .catch((err) => {
        console.error("Error fetching live incidents from API:", err)
        if (isSubscribed) {
          callback({
            incidents: [],
            data: [],
            date_window: null,
            is_live: false,
            count: 0,
            sources_health: {},
            provenance: null,
            meta: {},
            error: err.message || "Failed to reach backend API",
          })
        }
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
 * Fetches a single incident by ID via backend API
 */
export const getIncidentById = async (id) => {
  try {
    const res = await api.get(`/api/incidents/${id}`)
    return { ...res.data, sources: res.sources, recommendations: res.recommendations }
  } catch {
    return null
  }
}

/**
 * Updates an incident via backend API
 */
export const updateIncident = async (id, data) => {
  const res = await api.patch(`/api/incidents/${id}`, data, { auth: true })
  return res.data
}

/**
 * Deletes an incident via backend API (admin only)
 */
export const deleteIncident = async (id) => {
  await api.delete(`/api/incidents/${id}`, { auth: true })
  return true
}

/**
 * Find nearby incidents via backend geo query
 */
export const getNearbyIncidents = async (lat, lon, radiusKm = 25, days = 3) => {
  const res = await api.get(`/api/incidents/nearby?lat=${lat}&lon=${lon}&radiusKm=${radiusKm}&days=${days}`)
  return res.data || []
}
