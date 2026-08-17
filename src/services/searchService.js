import { api } from "./apiClient"

/**
 * Server-side search via backend API (replaces client-side Firestore scanning)
 */
export const searchIntelligence = async (queryText, filters = {}) => {
  if (!queryText || !queryText.trim()) return []

  const params = new URLSearchParams({ q: queryText.trim() })
  if (filters.disasterType) params.set("disasterType", filters.disasterType)
  if (filters.severity) params.set("severity", filters.severity)
  if (filters.minConfidence) params.set("minConfidence", filters.minConfidence)

  try {
    const res = await api.get(`/api/search?${params}`)
    return (res.data || []).map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      snippet: item.snippet,
      source: item.source,
      confidence: Math.round((item.confidence || 0) * 100),
      timestamp: item.timestamp ? "Recent" : "Historical",
      verified: item.verified,
    }))
  } catch (error) {
    console.error("Error executing searchIntelligence:", error)
    return []
  }
}
