import { api } from "./apiClient"

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
 * Fetch live alerts from backend API
 */
export const fetchAlerts = async () => {
  try {
    const res = await api.get("/api/alerts")
    return res.data || []
  } catch (error) {
    console.warn("Alerts API unavailable:", error.message)
    return []
  }
}

/**
 * Real-time alerts listener via Express REST API polling
 */
export const listenToAlerts = (callback) => {
  let isSubscribed = true

  const fetchAndNotify = () => {
    fetchAlerts()
      .then((alerts) => {
        if (isSubscribed) callback(alerts || [])
      })
      .catch((err) => {
        console.error("Error fetching live alerts:", err)
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
 * Update alert status via backend API
 */
export const updateAlert = async (id, data) => {
  const res = await api.patch(`/api/alerts/${id}`, data, { auth: true })
  return res.data
}
