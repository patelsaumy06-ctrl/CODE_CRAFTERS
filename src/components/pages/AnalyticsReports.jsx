import React, { useState, useEffect } from 'react'
import { Sidebar } from '../common/Sidebar'
import { Header } from '../common/Header'
import { fetchAnalyticsData, exportAnalyticsPDF } from '../../services/analyticsService'

export const AnalyticsReports = () => {
  const [timeframe, setTimeframe] = useState("7d")
  const [data, setData] = useState({
    kpis: [
      { title: "Avg. Verification Time", value: "24.2s", change: "12% faster", good: true },
      { title: "Incidents Processed", value: "1,420", change: "+8% volume", good: true },
      { title: "Noise Filter Rate", value: "94.6%", change: "+2.1%", good: true },
      { title: "Response Latency", value: "3m 40s", change: "-45s faster", good: true },
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
        <Header title="Analytics & Reports" />

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
              Export PDF
            </button>
          </div>

          {/* KPI Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {data.kpis.map((s, i) => (
              <div key={i} className="bg-white border border-[#E7DED2] rounded-lg p-4">
                <span className="text-xs font-medium text-[#74777e]">{s.title}</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-[#001d36]">{s.value}</span>
                  <span className="text-xs font-medium text-green-700">{s.change}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Chart Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8 bg-white border border-[#E7DED2] rounded-lg p-5 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-xs text-[#001d36]">Incident Volume</h3>
                <span className="text-[11px] text-[#74777e]">
                  Hourly trend
                </span>
              </div>
              <div className="h-56 bg-[#FAF7F2] rounded-lg border border-[#E7DED2] flex items-end justify-between p-4 gap-2">
                {data.timeline.map((val, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <div 
                      className="w-full bg-[#001d36] hover:bg-[#17324d] transition-colors rounded-t"
                      style={{ height: `${val * 1.3}px` }}
                    ></div>
                    <span className="text-[9px] font-mono text-[#74777e]">{idx + 1}h</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 bg-white border border-[#E7DED2] rounded-lg p-5 space-y-3">
              <h3 className="font-semibold text-xs text-[#001d36]">Incident Distribution</h3>
              <div className="space-y-3 text-xs pt-1">
                <div>
                  <div className="flex justify-between font-medium text-[#001d36] mb-1">
                    <span>Floods</span>
                    <span>44%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#001d36] h-full w-[44%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium text-[#001d36] mb-1">
                    <span>Infrastructure Damage</span>
                    <span>28%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#74777e] h-full w-[28%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium text-[#001d36] mb-1">
                    <span>Wildfires</span>
                    <span>18%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-600 h-full w-[18%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium text-[#001d36] mb-1">
                    <span>Earthquakes</span>
                    <span>10%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-red-600 h-full w-[10%]"></div>
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
