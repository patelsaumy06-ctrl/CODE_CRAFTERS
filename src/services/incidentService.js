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
    sourceUrl: data.sourceUrl || "",
    verified: Boolean(data.verified || false),
  }

  const res = await api.post("/api/incidents", payload, { auth: true })
  return res.data
}

/**
 * Retrieves all incidents from backend API
 */
export const getIncidents = async () => {
  const res = await api.get("/api/incidents")
  return res.data || []
}

/**
 * Real-time incident listener via Express REST API polling
 */
export const listenToIncidents = (callback) => {
  let isSubscribed = true

  const fetchAndNotify = () => {
    getIncidents()
      .then((incidents) => {
        if (isSubscribed) callback(incidents)
      })
      .catch((err) => {
        console.error("Error fetching incidents from API:", err)
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
export const getNearbyIncidents = async (lat, lon, radiusKm = 25) => {
  const res = await api.get(`/api/incidents/nearby?lat=${lat}&lon=${lon}&radiusKm=${radiusKm}`)
  return res.data || []
}
