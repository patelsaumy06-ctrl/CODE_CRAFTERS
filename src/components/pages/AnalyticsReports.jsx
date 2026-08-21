import React, { useState, useEffect } from 'react'
import { Sidebar } from '../common/Sidebar'
import { Header } from '../common/Header'
import { fetchAnalyticsData, exportAnalyticsPDF } from '../../services/analyticsService'

export const AnalyticsReports = () => {
  const [timeframe, setTimeframe] = useState("7d")
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    kpis: [],
    timeline: [],
    categories: {},
    severity: {},
    pipelineStats: {}
  })

  useEffect(() => {
    setLoading(true)
    fetchAnalyticsData().then(res => {
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

  const categoryEntries = Object.entries(data.categories || {})
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])

  const totalCategorized = categoryEntries.reduce((sum, [_, count]) => sum + count, 0)

  return (
    <div className="bg-[#F7F3EC] text-[#1c1c18] font-sans flex h-screen overflow-hidden antialiased">
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-[260px] min-h-screen relative overflow-hidden">
        <Header title="Analytics & Tactical Reports" />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">

          {/* Filters and Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-[#E7DED2]">
            <div className="flex items-center gap-1.5 bg-[#F7F3EC] border border-[#E7DED2] rounded-lg p-1">
              <button 
                onClick={() => setTimeframe("24h")}
                className={`px-3 py-1 text-xs font-medium rounded cursor-pointer transition-colors ${
                  timeframe === "24h" ? "bg-[#001d36] text-white" : "text-[#43474d] hover:text-[#001d36]"
                }`}
              >
                24h
              </button>
              <button 
                onClick={() => setTimeframe("7d")}
                className={`px-3 py-1 text-xs font-medium rounded cursor-pointer transition-colors ${
                  timeframe === "7d" ? "bg-[#001d36] text-white" : "text-[#43474d] hover:text-[#001d36]"
                }`}
              >
                7 Days
              </button>
              <button 
                onClick={() => setTimeframe("30d")}
                className={`px-3 py-1 text-xs font-medium rounded cursor-pointer transition-colors ${
                  timeframe === "30d" ? "bg-[#001d36] text-white" : "text-[#43474d] hover:text-[#001d36]"
                }`}
              >
                30 Days
              </button>
            </div>

            <button 
              onClick={handlePdfExport}
              className="bg-[#001d36] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#17324d] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">picture_as_pdf</span>
              Export Official Report
            </button>
          </div>

          {/* KPI Metrics */}
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
                <div key={i} className="bg-white border border-[#E7DED2] rounded-lg p-4">
                  <span className="text-xs font-medium text-[#74777e]">{s.title}</span>
                  <div className="mt-1 flex items-baseline justify-between gap-2">
                    <span className="text-2xl font-bold text-[#001d36]">{s.value}</span>
                    <span className={`text-[11px] font-medium ${s.good ? "text-green-700" : "text-amber-700"}`}>{s.change}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-4 bg-white border border-[#E7DED2] rounded-lg p-6 text-center text-xs text-[#74777e]">
                No KPI analytics available yet.
              </div>
            )}
          </div>

          {/* Chart Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8 bg-white border border-[#E7DED2] rounded-lg p-5 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-xs text-[#001d36]">Incident Ingestion Trend (Last 24 Hours)</h3>
                <span className="text-[11px] text-[#74777e]">
                  Live hourly volume
                </span>
              </div>
              <div className="h-56 bg-[#FAF7F2] rounded-lg border border-[#E7DED2] flex items-end justify-between p-4 gap-1 sm:gap-2">
                {data.timeline.length > 0 ? (
                  data.timeline.map((val, idx) => {
                    const maxVal = Math.max(...data.timeline, 1)
                    const heightPct = Math.max(5, (val / maxVal) * 100)
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                        <div 
                          className="w-full bg-[#001d36] hover:bg-[#17324d] transition-colors rounded-t cursor-pointer"
                          style={{ height: `${heightPct}%` }}
                          title={`${val} incidents (${23 - idx}h ago)`}
                        ></div>
                        <span className="text-[8px] sm:text-[9px] font-mono text-[#74777e]">{23 - idx}h</span>
                      </div>
                    )
                  })
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-[#74777e]">
                    No timeline activity recorded in the selected window.
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-4 bg-white border border-[#E7DED2] rounded-lg p-5 space-y-3">
              <h3 className="font-semibold text-xs text-[#001d36]">Live Disaster Distribution</h3>
              <div className="space-y-3 text-xs pt-1">
                {categoryEntries.length > 0 ? (
                  categoryEntries.map(([type, count]) => {
                    const pct = totalCategorized > 0 ? Math.round((count / totalCategorized) * 100) : 0
                    return (
                      <div key={type}>
                        <div className="flex justify-between font-medium text-[#001d36] mb-1">
                          <span className="capitalize">{type}</span>
                          <span>{count} ({pct}%)</span>
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
                    No categorized live incidents currently logged.
                  </p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
export default AnalyticsReports
