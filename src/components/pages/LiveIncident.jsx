import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidebar } from '../common/Sidebar'
import { Header } from '../common/Header'

export const LiveIncident = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("overview")

  const mediaItems = [
    { title: "Bridge Sensor Gauge Reading", type: "Telemetry", time: "3m ago", img: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=400" },
    { title: "Eyewitness Drone Video Feed", type: "Video Stream", time: "8m ago", img: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&q=80&w=400" },
    { title: "Thermal SAR Satellite Frame", type: "Satellite", time: "14m ago", img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=400" },
  ]

  const timelineEvents = [
    { time: "22:45:00", text: "Water level sensor #4 triggers Level-3 Threshold Alert (2.4m above baseline)." },
    { time: "22:46:12", text: "AI Engine correlates 14 independent citizen posts & video streams." },
    { time: "22:48:30", text: "Incident severity upgraded to CRITICAL by AI Consensus Algorithm." },
    { time: "22:50:00", text: "Automated broadcast dispatched to Sector 4 Emergency First Responders." },
  ]

  return (
    <div className="bg-[#F7F3EC] text-[#1c1c18] font-sans flex h-screen overflow-hidden antialiased">
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-[260px] min-h-screen relative overflow-hidden">
        <Header title="Live Incident Investigation" />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Incident Header Card */}
          <div className="bg-[#FFFDF9] border border-[#E7DED2] border-l-4 border-l-red-600 rounded-xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-red-100 text-red-800 border border-red-200 text-xs px-2.5 py-0.5 rounded font-bold uppercase">
                  INCIDENT #INC-9042 • CRITICAL
                </span>
                <span className="text-xs text-[#74777e] font-mono">Location: Northern River Basin (Sector 4)</span>
              </div>
              <h2 className="text-2xl font-bold text-[#001d36]">Flash Flood & Levee Breach Warning</h2>
              <p className="text-xs text-[#74777e] mt-1">
                Detected via multi-source sensor arrays, Satellite SAR imagery, and high-density local social reports.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-[#74777e]">AI Confidence Score</div>
                <div className="text-xl font-bold text-green-700 font-mono">94.8% Verified</div>
              </div>
              <button 
                onClick={() => navigate("/admin/notifications")}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-700 transition-colors shadow-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">campaign</span>
                Issue Broadcast Alert
              </button>
            </div>
          </div>

          {/* Tab Selection */}
          <div className="flex border-b border-[#E7DED2] gap-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
                activeTab === "overview"
                  ? "border-[#D98B3A] text-[#001d36]"
                  : "border-transparent text-[#74777e] hover:text-[#001d36]"
              }`}
            >
              Evidence & Media Stream
            </button>
            <button
              onClick={() => setActiveTab("timeline")}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
                activeTab === "timeline"
                  ? "border-[#D98B3A] text-[#001d36]"
                  : "border-transparent text-[#74777e] hover:text-[#001d36]"
              }`}
            >
              Verification Timeline
            </button>
          </div>

          {/* Main Grid Content */}
          {activeTab === "overview" ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Media Feed & Evidence */}
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-5 shadow-sm space-y-4">
                  <h3 className="font-bold text-sm text-[#001d36] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#D98B3A]">photo_library</span>
                    Multi-Modal Ingested Evidence
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {mediaItems.map((m, idx) => (
                      <div key={idx} className="border border-[#E7DED2] rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                        <img alt={m.title} src={m.img} className="w-full h-32 object-cover" />
                        <div className="p-3">
                          <div className="flex items-center justify-between text-[10px] text-[#74777e] mb-1">
                            <span className="font-bold text-[#001d36] uppercase">{m.type}</span>
                            <span className="font-mono">{m.time}</span>
                          </div>
                          <h4 className="font-bold text-xs text-[#001d36] leading-snug">{m.title}</h4>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tactical Map Focus */}
                <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-5 shadow-sm space-y-3">
                  <h3 className="font-bold text-sm text-[#001d36] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#D98B3A]">my_location</span>
                    High-Resolution Sector Telemetry
                  </h3>
                  <div className="h-64 rounded-lg bg-[#121d27] relative overflow-hidden flex items-center justify-center">
                    <img 
                      alt="Satellite Focal Area"
                      src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=800"
                      className="absolute inset-0 w-full h-full object-cover opacity-70"
                    />
                    <div className="absolute inset-0 bg-red-500/10 pointer-events-none"></div>
                    <div className="relative z-10 bg-[#001d36]/90 border border-white/20 p-3 rounded-lg text-white text-xs font-mono">
                      <div>FLOOD IMPACT ZONE: 4.2 km²</div>
                      <div className="text-red-400">ESTIMATED EVACUATION POPULATION: 1,400</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: AI Analysis */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-5 shadow-sm space-y-4">
                  <h3 className="font-bold text-sm text-[#001d36]">AI Risk Assessment</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span>Hydrological Risk</span>
                        <span className="text-red-600">High (92%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-red-600 h-full w-[92%]"></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span>Structural Infrastructure Risk</span>
                        <span className="text-orange-500">Critical (85%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-orange-500 h-full w-[85%]"></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span>Source Consensus Rate</span>
                        <span className="text-green-600">Strong (98%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-green-600 h-full w-[98%]"></div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#E7DED2]">
                    <h4 className="font-bold text-xs text-[#001d36] mb-2">Recommended Response Actions:</h4>
                    <ul className="text-xs text-[#1c1c18] space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-green-600 text-sm">check_circle</span>
                        Deploy regional water rescue teams to Sector 4.
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-green-600 text-sm">check_circle</span>
                        Issue emergency SMS broadcast to local cell towers.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-[#001d36]">Detailed Event Log</h3>
              <div className="space-y-4">
                {timelineEvents.map((t, idx) => (
                  <div key={idx} className="flex gap-4 items-start border-l-2 border-[#D98B3A] pl-4">
                    <span className="font-mono text-xs font-bold text-[#D98B3A] shrink-0">{t.time}</span>
                    <p className="text-xs text-[#1c1c18]">{t.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
export default LiveIncident
