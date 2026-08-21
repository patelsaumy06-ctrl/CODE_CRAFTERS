import { api } from "./apiClient"

/**
 * Computes tactical analytics from backend API (replaces direct Firestore reads)
 */
export const fetchAnalyticsData = async (timeframe = "3d") => {
  const days = timeframe === "24h" ? 1 : timeframe === "30d" ? 30 : 3
  try {
    const [overview, trends, categories, severity, sources] = await Promise.all([
      api.get(`/api/analytics/overview?days=${days}`),
      api.get(`/api/analytics/trends?days=${days}`),
      api.get(`/api/analytics/categories?days=${days}`),
      api.get(`/api/analytics/severity?days=${days}`),
      api.get(`/api/analytics/sources?days=${days}`).catch(() => ({ data: {} })),
    ])

    return {
      kpis: overview.data?.kpis || [],
      timeline: trends.data?.timeline || [],
      timelineLabels: trends.data?.labels || [],
      categories: categories.data || {},
      severity: severity.data || {},
      sources: sources.data || {},
      pipelineStats: overview.data?.pipelineStats || {},
      provenance: overview.data?.provenance || null,
      date_window: overview.date_window || null,
    }
  } catch (error) {
    console.error("Error computing analytics metrics:", error)
    return {
      kpis: [],
      timeline: [],
      timelineLabels: [],
      categories: {},
      severity: {},
      sources: {},
      pipelineStats: {},
      provenance: null,
      date_window: null,
    }
  }
}

/**
 * Triggers official report export from live analytics data
 */
export const exportAnalyticsPDF = async (timeframe = "3d") => {
  const data = await fetchAnalyticsData(timeframe)
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

3. MULTI-SOURCE INGESTION BREAKDOWN
${Object.entries(data.sources || {}).map(([k, v]) => `- ${k}: ${v}`).join("\n") || "- No source breakdown data"}

Status: GENERATED FROM BACKEND ANALYTICS API WITH FULL PROVENANCE
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
