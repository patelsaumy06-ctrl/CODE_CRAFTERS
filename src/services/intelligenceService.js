import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore"
import { db } from "../firebase/firebase"

const INTELLIGENCE_COLLECTION = "intelligence"

const INITIAL_FEED = [
  {
    source: "X/Twitter Stream",
    handle: "@city_resident",
    text: "Water level rising fast near 4th street bridge! Roads completely impassable. Stay clear!",
    urgency: "High",
    sentiment: "Panic / Crisis",
    media: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=400",
    confidence: 91,
    createdAt: new Date(Date.now() - 2 * 60 * 1000)
  },
  {
    source: "NOAA Sensor API",
    handle: "Station #402",
    text: "Telemetry spike: Water Gauge reading +2.4 meters above normal baseline.",
    urgency: "Critical",
    sentiment: "Sensor Trigger",
    media: null,
    confidence: 99,
    createdAt: new Date(Date.now() - 5 * 60 * 1000)
  },
  {
    source: "Citizen Report App",
    handle: "Anonymous User #88",
    text: "Sparking electric pole near flooded sub-station B. Power cut across 2 blocks.",
    urgency: "Moderate",
    sentiment: "Infrastructure Hazard",
    media: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&q=80&w=400",
    confidence: 84,
    createdAt: new Date(Date.now() - 12 * 60 * 1000)
  }
]

/**
 * Creates a new intelligence feed item in Firestore
 */
export const createIntelligenceItem = async (data) => {
  try {
    const payload = {
      source: data.source || "User Report",
      handle: data.handle || "@user",
      text: data.text || "",
      urgency: data.urgency || "Moderate",
      sentiment: data.sentiment || "General Observation",
      media: data.media || null,
      confidence: Number(data.confidence) || 85,
      createdAt: serverTimestamp()
    }
    const docRef = await addDoc(collection(db, INTELLIGENCE_COLLECTION), payload)
    return { id: docRef.id, ...payload }
  } catch (error) {
    console.error("Error creating intelligence item in Firestore:", error)
    throw error
  }
}

/**
 * Attaches a real-time listener to the intelligence collection in Firestore
 */
export const listenToIntelligenceFeed = (callback) => {
  try {
    const q = query(
      collection(db, INTELLIGENCE_COLLECTION),
      orderBy("createdAt", "desc")
    )

    return onSnapshot(
      q,
      async (snapshot) => {
        if (snapshot.empty) {
          try {
            for (const item of INITIAL_FEED) {
              await addDoc(collection(db, INTELLIGENCE_COLLECTION), {
                ...item,
                createdAt: serverTimestamp()
              })
            }
          } catch (e) {
            console.warn("Could not seed intelligence feed:", e)
          }
        }
        const items = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        }))
        callback(items.length > 0 ? items : INITIAL_FEED)
      },
      (error) => {
        console.error("Error in listenToIntelligenceFeed snapshot:", error)
        callback(INITIAL_FEED)
      }
    )
  } catch (error) {
    console.error("Error initializing listenToIntelligenceFeed:", error)
    return () => {}
  }
}
