import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore"
import { db } from "../firebase/firebase"
import { api } from "./apiClient"

const INCIDENTS_COLLECTION = "incidents"

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
      latitude: Number(data.location?.latitude) || 0,
      longitude: Number(data.location?.longitude) || 0,
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
 * Real-time listener — uses Firestore onSnapshot for live UI updates
 */
export const listenToIncidents = (callback) => {
  getIncidents()
    .then(callback)
    .catch((err) => console.error("Error bootstrapping incidents from API:", err))

  try {
    const q = query(collection(db, INCIDENTS_COLLECTION), orderBy("createdAt", "desc"))
    return onSnapshot(
      q,
      (snapshot) => {
        const incidents = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
        if (incidents.length > 0) callback(incidents)
      },
      (error) => {
        console.error("Error in listenToIncidents snapshot:", error)
        getIncidents().then(callback).catch(() => callback([]))
      }
    )
  } catch (error) {
    console.error("Error initializing listenToIncidents:", error)
    return () => {}
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
 * Deletes an incident via backend API (admin/commander only)
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
