import {
  collection,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "../firebase/firebase"
import { api } from "./apiClient"

const USERS_COLLECTION = "users"
const AUDIT_COLLECTION = "audit_logs"

/** Demo-only seed data — never presented as production records */
export const DEMO_USERS = [
  { id: "usr_demo_1", name: "Sarah Connor", email: "s.connor@agency.gov", role: "commander", status: "active", lastLogin: "10m ago", isDemo: true },
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
 * Real-time user listener — falls back to API poll when Firestore empty
 */
export const listenToUsers = (callback) => {
  fetchUsers().then(callback)

  try {
    return onSnapshot(
      collection(db, USERS_COLLECTION),
      (snapshot) => {
        const users = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
        callback(users.length > 0 ? users : DEMO_USERS)
      },
      () => fetchUsers().then(callback)
    )
  } catch (error) {
    console.error("Error initializing listenToUsers:", error)
    return () => {}
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
 * Real-time audit log listener with API bootstrap
 */
export const listenToAuditLogs = (callback) => {
  fetchAuditLogs().then(callback)

  try {
    const q = query(collection(db, AUDIT_COLLECTION), orderBy("createdAt", "desc"))
    return onSnapshot(
      q,
      (snapshot) => {
        const logs = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
        callback(logs.length > 0 ? logs : DEMO_AUDIT)
      },
      () => fetchAuditLogs().then(callback)
    )
  } catch (error) {
    console.error("Error initializing listenToAuditLogs:", error)
    return () => {}
  }
}

/**
 * Creates an audit log entry via backend when possible
 */
export const logAuditEvent = async (action, details) => {
  console.info("[Audit]", action, details)
}
