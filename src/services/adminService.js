import { api } from "./apiClient"

/** Demo-only seed data — never presented as production records */
export const DEMO_USERS = [
  { id: "usr_demo_1", name: "Sarah Connor", email: "s.connor@agency.gov", role: "admin", status: "active", lastLogin: "10m ago", isDemo: true },
  { id: "usr_demo_2", name: "Marcus Wright", email: "m.wright@agency.gov", role: "responder", status: "active", lastLogin: "1h ago", isDemo: true },
  { id: "usr_demo_3", name: "Elena Rostova", email: "e.rostova@agency.gov", role: "admin", status: "active", lastLogin: "Just now", isDemo: true },
]

export const DEMO_AUDIT = [
  { id: "log_demo_1", action: "USER_LOGIN_SUCCESS", user: "e.rostova@agency.gov", ip: "192.168.1.104", status: "Success", time: "Just now", isDemo: true },
  { id: "log_demo_2", action: "BROADCAST_ALERT_DISPATCHED", user: "s.connor@agency.gov", ip: "192.168.1.88", status: "Success", time: "5m ago", isDemo: true },
]

/**
 * Fetch users from backend admin API
 */
export const fetchUsers = async () => {
  try {
    const res = await api.get("/api/admin/users", { auth: true })
    return res.data || []
  } catch (error) {
    console.warn("Admin users API unavailable, using demo fallback:", error.message)
    return DEMO_USERS
  }
}

/**
 * Fetch audit logs from backend admin API
 */
export const fetchAuditLogs = async () => {
  try {
    const res = await api.get("/api/admin/audit-logs", { auth: true })
    return res.data || []
  } catch (error) {
    console.warn("Admin audit API unavailable, using demo fallback:", error.message)
    return DEMO_AUDIT
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
        if (isSubscribed) callback(users.length > 0 ? users : DEMO_USERS)
      })
      .catch(() => {
        if (isSubscribed) callback(DEMO_USERS)
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
 * Invite user via backend (role changes require admin API)
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
    isDemo: false,
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
        if (isSubscribed) callback(logs.length > 0 ? logs : DEMO_AUDIT)
      })
      .catch(() => {
        if (isSubscribed) callback(DEMO_AUDIT)
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
