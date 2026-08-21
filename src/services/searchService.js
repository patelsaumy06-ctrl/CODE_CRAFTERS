import { api } from "./apiClient"

/**
 * Server-side search via backend API with rich result properties
 */
export const searchIntelligence = async (queryText, filters = {}) => {
  if (!queryText || !queryText.trim()) return []

  const params = new URLSearchParams({ q: queryText.trim() })
  if (filters.disasterType && filters.disasterType !== "All") params.set("disasterType", filters.disasterType)
  if (filters.severity && filters.severity !== "All") params.set("severity", filters.severity)
  if (filters.minConfidence) params.set("minConfidence", String(filters.minConfidence))

  try {
    const res = await api.get(`/api/search?${params}`)
    return (res.data || []).map((item) => {
      const confNum = Number(item.confidence) || 0
      return {
        id: item.id,
        type: item.type,
        title: item.title,
        snippet: item.snippet,
        source: item.source,
        disasterType: item.disasterType || "Incident",
        severity: item.severity || "medium",
        confidence: Math.round(confNum <= 1 ? confNum * 100 : confNum),
        timestamp: item.timestamp,
        verified: item.verified,
        verificationStatus: item.verificationStatus || (item.verified ? "VERIFIED" : "UNVERIFIED"),
        sourceCount: item.sourceCount || 1,
        location: item.location || { address: item.snippet },
      }
    })
  } catch (error) {
    console.error("Error executing searchIntelligence:", error)
    return []
  }
}
