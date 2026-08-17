import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore"
import { db } from "../firebase/firebase"
import { api } from "./apiClient"

const ALERTS_COLLECTION = "alerts"

/** Demo-only seed alerts — marked with isDemo: true */
export const DEMO_ALERTS = [
  {
    title: "[DEMO] Sector 4 Emergency Evacuation Order",
    message: "Immediate evacuation ordered for Sector 4 due to levee breach risk.",
    target: "All Responders & Local Cell Towers",
    severity: "Critical",
    status: "Broadcasting",
    isDemo: true,
  },
  {
    title: "[DEMO] Sub-station B Safety Perimeter",
    message: "Establish 500m perimeter around Sub-station B. Hazmat teams dispatched.",
    target: "Fire & Hazmat Units",
    severity: "High",
    status: "Active",
    isDemo: true,
  },
]

/**
 * Creates a new emergency broadcast alert via backend API
 */
export const createAlert = async (alertData) => {
  const payload = {
    title: alertData.title || "Emergency Broadcast Alert",
    message: alertData.message || "",
    severity: alertData.severity || "Critical",
    target: alertData.target || "All Sector First Responders",
    status: alertData.status || "Broadcasting",
  }

  const res = await api.post("/api/alerts", payload, { auth: true })
  return res.data
}

/**
 * Fetch alerts from backend API
 */
export const fetchAlerts = async () => {
  try {
    const res = await api.get("/api/alerts")
    return res.data || []
  } catch (error) {
    console.warn("Alerts API unavailable:", error.message)
    return DEMO_ALERTS
  }
}

/**
 * Real-time alerts listener — API bootstrap + Firestore onSnapshot
 */
export const listenToAlerts = (callback) => {
  fetchAlerts().then(callback)

  try {
    const q = query(collection(db, ALERTS_COLLECTION), orderBy("createdAt", "desc"))
    return onSnapshot(
      q,
      (snapshot) => {
        const alerts = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
        callback(alerts.length > 0 ? alerts : DEMO_ALERTS)
      },
      () => fetchAlerts().then(callback)
    )
  } catch (error) {
    console.error("Error initializing listenToAlerts:", error)
    return () => {}
  }
}

/**
 * Update alert status via backend API
 */
export const updateAlert = async (id, data) => {
  const res = await api.patch(`/api/alerts/${id}`, data, { auth: true })
  return res.data
}
