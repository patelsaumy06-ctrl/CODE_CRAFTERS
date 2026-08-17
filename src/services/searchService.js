import { collection, getDocs } from "firebase/firestore"
import { db } from "../firebase/firebase"

/**
 * Searches across Firestore incidents and intelligence collections matching query string
 * @param {string} queryText - Natural language search term
 */
export const searchIntelligence = async (queryText) => {
  if (!queryText || !queryText.trim()) return []

  const term = queryText.toLowerCase().trim()
  const results = []

  try {
    // 1. Search Incidents collection
    const incidentsSnap = await getDocs(collection(db, "incidents"))
    incidentsSnap.forEach((docSnap) => {
      const data = docSnap.data()
      const title = (data.title || "").toLowerCase()
      const desc = (data.description || "").toLowerCase()
      const address = (data.location?.address || "").toLowerCase()
      const source = (data.source || "").toLowerCase()

      if (title.includes(term) || desc.includes(term) || address.includes(term) || source.includes(term)) {
        results.push({
          id: docSnap.id,
          type: "Incident Report",
          title: data.title,
          snippet: data.description || data.location?.address || "Disaster incident logged.",
          source: data.source || "Sensor Array",
          confidence: data.verified ? 99 : 85,
          timestamp: data.createdAt ? "Recent" : "Historical"
        })
      }
    })

    // 2. Search Intelligence collection
    const intelSnap = await getDocs(collection(db, "intelligence"))
    intelSnap.forEach((docSnap) => {
      const data = docSnap.data()
      const text = (data.text || "").toLowerCase()
      const handle = (data.handle || "").toLowerCase()
      const source = (data.source || "").toLowerCase()

      if (text.includes(term) || handle.includes(term) || source.includes(term)) {
        results.push({
          id: docSnap.id,
          type: "Telemetry / Social Stream",
          title: `${data.source} (${data.handle})`,
          snippet: data.text,
          source: data.source,
          confidence: data.confidence || 90,
          timestamp: "Real-Time Ingestion"
        })
      }
    })

    return results
  } catch (error) {
    console.error("Error executing searchIntelligence:", error)
    return results
  }
}
