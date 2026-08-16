import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidebar } from '../common/Sidebar'
import { Header } from '../common/Header'

export const Dashboard = () => {
  const navigate = useNavigate()
  const [selectedDisaster, setSelectedDisaster] = useState("All")
  const [selectedLocation, setSelectedLocation] = useState("Global")
  const [selectedUrgency, setSelectedUrgency] = useState("Critical")

  const incidents = [
    {
      id: "INC-9042",
      title: "Flash Flood & Levee Breach",
      location: "Northern River Basin",
      source: "Sensor & Social Stream",
      urgency: "Critical",
      confidence: 94,
      time: "2m ago",
      badgeColor: "bg-red-100 text-red-800 border-red-200"
    },
    {
      id: "INC-9041",
      title: "Structural Damage & Gas Leak",
      location: "Downtown Sub-station B",
      source: "Civic Reports & Drone Video",
      urgency: "High",
      confidence: 88,
      time: "12m ago",
      badgeColor: "bg-orange-100 text-orange-800 border-orange-200"
    },
    {
      id: "INC-9039",
      title: "Power Grid Instability",
      location: "Eastern Sub-grid 4",
      source: "Utility Telemetry API",
      urgency: "Moderate",
      confidence: 76,
      time: "28m ago",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200"
    },
    {
      id: "INC-9035",
      title: "Landslide Risk Assessment",
      location: "Coastal Ridge Pass",
      source: "Satellite SAR & Seismic",
      urgency: "Monitoring",
      confidence: 65,
      time: "45m ago",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200"
    }
  ]

  return (
    <div className="bg-[#F7F3EC] text-[#1c1c18] font-sans flex h-screen overflow-hidden antialiased">
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-[260px] min-h-screen relative overflow-hidden">
        <Header title="Command Center" />

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Filter 1 */}
              <div className="flex items-center gap-2 bg-[#FFFDF9] border border-[#E7DED2] rounded-lg px-3 py-1.5 shadow-sm text-xs font-semibold text-[#1c1c18]">
                <span className="material-symbols-outlined text-[#74777e] text-sm">filter_list</span>
                <span>Disaster:</span>
                <select 
                  value={selectedDisaster} 
                  onChange={(e) => setSelectedDisaster(e.target.value)}
                  className="bg-transparent border-none font-bold text-[#001d36] focus:outline-none cursor-pointer"
                >
                  <option value="All">All Types</option>
                  <option value="Flood">Floods</option>
                  <option value="Earthquake">Earthquakes</option>
                  <option value="Wildfire">Wildfires</option>
                </select>
              </div>

              {/* Filter 2 */}
              <div className="flex items-center gap-2 bg-[#FFFDF9] border border-[#E7DED2] rounded-lg px-3 py-1.5 shadow-sm text-xs font-semibold text-[#1c1c18]">
                <span className="material-symbols-outlined text-[#74777e] text-sm">location_on</span>
                <span>Location:</span>
                <select 
                  value={selectedLocation} 
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="bg-transparent border-none font-bold text-[#001d36] focus:outline-none cursor-pointer"
                >
                  <option value="Global">Global View</option>
                  <option value="North America">North America</option>
                  <option value="Asia Pacific">Asia Pacific</option>
                  <option value="Europe">Europe</option>
                </select>
              </div>

              {/* Filter 3 */}
              <div className="flex items-center gap-2 bg-[#FFFDF9] border border-[#E7DED2] rounded-lg px-3 py-1.5 shadow-sm text-xs font-semibold text-[#1c1c18]">
                <span className="material-symbols-outlined text-[#74777e] text-sm">priority_high</span>
                <span>Urgency:</span>
                <select 
                  value={selectedUrgency} 
                  onChange={(e) => setSelectedUrgency(e.target.value)}
                  className="bg-transparent border-none font-bold text-[#001d36] focus:outline-none cursor-pointer"
                >
                  <option value="Critical">Critical & High</option>
                  <option value="All">All Levels</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate("/admin/incident")}
                className="bg-[#001d36] text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#17324d] transition-colors shadow-sm flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">add_alert</span>
                New Incident Probe
              </button>
            </div>
          </div>

          {/* Metric KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center text-[#74777e] text-xs font-semibold uppercase tracking-wider">
                <span>Ingested Telemetry</span>
                <span className="material-symbols-outlined text-[#001d36]">sensors</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#001d36]">1,284,920</span>
                <span className="text-xs font-bold text-green-600 flex items-center">+18%</span>
              </div>
              <p className="text-[11px] text-[#74777e] mt-1">Multi-modal data points / hr</p>
            </div>

            <div className="bg-[#FFFDF9] border border-[#E7DED2] border-l-4 border-l-orange-500 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center text-[#74777e] text-xs font-semibold uppercase tracking-wider">
                <span>Active Clusters</span>
                <span className="material-symbols-outlined text-orange-500">warning</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#001d36]">42</span>
                <span className="text-xs font-bold text-orange-600">Active</span>
              </div>
              <p className="text-[11px] text-[#74777e] mt-1">12 requires verification</p>
            </div>

            <div className="bg-[#FFFDF9] border border-[#E7DED2] border-l-4 border-l-green-500 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center text-[#74777e] text-xs font-semibold uppercase tracking-wider">
                <span>Verified Events</span>
                <span className="material-symbols-outlined text-green-600">verified</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#001d36]">18</span>
                <span className="text-xs font-bold text-green-600">Confirmed</span>
              </div>
              <p className="text-[11px] text-[#74777e] mt-1">99.4% AI confidence score</p>
            </div>

            <div className="bg-[#FFFDF9] border border-[#E7DED2] border-l-4 border-l-red-600 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center text-[#74777e] text-xs font-semibold uppercase tracking-wider">
                <span>High Priority Alerts</span>
                <span className="material-symbols-outlined text-red-600">campaign</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-red-600">5</span>
                <span className="text-xs font-bold text-red-600 animate-pulse">Urgent</span>
              </div>
              <p className="text-[11px] text-[#74777e] mt-1">Immediate response needed</p>
            </div>
          </div>

          {/* Main Grid: Interactive Map + Intelligence Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px]">
            {/* Map Container */}
            <div className="lg:col-span-8 bg-[#FFFDF9] border border-[#E7DED2] rounded-xl flex flex-col overflow-hidden shadow-sm">
              <div className="px-5 py-3 border-b border-[#E7DED2] flex justify-between items-center bg-[#F1ECE4]">
                <h2 className="font-bold text-[#001d36] text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#D98B3A]">public</span>
                  Tactical GIS Threat Map
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-semibold bg-white border border-[#E7DED2] px-2 py-0.5 rounded text-[#001d36]">
                    LAYERS: SATELLITE + SENSORS
                  </span>
                </div>
              </div>

              <div className="flex-1 relative bg-[#121d27] overflow-hidden min-h-[420px] flex items-center justify-center">
                {/* Visual Grid Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:32px_32px]"></div>

                {/* Map Graphic Background */}
                <img
                  alt="GIS Map Visualization"
                  className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity"
                  src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=1200"
                />

                {/* Interactive Map Nodes */}
                <div className="absolute top-1/3 left-1/4 group cursor-pointer" onClick={() => navigate("/admin/incident")}>
                  <div className="relative">
                    <span className="absolute -inset-2 bg-red-500 rounded-full animate-ping opacity-75"></span>
                    <div className="w-5 h-5 bg-red-600 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold shadow-lg">!</div>
                  </div>
                  <div className="hidden group-hover:block absolute top-6 left-1/2 -translate-x-1/2 bg-[#001d36] text-white text-[11px] p-2 rounded-lg shadow-xl border border-white/20 whitespace-nowrap z-20">
                    <div className="font-bold">River Basin Flash Flood</div>
                    <div className="text-[9px] text-red-300">Urgency: Critical | Conf: 94%</div>
                  </div>
                </div>

                <div className="absolute top-1/2 left-3/5 group cursor-pointer" onClick={() => navigate("/admin/incident")}>
                  <div className="w-4 h-4 bg-orange-500 rounded-full border-2 border-white shadow-lg"></div>
                  <div className="hidden group-hover:block absolute top-6 left-1/2 -translate-x-1/2 bg-[#001d36] text-white text-[11px] p-2 rounded-lg shadow-xl border border-white/20 whitespace-nowrap z-20">
                    <div className="font-bold">Sub-station Damage</div>
                    <div className="text-[9px] text-orange-300">Urgency: High | Conf: 88%</div>
                  </div>
                </div>

                {/* Bottom Map Floating Legend */}
                <div className="absolute bottom-4 left-4 right-4 bg-[#001d36]/90 backdrop-blur-md text-white border border-white/10 rounded-lg p-3 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Critical Node
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> High Warning
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span> Monitoring
                    </span>
                  </div>
                  <div className="font-mono text-[10px] text-white/70">
                    COORD: 34.0522° N, 118.2437° W | REFRESH: 5s
                  </div>
                </div>
              </div>
            </div>

            {/* Live Intelligence Feed Sidebar */}
            <div className="lg:col-span-4 flex flex-col space-y-4">
              {/* AI Insight Card */}
              <div className="bg-[#FFFDF9] border border-[#D98B3A]/40 rounded-xl p-4 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-[#D98B3A] tracking-wider uppercase">
                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                    AI Executive Summary
                  </span>
                  <span className="text-[10px] font-mono text-[#74777e]">Updated 1m ago</span>
                </div>
                <p className="text-xs text-[#1c1c18] leading-relaxed">
                  High-density social clusters combined with seismic telemetry indicate severe water rise near District 4. Emergency evacuation suggested.
                </p>
                <div className="mt-3 pt-2 border-t border-[#E7DED2] flex justify-between items-center text-[10px]">
                  <span className="text-[#74777e]">Verified by 14 Data Sources</span>
                  <button 
                    onClick={() => navigate("/admin/intelligence-feed")}
                    className="text-[#001d36] font-bold hover:underline"
                  >
                    View Stream →
                  </button>
                </div>
              </div>

              {/* Incidents Feed */}
              <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-4 flex-1 flex flex-col shadow-sm">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E7DED2]">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#001d36]">Real-time Incident Feed</h3>
                  <button 
                    onClick={() => navigate("/admin/intelligence-feed")}
                    className="text-[11px] font-semibold text-[#D98B3A] hover:underline"
                  >
                    Full Stream
                  </button>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {incidents.map((inc) => (
                    <div 
                      key={inc.id}
                      onClick={() => navigate("/admin/incident")}
                      className="p-3 border border-[#E7DED2] rounded-lg hover:border-[#D98B3A] transition-all cursor-pointer bg-white hover:shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${inc.badgeColor}`}>
                          {inc.urgency}
                        </span>
                        <span className="text-[10px] text-[#74777e] font-mono">{inc.time}</span>
                      </div>
                      <h4 className="font-bold text-xs text-[#001d36]">{inc.title}</h4>
                      <p className="text-[11px] text-[#74777e] mt-0.5">{inc.location}</p>
                      
                      <div className="mt-2 flex items-center justify-between text-[10px] text-[#74777e] pt-2 border-t border-slate-100">
                        <span>{inc.source}</span>
                        <span className="font-mono font-bold text-green-700">{inc.confidence}% Conf.</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
export default Dashboard
