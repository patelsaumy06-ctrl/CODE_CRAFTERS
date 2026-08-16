import React, { useState } from 'react'
import { Sidebar } from '../common/Sidebar'
import { Header } from '../common/Header'

export const AlertsNotifications = () => {
  const [broadcastTitle, setBroadcastTitle] = useState("")
  const [broadcastMessage, setBroadcastMessage] = useState("")
  const [severity, setSeverity] = useState("Critical")

  const activeAlerts = [
    { id: "ALT-801", title: "Sector 4 Emergency Evacuation Order", target: "All Responders & Local Cell Towers", status: "Broadcasting", time: "5m ago", type: "Critical" },
    { id: "ALT-798", title: "Sub-station B Gas Leak Safety Perimeter", target: "Fire & Hazmat Units", status: "Active", time: "25m ago", type: "High" },
    { id: "ALT-792", title: "Regional Shelter Capacity Update", target: "NGO Coordination Hubs", status: "Completed", time: "2h ago", type: "Notice" },
  ]

  const handleBroadcast = (e) => {
    e.preventDefault()
    if (!broadcastTitle || !broadcastMessage) return
    alert(`Broadcast Dispatched: "${broadcastTitle}" [Severity: ${severity}]`)
    setBroadcastTitle("")
    setBroadcastMessage("")
  }

  return (
    <div className="bg-[#F7F3EC] text-[#1c1c18] font-sans flex h-screen overflow-hidden antialiased">
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-[260px] min-h-screen relative overflow-hidden">
        <Header title="Alerts & Notification Dispatch" />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Broadcast Dispatcher Form */}
          <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-base text-[#001d36] flex items-center gap-2">
              <span className="material-symbols-outlined text-red-600">campaign</span>
              Emergency Broadcast Center
            </h2>

            <form onSubmit={handleBroadcast} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#74777e] mb-1">
                    Alert Title
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. Flash Flood Evacuation Notice - District 4"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    className="w-full bg-white border border-[#E7DED2] rounded-lg p-2.5 text-xs text-[#001d36] focus:outline-none focus:border-[#D98B3A]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[#74777e] mb-1">
                    Severity Level
                  </label>
                  <select 
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full bg-white border border-[#E7DED2] rounded-lg p-2.5 text-xs text-[#001d36] focus:outline-none focus:border-[#D98B3A]"
                  >
                    <option value="Critical">Critical (Red Alert - Emergency Push)</option>
                    <option value="High">High (Warning Alert)</option>
                    <option value="Moderate">Moderate (Advisory Notice)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#74777e] mb-1">
                  Dispatch Message Payload
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter precise operational instructions for first responders and regional broadcast services..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full bg-white border border-[#E7DED2] rounded-lg p-2.5 text-xs text-[#001d36] focus:outline-none focus:border-[#D98B3A]"
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">send</span>
                  Dispatch Emergency Broadcast
                </button>
              </div>
            </form>
          </div>

          {/* Active Alerts List */}
          <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-[#001d36]">Active & Recent Dispatches</h3>

            <div className="space-y-3">
              {activeAlerts.map((alt) => (
                <div key={alt.id} className="p-4 border border-[#E7DED2] rounded-lg bg-white flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        alt.type === "Critical" ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"
                      }`}>
                        {alt.type}
                      </span>
                      <span className="font-mono text-xs text-[#74777e]">{alt.id} • {alt.time}</span>
                    </div>
                    <h4 className="font-bold text-sm text-[#001d36]">{alt.title}</h4>
                    <p className="text-xs text-[#74777e]">Target Recipients: {alt.target}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">
                      {alt.status}
                    </span>
                    <button className="text-[#001d36] font-bold text-xs hover:underline">View Logs</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
export default AlertsNotifications
