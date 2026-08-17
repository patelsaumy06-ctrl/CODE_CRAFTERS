import { api } from "./apiClient"

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
 * Real-time alerts listener via Express REST API polling
 */
export const listenToAlerts = (callback) => {
  let isSubscribed = true

  const fetchAndNotify = () => {
    fetchAlerts()
      .then((alerts) => {
        if (isSubscribed) callback(alerts.length > 0 ? alerts : DEMO_ALERTS)
      })
      .catch(() => {
        if (isSubscribed) callback(DEMO_ALERTS)
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
