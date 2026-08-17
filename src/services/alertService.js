import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore"
import { db, auth } from "../firebase/firebase"

const ALERTS_COLLECTION = "alerts"

const INITIAL_ALERTS = [
  {
    title: "Sector 4 Emergency Evacuation Order",
    message: "Immediate evacuation ordered for Sector 4 due to levee breach risk. Proceed to high ground.",
    target: "All Responders & Local Cell Towers",
    severity: "Critical",
    status: "Broadcasting",
    createdAt: new Date(Date.now() - 5 * 60 * 1000)
  },
  {
    title: "Sub-station B Gas Leak Safety Perimeter",
    message: "Establish 500m perimeter around Sub-station B. Hazmat teams dispatched.",
    target: "Fire & Hazmat Units",
    severity: "High",
    status: "Active",
    createdAt: new Date(Date.now() - 25 * 60 * 1000)
  },
  {
    title: "Regional Shelter Capacity Update",
    message: "Shelter #3 reached 90% capacity. Redirecting overflow to Central High Gym.",
    target: "NGO Coordination Hubs",
    severity: "Moderate",
    status: "Completed",
    createdAt: new Date(Date.now() - 120 * 60 * 1000)
  }
]

/**
 * Creates a new emergency broadcast alert in Firestore
 */
export const createAlert = async (alertData) => {
  try {
    const currentUser = auth.currentUser
    const payload = {
      title: alertData.title || "Emergency Broadcast Alert",
      message: alertData.message || "",
      severity: alertData.severity || "Critical",
      target: alertData.target || "All Sector First Responders",
      status: alertData.status || "Broadcasting",
      createdAt: serverTimestamp(),
      createdBy: currentUser ? currentUser.uid : "system"
    }

    const docRef = await addDoc(collection(db, ALERTS_COLLECTION), payload)
    return { id: docRef.id, ...payload }
  } catch (error) {
    console.error("Error creating alert in Firestore:", error)
    throw error
  }
}

/**
 * Attaches a real-time listener to the alerts collection in Firestore
 */
export const listenToAlerts = (callback) => {
  try {
    const q = query(
      collection(db, ALERTS_COLLECTION),
      orderBy("createdAt", "desc")
    )

    return onSnapshot(
      q,
      async (snapshot) => {
        if (snapshot.empty) {
          // Seed initial alert data if collection is empty
          try {
            for (const item of INITIAL_ALERTS) {
              await addDoc(collection(db, ALERTS_COLLECTION), {
                ...item,
                createdAt: serverTimestamp()
              })
            }
          } catch (e) {
            console.warn("Could not seed initial alerts:", e)
          }
        }
        const alerts = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        }))
        callback(alerts.length > 0 ? alerts : INITIAL_ALERTS)
      },
      (error) => {
        console.error("Error in listenToAlerts snapshot:", error)
        callback(INITIAL_ALERTS)
      }
    )
  } catch (error) {
    console.error("Error initializing listenToAlerts:", error)
    return () => {}
  }
}
