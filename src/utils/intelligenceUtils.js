/**
 * Disaster Intelligence Utility Functions
 * DisasterLens AI - Operational Console
 */

export const normalizeVerificationStatus = (inc) => {
  if (!inc) return "UNVERIFIED"

  const rawStatus = (inc.verificationStatus || "").toUpperCase()
  if (rawStatus === "OFFICIALLY_CONFIRMED" || rawStatus === "VERIFIED") {
    return "VERIFIED"
  }
  if (rawStatus === "CORROBORATED") {
    return "CORROBORATED"
  }
  if (rawStatus === "UNVERIFIED" || rawStatus === "CONFLICTING") {
    return "UNVERIFIED"
  }

  // Fallback to boolean flags / source counts if verificationStatus is missing
  if (inc.verified === true) {
    return "VERIFIED"
  }
  if (inc.sourceCount && Number(inc.sourceCount) >= 2) {
    return "CORROBORATED"
  }

  return "UNVERIFIED"
}

export const getSeverityWeight = (severity) => {
  const s = (severity || "").toLowerCase()
  switch (s) {
    case "critical":
      return 4
    case "high":
      return 3
    case "medium":
      return 2
    case "low":
      return 1
    default:
      return 0
  }
}

export const getConfidenceValue = (inc) => {
  if (!inc) return null
  if (inc.confidencePercent !== undefined && inc.confidencePercent !== null) {
    return Math.round(Number(inc.confidencePercent))
  }
  if (inc.confidence !== undefined && inc.confidence !== null) {
    const num = Number(inc.confidence)
    if (isNaN(num)) return null
    return Math.round(num <= 1 ? num * 100 : num)
  }
  return null
}

export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return "Recent"
  try {
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) return "Recent"

    const now = Date.now()
    const diffMs = now - date.getTime()
    if (diffMs < 0) return "Just now"

    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} min ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  } catch {
    return "Recent"
  }
}

export const formatUtcDateTime = (isoString) => {
  if (!isoString) return "Pending"
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return "Pending"
    return d.toUTCString().replace("GMT", "UTC")
  } catch {
    return "Pending"
  }
}

export const sortPriorityIncidents = (incidents = []) => {
  return [...incidents].sort((a, b) => {
    // 1. Severity descending (Critical -> High -> Medium -> Low)
    const sevA = getSeverityWeight(a.severity)
    const sevB = getSeverityWeight(b.severity)
    if (sevB !== sevA) {
      return sevB - sevA
    }

    // 2. Confidence descending
    const confA = getConfidenceValue(a) || 0
    const confB = getConfidenceValue(b) || 0
    if (confB !== confA) {
      return confB - confA
    }

    // 3. Verification status priority (Verified -> Corroborated -> Unverified)
    const vOrder = { VERIFIED: 3, CORROBORATED: 2, UNVERIFIED: 1 }
    const vA = vOrder[normalizeVerificationStatus(a)] || 0
    const vB = vOrder[normalizeVerificationStatus(b)] || 0
    if (vB !== vA) {
      return vB - vA
    }

    // 4. Occurrence time freshness descending
    const timeA = new Date(a.event_time || a.source_updated_at || a.timestamp || 0).getTime()
    const timeB = new Date(b.event_time || b.source_updated_at || b.timestamp || 0).getTime()
    return timeB - timeA
  })
}

export const checkRegionMatch = (inc, region) => {
  if (!region || region === "Global" || region === "All") return true

  const lat = Number(inc.location?.latitude ?? inc.latitude)
  const lon = Number(inc.location?.longitude ?? inc.longitude)
  const address = `${inc.location?.address || ""} ${inc.title || ""} ${inc.description || ""}`.toLowerCase()
  const hasCoords = !isNaN(lat) && !isNaN(lon) && (lat !== 0 || lon !== 0)

  if (region === "Asia" || region === "Asia Pacific") {
    const coordsMatch = hasCoords && lat >= -15 && lat <= 60 && lon >= 60 && lon <= 180
    const keywords = [
      "asia", "india", "mumbai", "delhi", "ahmedabad", "china", "beijing", "tokyo", "japan",
      "philippines", "indonesia", "bangladesh", "pakistan", "vietnam", "thailand",
      "singapore", "korea", "taiwan", "pacific", "malaysia", "nepal", "sri lanka", "myanmar", "turkey"
    ]
    return coordsMatch || keywords.some((k) => address.includes(k))
  }

  if (region === "Europe") {
    const coordsMatch = hasCoords && lat >= 35 && lat <= 72 && lon >= -25 && lon <= 45
    const keywords = [
      "europe", "uk", "united kingdom", "london", "france", "paris", "germany", "berlin",
      "italy", "rome", "spain", "madrid", "greece", "switzerland", "netherlands",
      "ukraine", "poland", "sweden", "norway", "austria", "portugal", "ireland", "iceland"
    ]
    return coordsMatch || keywords.some((k) => address.includes(k))
  }

  if (region === "Americas") {
    const coordsMatch = hasCoords && lon >= -170 && lon <= -30
    const keywords = [
      "america", "usa", "united states", "canada", "california", "florida", "texas",
      "new york", "mexico", "brazil", "argentina", "colombia", "chile", "peru",
      "caribbean", "san francisco", "los angeles", "seattle", "toronto", "hawaii"
    ]
    return coordsMatch || keywords.some((k) => address.includes(k))
  }

  if (region === "Africa") {
    const coordsMatch = hasCoords && lat >= -35 && lat <= 38 && lon >= -20 && lon <= 55 && !(lat > 35 && lon > 0 && lon < 45)
    const keywords = [
      "africa", "nigeria", "egypt", "kenya", "south africa", "ghana", "ethiopia",
      "morocco", "congo", "tanzania", "algeria", "sudan", "uganda", "mozambique", "madagascar"
    ]
    return coordsMatch || keywords.some((k) => address.includes(k))
  }

  if (region === "Oceania") {
    const coordsMatch = hasCoords && lat >= -50 && lat <= 0 && lon >= 110 && lon <= 180
    const keywords = ["australia", "new zealand", "fiji", "papua new guinea", "sydney", "melbourne", "auckland"]
    return coordsMatch || keywords.some((k) => address.includes(k))
  }

  return true
}

export const extractIncidentSources = (inc) => {
  if (!inc) return []
  if (Array.isArray(inc.evidence) && inc.evidence.length > 0) {
    const names = inc.evidence.map((e) => e.source || e.sourceType).filter(Boolean)
    return [...new Set(names)]
  }
  if (inc.source) {
    return [inc.source]
  }
  return ["Authoritative Feed"]
}
