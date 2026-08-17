import React, { useState, useEffect } from 'react'
import { Sidebar } from '../common/Sidebar'
import { Header } from '../common/Header'
import { fetchAnalyticsData, exportAnalyticsPDF } from '../../services/analyticsService'

export const AnalyticsReports = () => {
  const [timeframe, setTimeframe] = useState("7d")
  const [data, setData] = useState({
    kpis: [
      { title: "Avg. AI Verification Time", value: "24.2s", change: "-12% faster", good: true },
      { title: "Total Incidents Processed", value: "1,420", change: "+8% volume", good: true },
      { title: "False Alarm Filter Rate", value: "94.6%", change: "+2.1%", good: true },
      { title: "Agency Response Latency", value: "3m 40s", change: "-45s faster", good: true },
    ],
    timeline: [45, 60, 35, 90, 120, 80, 95, 110, 70, 85, 105, 130],
    categories: { floods: 44, grid: 28, wildfire: 18, seismic: 10 }
  })

  useEffect(() => {
    fetchAnalyticsData().then(res => {
      if (res) setData(res)
    }).catch(e => console.error("Error fetching analytics data:", e))
  }, [timeframe])

  const handlePdfExport = () => {
    exportAnalyticsPDF(timeframe)
  }

  return (
    <div className="bg-[#F7F3EC] text-[#1c1c18] font-sans flex h-screen overflow-hidden antialiased">
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-[260px] min-h-screen relative overflow-hidden">
        <Header title="Analytics & Tactical Reports" />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 bg-[#FFFDF9] border border-[#E7DED2] rounded-lg p-1 shadow-sm">
              <button 
                onClick={() => setTimeframe("24h")}
                className={`px-3 py-1 text-xs font-bold rounded cursor-pointer ${timeframe === "24h" ? "bg-[#001d36] text-white" : "text-[#74777e]"}`}
              >
                Last 24h
              </button>
              <button 
                onClick={() => setTimeframe("7d")}
                className={`px-3 py-1 text-xs font-bold rounded cursor-pointer ${timeframe === "7d" ? "bg-[#001d36] text-white" : "text-[#74777e]"}`}
              >
                Last 7 Days
              </button>
              <button 
                onClick={() => setTimeframe("30d")}
                className={`px-3 py-1 text-xs font-bold rounded cursor-pointer ${timeframe === "30d" ? "bg-[#001d36] text-white" : "text-[#74777e]"}`}
              >
                Last 30 Days
              </button>
            </div>

            <button 
              onClick={handlePdfExport}
              className="bg-[#D98B3A] text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-opacity-90 transition-opacity flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
              Generate Official PDF Report
            </button>
          </div>

          {/* KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.kpis.map((s, i) => (
              <div key={i} className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-4 shadow-sm">
                <span className="text-xs font-bold text-[#74777e] uppercase tracking-wider">{s.title}</span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-[#001d36]">{s.value}</span>
                  <span className="text-xs font-bold text-green-600">{s.change}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Chart Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-[#001d36]">Incident Volume & Peak Cluster Timelines</h3>
                <span className="text-xs font-mono text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full font-bold">
                  ● Cloud Firestore Aggregated
                </span>
              </div>
              <div className="h-64 bg-[#F7F3EC] rounded-lg border border-[#E7DED2] flex items-end justify-between p-4 gap-2">
                {data.timeline.map((val, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                    <div 
                      className="w-full bg-[#001d36] group-hover:bg-[#D98B3A] transition-colors rounded-t"
                      style={{ height: `${val * 1.5}px` }}
                    ></div>
                    <span className="text-[9px] font-mono text-[#74777e]">{idx + 1}h</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-[#001d36]">Disaster Types Distribution</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span>Floods & Water Surge</span>
                    <span>44%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#001d36] h-full w-[44%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span>Structural / Grid Damage</span>
                    <span>28%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#D98B3A] h-full w-[28%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span>Wildfires & Heat Risk</span>
                    <span>18%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-red-600 h-full w-[18%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span>Seismic Events</span>
                    <span>10%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full w-[10%]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
export default AnalyticsReports
