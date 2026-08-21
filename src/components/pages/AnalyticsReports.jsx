import React, { useState, useEffect } from 'react'
import { Sidebar } from '../common/Sidebar'
import { Header } from '../common/Header'
import { fetchAnalyticsData, exportAnalyticsPDF } from '../../services/analyticsService'

export const AnalyticsReports = () => {
  const [timeframe, setTimeframe] = useState("3d")
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    kpis: [],
    timeline: [],
    timelineLabels: [],
    categories: {},
    severity: {},
    sources: {},
    pipelineStats: {},
    provenance: null,
    date_window: null,
  })

  useEffect(() => {
    setLoading(true)
    fetchAnalyticsData(timeframe).then(res => {
      if (res) setData(res)
      setLoading(false)
    }).catch(e => {
      console.error("Error fetching analytics data:", e)
      setLoading(false)
    })
  }, [timeframe])

  const handlePdfExport = () => {
    exportAnalyticsPDF(timeframe)
  }

  // Categories processing
  const categoryEntries = Object.entries(data.categories || {})
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
  const totalCategorized = categoryEntries.reduce((sum, [_, count]) => sum + count, 0)

  // Sources processing
  const sourceEntries = Object.entries(data.sources || {})
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
  const totalFromSources = sourceEntries.reduce((sum, [_, count]) => sum + count, 0)

  // Operational Pipeline Stage Metrics (Strictly Real Data)
  const totalIngested = totalCategorized || data.pipelineStats?.processed || 0
  const totalClassified = totalCategorized || (data.kpis.find(k => k.title?.includes("Total"))?.value ? parseInt(data.kpis.find(k => k.title?.includes("Total")).value) : totalIngested)
  const totalCorroborated = parseInt(data.kpis.find(k => k.title?.includes("Corroborated"))?.value || "0")
  const totalVerified = parseInt(data.kpis.find(k => k.title?.includes("Confirmed"))?.value || "0")

  return (
    <div className="bg-[#F7F3EC] text-[#1c1c18] font-sans flex h-screen overflow-hidden antialiased">
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-[260px] min-h-screen relative overflow-hidden">
        <Header title="Tactical Analytics & Pipeline Intelligence" />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">

          {/* Timeframe Bar & Export Action */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#E7DED2] shadow-xs">
            <div className="flex items-center gap-1.5 bg-[#F7F3EC] border border-[#E7DED2] rounded-lg p-1">
              <button 
                onClick={() => setTimeframe("24h")}
                className={`px-3 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                  timeframe === "24h" ? "bg-[#001d36] text-white" : "text-[#43474d] hover:text-[#001d36]"
                }`}
              >
                24 Hours
              </button>
              <button 
                onClick={() => setTimeframe("3d")}
                className={`px-3 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                  timeframe === "3d" ? "bg-[#001d36] text-white" : "text-[#43474d] hover:text-[#001d36]"
                }`}
              >
                3 Days (Active Window)
              </button>
              <button 
                onClick={() => setTimeframe("30d")}
                className={`px-3 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                  timeframe === "30d" ? "bg-[#001d36] text-white" : "text-[#43474d] hover:text-[#001d36]"
                }`}
              >
                30 Days
              </button>
            </div>

            <button 
              onClick={handlePdfExport}
              className="bg-[#001d36] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[#17324d] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-base">download</span>
              Export Official Intelligence Report
            </button>
          </div>

          {/* STEP 8: Visual Intelligence Pipeline Progression Stages */}
          <div className="bg-white border border-[#E7DED2] rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#E7DED2] pb-3">
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#001d36] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-blue-600">account_tree</span>
                  Operational Intelligence Pipeline Lifecycle
                </h3>
                <p className="text-xs text-[#74777e] mt-0.5">
                  Real-time progression through ingestion, classification, spatial clustering, corroboration, and verification.
                </p>
              </div>
              <span className="text-[11px] font-mono text-[#74777e] bg-[#FAF7F2] px-2.5 py-1 rounded border border-[#E7DED2]">
                Automated Pipeline
              </span>
            </div>

            {/* Pipeline Stage Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. INGESTED */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">1. INGESTED</span>
                  <span className="material-symbols-outlined text-base text-slate-500">cloud_download</span>
                </div>
                <div className="text-2xl font-extrabold text-[#001d36] font-mono">
                  {loading ? "—" : totalIngested}
                </div>
                <p className="text-[11px] text-slate-500">Raw external events ingested</p>
              </div>

              {/* 2. CLASSIFIED */}
              <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-lg space-y-1 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">2. CLASSIFIED</span>
                  <span className="material-symbols-outlined text-base text-blue-600">psychology</span>
                </div>
                <div className="text-2xl font-extrabold text-blue-900 font-mono">
                  {loading ? "—" : totalClassified}
                </div>
                <p className="text-[11px] text-blue-700/80">Hazard taxonomy mapped</p>
              </div>

              {/* 3. CORROBORATED */}
              <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-lg space-y-1 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">3. CORROBORATED</span>
                  <span className="material-symbols-outlined text-base text-indigo-600">hub</span>
                </div>
                <div className="text-2xl font-extrabold text-indigo-900 font-mono">
                  {loading ? "—" : totalCorroborated}
                </div>
                <p className="text-[11px] text-indigo-700/80">2+ independent sources</p>
              </div>

              {/* 4. VERIFIED */}
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-lg space-y-1 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">4. VERIFIED</span>
                  <span className="material-symbols-outlined text-base text-emerald-600">verified</span>
                </div>
                <div className="text-2xl font-extrabold text-emerald-900 font-mono">
                  {loading ? "—" : totalVerified}
                </div>
                <p className="text-[11px] text-emerald-700/80">Official agency confirmed</p>
              </div>
            </div>
          </div>

          {/* Real KPI Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white border border-[#E7DED2] rounded-lg p-4 animate-pulse">
                  <div className="h-3 bg-slate-200 rounded w-24 mb-2"></div>
                  <div className="h-7 bg-slate-300 rounded w-16"></div>
                </div>
              ))
            ) : data.kpis.length > 0 ? (
              data.kpis.map((s, i) => (
                <div key={i} className="bg-white border border-[#E7DED2] rounded-lg p-4 shadow-xs">
                  <span className="text-xs font-semibold text-[#74777e]">{s.title}</span>
                  <div className="mt-1 flex items-baseline justify-between gap-2">
                    <span className="text-2xl font-bold text-[#001d36] font-mono">{s.value}</span>
                    <span className={`text-[11px] font-medium ${s.good ? "text-emerald-700" : "text-amber-700"}`}>{s.change}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-4 bg-white border border-[#E7DED2] rounded-lg p-6 text-center text-xs text-[#74777e]">
                No KPI analytics available for this window.
              </div>
            )}
          </div>

          {/* Charts & Distributions */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Hourly Ingestion Trend Timeline */}
            <div className="lg:col-span-8 bg-white border border-[#E7DED2] rounded-xl p-5 space-y-3 shadow-sm">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#001d36]">
                  Incident Ingestion Volume & Temporal Distribution
                </h3>
                <span className="text-[11px] font-mono text-[#74777e]">
                  {timeframe === "24h" ? "Hourly (24h)" : "72h window buckets"}
                </span>
              </div>

              <div className="h-56 bg-[#FAF7F2] rounded-lg border border-[#E7DED2] flex items-end justify-between p-4 gap-1 sm:gap-2">
                {data.timeline.length > 0 ? (
                  data.timeline.map((val, idx) => {
                    const maxVal = Math.max(...data.timeline, 1)
                    const heightPct = Math.max(6, (val / maxVal) * 100)
                    const label = data.timelineLabels && data.timelineLabels[idx]
                      ? data.timelineLabels[idx]
                      : `${(data.timeline.length - 1 - idx) * 3}h`

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                        <div 
                          className="w-full bg-[#001d36] hover:bg-blue-800 transition-colors rounded-t cursor-pointer"
                          style={{ height: `${heightPct}%` }}
                          title={`${val} incidents (${label})`}
                        ></div>
                        <span className="text-[8px] font-mono text-[#74777e] truncate max-w-[28px]">{label}</span>
                      </div>
                    )
                  })
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-[#74777e]">
                    No temporal activity recorded in this timeframe.
                  </div>
                )}
              </div>
            </div>

            {/* Disaster Type Distribution */}
            <div className="lg:col-span-4 bg-white border border-[#E7DED2] rounded-xl p-5 space-y-3 shadow-sm">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#001d36]">
                Hazard Taxonomy Distribution
              </h3>

              <div className="space-y-3 text-xs pt-1">
                {categoryEntries.length > 0 ? (
                  categoryEntries.map(([type, count]) => {
                    const pct = totalCategorized > 0 ? Math.round((count / totalCategorized) * 100) : 0
                    return (
                      <div key={type}>
                        <div className="flex justify-between font-semibold text-[#001d36] mb-1 text-xs">
                          <span className="capitalize">{type}</span>
                          <span className="font-mono">{count} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-[#001d36] h-full rounded-full transition-all duration-500" 
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-xs text-[#74777e] py-8 text-center">
                    No categorized disaster events logged in this window.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* STEP 8: Multi-Source Provider Contribution Breakdown */}
          {sourceEntries.length > 0 && (
            <div className="bg-white border border-[#E7DED2] rounded-xl p-5 space-y-3 shadow-sm">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#001d36] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">storage</span>
                  Multi-Source Ingestion Contribution
                </h3>
                <span className="text-[11px] font-mono text-[#74777e]">
                  {totalFromSources} Total Events Attributed
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {sourceEntries.map(([srcName, count]) => {
                  const pct = totalFromSources > 0 ? Math.round((count / totalFromSources) * 100) : 0
                  return (
                    <div key={srcName} className="p-3.5 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[#001d36] uppercase">{srcName}</span>
                        <span className="font-mono font-bold text-slate-700">{pct}%</span>
                      </div>
                      <div className="text-lg font-bold text-[#001d36] font-mono">{count}</div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-700 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default AnalyticsReports
