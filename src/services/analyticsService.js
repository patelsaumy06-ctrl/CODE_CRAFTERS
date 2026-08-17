import { api } from "./apiClient"

/**
 * Computes tactical analytics from backend API (replaces direct Firestore reads)
 */
export const fetchAnalyticsData = async () => {
  try {
    const [overview, trends, categories, severity] = await Promise.all([
      api.get("/api/analytics/overview"),
      api.get("/api/analytics/trends"),
      api.get("/api/analytics/categories"),
      api.get("/api/analytics/severity"),
    ])

    return {
      kpis: overview.data?.kpis || [],
      timeline: trends.data?.timeline || [],
      categories: categories.data || {},
      severity: severity.data || {},
      pipelineStats: overview.data?.pipelineStats || {},
    }
  } catch (error) {
    console.error("Error computing analytics metrics:", error)
    return {
      kpis: [],
      timeline: [],
      categories: {},
      severity: {},
      pipelineStats: {},
    }
  }
}

/**
 * Triggers official report export from live analytics data
 */
export const exportAnalyticsPDF = async (timeframe = "7d") => {
  const data = await fetchAnalyticsData()
  const kpiLines = (data.kpis || [])
    .map((k) => `- ${k.title}: ${k.value} (${k.change})`)
    .join("\n")

  const content = `
========================================================================
                 DISASTERLENS AI - OFFICIAL TACTICAL REPORT
========================================================================
Report Window: ${timeframe.toUpperCase()}
Generated At: ${new Date().toLocaleString()}
Classification: UNCLASSIFIED // FOR OFFICIAL AGENCY USE ONLY

1. EXECUTIVE KPI SUMMARY
${kpiLines || "- No live KPI data available"}

2. SPATIOTEMPORAL CLUSTER ANALYSIS
${Object.entries(data.categories || {}).map(([k, v]) => `- ${k}: ${v}`).join("\n") || "- No category data"}

Status: GENERATED FROM BACKEND ANALYTICS API
========================================================================
  `
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `DisasterLens_Tactical_Report_${timeframe}_${Date.now()}.txt`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
