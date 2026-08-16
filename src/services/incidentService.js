import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore"
import { db, auth } from "../firebase/firebase"

const INCIDENTS_COLLECTION = "incidents"

/**
 * Creates a new incident document in Firestore
 * @param {Object} data - Incident data object
 */
export const createIncident = async (data) => {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      throw new Error("Authentication required to report an incident.")
    }

    const payload = {
      title: data.title || "Untitled Incident",
      description: data.description || "",
      disasterType: data.disasterType || "other",
      severity: data.severity || "medium",
      status: data.status || "reported",
      location: {
        latitude: Number(data.location?.latitude) || 0,
        longitude: Number(data.location?.longitude) || 0,
        address: data.location?.address || "Unknown Location"
      },
      source: data.source || "User Ingested",
      sourceUrl: data.sourceUrl || "",
      reportedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: currentUser.uid,
      verified: Boolean(data.verified || false)
    }

    const docRef = await addDoc(collection(db, INCIDENTS_COLLECTION), payload)
    return { id: docRef.id, ...payload }
  } catch (error) {
    console.error("Error in createIncident:", error)
    throw error
  }
}

/**
 * Retrieves all incidents from Firestore, ordered by creation date descending
 */
export const getIncidents = async () => {
  try {
    const q = query(
      collection(db, INCIDENTS_COLLECTION),
      orderBy("createdAt", "desc")
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data()
    }))
  } catch (error) {
    console.error("Error in getIncidents:", error)
    throw error
  }
}

/**
 * Attaches a real-time listener to the incidents collection
 * @param {Function} callback - Function called with fresh incident array on updates
 * @returns {Function} Unsubscribe function to terminate listener
 */
export const listenToIncidents = (callback) => {
  try {
    const q = query(
      collection(db, INCIDENTS_COLLECTION),
      orderBy("createdAt", "desc")
    )
    return onSnapshot(
      q,
      (snapshot) => {
        const incidents = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        }))
        callback(incidents)
      },
      (error) => {
        console.error("Error in listenToIncidents snapshot:", error)
      }
    )
  } catch (error) {
    console.error("Error initializing listenToIncidents:", error)
    return () => {}
  }
}

/**
 * Fetches a single incident by ID
 * @param {string} id - Document ID
 */
export const getIncidentById = async (id) => {
  try {
    const docRef = doc(db, INCIDENTS_COLLECTION, id)
    const snap = await getDoc(docRef)
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() }
    }
    return null
  } catch (error) {
    console.error(`Error in getIncidentById (${id}):`, error)
    throw error
  }
}

/**
 * Updates an incident document
 * @param {string} id - Document ID
 * @param {Object} data - Properties to update
 */
export const updateIncident = async (id, data) => {
  try {
    const docRef = doc(db, INCIDENTS_COLLECTION, id)
    const payload = {
      ...data,
      updatedAt: serverTimestamp()
    }
    await updateDoc(docRef, payload)
    return { id, ...payload }
  } catch (error) {
    console.error(`Error in updateIncident (${id}):`, error)
    throw error
  }
}

/**
 * Deletes an incident document
 * @param {string} id - Document ID
 */
export const deleteIncident = async (id) => {
  try {
    const docRef = doc(db, INCIDENTS_COLLECTION, id)
    await deleteDoc(docRef)
    return true
  } catch (error) {
    console.error(`Error in deleteIncident (${id}):`, error)
    throw error
  }
}
