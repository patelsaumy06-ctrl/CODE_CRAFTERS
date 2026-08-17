import {
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  setDoc
} from "firebase/firestore"
import { db } from "../firebase/firebase"

const USERS_COLLECTION = "users"
const AUDIT_COLLECTION = "audit_logs"

const INITIAL_USERS = [
  { id: "usr_1", name: "Sarah Connor", email: "s.connor@agency.gov", role: "commander", status: "active", lastLogin: "10m ago" },
  { id: "usr_2", name: "Marcus Wright", email: "m.wright@agency.gov", role: "responder", status: "active", lastLogin: "1h ago" },
  { id: "usr_3", name: "Elena Rostova", email: "e.rostova@agency.gov", role: "admin", status: "active", lastLogin: "Just now" },
  { id: "usr_4", name: "David Kim", email: "d.kim@agency.gov", role: "analyst", status: "inactive", lastLogin: "2 days ago" },
]

const INITIAL_AUDIT = [
  { id: "log_1", action: "USER_LOGIN_SUCCESS", user: "e.rostova@agency.gov", ip: "192.168.1.104", status: "Success", time: "Just now" },
  { id: "log_2", action: "BROADCAST_ALERT_DISPATCHED", user: "s.connor@agency.gov", ip: "192.168.1.88", status: "Success", time: "5m ago" },
  { id: "log_3", action: "INCIDENT_VERIFIED_CRITICAL", user: "SYSTEM_AI_ENGINE", ip: "10.0.4.12", status: "Automated", time: "14m ago" },
]

export const API_SERVICES_MONITOR = [
  { service: "USGS Seismic Stream", endpoint: "api.usgs.gov/v1/earthquakes", status: "Healthy", latency: "42ms" },
  { service: "NOAA Weather Radar", endpoint: "api.weather.gov/alerts", status: "Healthy", latency: "88ms" },
  { service: "X/Twitter Crisis Stream", endpoint: "api.x.com/2/tweets/search/stream", status: "Degraded", latency: "310ms" },
  { service: "Copernicus Satellite SAR", endpoint: "sentinel.copernicus.eu/api", status: "Healthy", latency: "120ms" },
]

/**
 * Attaches a real-time listener to users collection in Firestore
 */
export const listenToUsers = (callback) => {
  try {
    return onSnapshot(
      collection(db, USERS_COLLECTION),
      async (snapshot) => {
        if (snapshot.empty) {
          try {
            for (const user of INITIAL_USERS) {
              await setDoc(doc(db, USERS_COLLECTION, user.id), {
                ...user,
                createdAt: serverTimestamp()
              })
            }
          } catch (e) {
            console.warn("Could not seed users:", e)
          }
        }
        const users = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }))
        callback(users.length > 0 ? users : INITIAL_USERS)
      },
      (error) => {
        console.error("Error in listenToUsers snapshot:", error)
        callback(INITIAL_USERS)
      }
    )
  } catch (error) {
    console.error("Error initializing listenToUsers:", error)
    return () => {}
  }
}

/**
 * Invites / registers a new agency user in Firestore
 */
export const inviteAgencyUser = async (userData) => {
  try {
    const customId = "usr_" + Date.now()
    const payload = {
      name: userData.name || "Agency Officer",
      email: userData.email,
      role: userData.role || "responder",
      status: "active",
      lastLogin: "Never",
      createdAt: serverTimestamp()
    }
    await setDoc(doc(db, USERS_COLLECTION, customId), payload)
    await logAuditEvent("INVITE_AGENCY_USER", `Invited ${userData.email} as ${userData.role}`)
    return { id: customId, ...payload }
  } catch (error) {
    console.error("Error inviting user:", error)
    throw error
  }
}

/**
 * Attaches a real-time listener to security audit logs in Firestore
 */
export const listenToAuditLogs = (callback) => {
  try {
    const q = query(
      collection(db, AUDIT_COLLECTION),
      orderBy("createdAt", "desc")
    )
    return onSnapshot(
      q,
      async (snapshot) => {
        if (snapshot.empty) {
          try {
            for (const item of INITIAL_AUDIT) {
              await addDoc(collection(db, AUDIT_COLLECTION), {
                ...item,
                createdAt: serverTimestamp()
              })
            }
          } catch (e) {
            console.warn("Could not seed audit logs:", e)
          }
        }
        const logs = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }))
        callback(logs.length > 0 ? logs : INITIAL_AUDIT)
      },
      (error) => {
        console.error("Error in listenToAuditLogs snapshot:", error)
        callback(INITIAL_AUDIT)
      }
    )
  } catch (error) {
    console.error("Error initializing listenToAuditLogs:", error)
    return () => {}
  }
}

/**
 * Creates an audit log entry in Firestore
 */
export const logAuditEvent = async (action, details) => {
  try {
    await addDoc(collection(db, AUDIT_COLLECTION), {
      action,
      details,
      user: "Current Operator",
      ip: "192.168.1.100",
      status: "Success",
      createdAt: serverTimestamp()
    })
  } catch (e) {
    console.warn("Audit logging failed:", e)
  }
}
