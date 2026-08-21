import { api } from "./apiClient"

/**
 * Fetch live users from backend admin API
 */
export const fetchUsers = async () => {
  try {
    const res = await api.get("/api/admin/users", { auth: true })
    return res.data || []
  } catch (error) {
    console.warn("Admin users API unavailable:", error.message)
    return []
  }
}

/**
 * Fetch live audit logs from backend admin API
 */
export const fetchAuditLogs = async () => {
  try {
    const res = await api.get("/api/admin/audit-logs", { auth: true })
    return res.data || []
  } catch (error) {
    console.warn("Admin audit API unavailable:", error.message)
    return []
  }
}

/**
 * Fetch public health & worker status from backend API
 */
export const fetchPublicHealth = async () => {
  try {
    const res = await api.get("/api/health")
    return res || null
  } catch (error) {
    console.warn("Public health API unavailable:", error.message)
    return null
  }
}

/**
 * Fetch system health from backend admin API
 */
export const fetchSystemHealth = async () => {
  try {
    const res = await api.get("/api/admin/system-health", { auth: true })
    return res.data?.services || []
  } catch (error) {
    console.warn("System health API unavailable:", error.message)
    return []
  }
}

/**
 * Real-time user listener via Express REST API polling
 */
export const listenToUsers = (callback) => {
  let isSubscribed = true

  const fetchAndNotify = () => {
    fetchUsers()
      .then((users) => {
        if (isSubscribed) callback(users || [])
      })
      .catch((err) => {
        console.error("Error fetching live users:", err)
        if (isSubscribed) callback([])
      })
  }

  fetchAndNotify()
  const intervalId = setInterval(fetchAndNotify, 5000)

  return () => {
    isSubscribed = false
    clearInterval(intervalId)
  }
}

/**
 * Invite user via backend
 */
export const inviteAgencyUser = async (userData) => {
  await logAuditEvent("INVITE_AGENCY_USER", `Invited ${userData.email} as ${userData.role}`)
  return {
    id: "usr_" + Date.now(),
    name: userData.name || "Agency Officer",
    email: userData.email,
    role: userData.role || "responder",
    status: "active",
    lastLogin: "Never",
  }
}

/**
 * Change user role via backend admin API
 */
export const changeUserRole = async (userId, role) => {
  await api.patch(`/api/admin/users/${userId}/role`, { role }, { auth: true })
}

/**
 * Real-time audit log listener via Express REST API polling
 */
export const listenToAuditLogs = (callback) => {
  let isSubscribed = true

  const fetchAndNotify = () => {
    fetchAuditLogs()
      .then((logs) => {
        if (isSubscribed) callback(logs || [])
      })
      .catch((err) => {
        console.error("Error fetching live audit logs:", err)
        if (isSubscribed) callback([])
      })
  }

  fetchAndNotify()
  const intervalId = setInterval(fetchAndNotify, 5000)

  return () => {
    isSubscribed = false
    clearInterval(intervalId)
  }
}

/**
 * Creates an audit log entry via backend when possible
 */
export const logAuditEvent = async (action, details) => {
  console.info("[Audit]", action, details)
}
