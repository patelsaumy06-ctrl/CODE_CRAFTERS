import React, { useState, useEffect } from 'react'
import { Sidebar } from '../common/Sidebar'
import { Header } from '../common/Header'
import { createAlert, listenToAlerts } from '../../services/alertService'
import { useAuth } from '../../context/AuthContext'

export const AlertsNotifications = () => {
  const { userRole } = useAuth()
  const [broadcastTitle, setBroadcastTitle] = useState("")
  const [broadcastMessage, setBroadcastMessage] = useState("")
  const [severity, setSeverity] = useState("Critical")
  const [target, setTarget] = useState("All Sector First Responders")
  const [dispatching, setDispatching] = useState(false)

  const [alertsList, setAlertsList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = listenToAlerts((data) => {
      setAlertsList(data)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleBroadcast = async (e) => {
    e.preventDefault()
    if (!broadcastTitle || !broadcastMessage) return

    setDispatching(true)
    try {
      await createAlert({
        title: broadcastTitle,
        message: broadcastMessage,
        severity: severity,
        target: target,
        status: "Broadcasting"
      })
      alert(`Emergency Broadcast Dispatched & Logged in Firestore!\nTitle: "${broadcastTitle}" [Severity: ${severity}]`)
      setBroadcastTitle("")
      setBroadcastMessage("")
    } catch (error) {
      console.error("Error dispatching alert:", error)
      alert("Failed to dispatch broadcast alert to Firestore: " + error.message)
    } finally {
      setDispatching(false)
    }
  }

  return (
    <div className="bg-[#F7F3EC] text-[#1c1c18] font-sans flex h-screen overflow-hidden antialiased">
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-[260px] min-h-screen relative overflow-hidden">
        <Header title="Alerts & Notification Dispatch" />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Broadcast Dispatcher Form */}
          {userRole !== "viewer" && (
            <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-6 shadow-sm space-y-4">
              <h2 className="font-bold text-base text-[#001d36] flex items-center gap-2">
                <span className="material-symbols-outlined text-red-600">campaign</span>
                Emergency Broadcast Center
              </h2>
              <p className="text-xs text-[#74777e]">
                Dispatch immediate warnings to field responder apps, civilian SMS gateways, and local news outlets. All broadcasts are logged immutably.
              </p>

              <form onSubmit={handleBroadcast} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-[#74777e] tracking-wider">Alert Headline</label>
                    <input 
                      type="text" 
                      required
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      placeholder="e.g. Evacuation Order: Sector 4"
                      className="w-full border border-[#E7DED2] rounded-lg p-2 text-xs focus:border-[#D98B3A]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-[#74777e] tracking-wider">Severity / Level</label>
                    <select 
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value)}
                      className="w-full border border-[#E7DED2] rounded-lg p-2 text-xs focus:border-[#D98B3A]"
                    >
                      <option value="Critical">🔴 Critical (Immediate Threat)</option>
                      <option value="High">🟠 High (Prepare for Action)</option>
                      <option value="Advisory">🟡 Advisory (Monitor Situation)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[#74777e] tracking-wider">Target Audience</label>
                  <select 
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="w-full border border-[#E7DED2] rounded-lg p-2 text-xs focus:border-[#D98B3A]"
                  >
                    <option value="All Sector First Responders">All Sector First Responders</option>
                    <option value="Civilian Public (SMS/App)">Civilian Public (SMS/App)</option>
                    <option value="Command Center Staff Only">Command Center Staff Only</option>
                    <option value="External Relief Agencies">External Relief Agencies</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[#74777e] tracking-wider">Actionable Message</label>
                  <textarea 
                    required
                    rows="3"
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Enter detailed instructions for the target audience..."
                    className="w-full border border-[#E7DED2] rounded-lg p-2 text-xs focus:border-[#D98B3A]"
                  ></textarea>
                </div>

                <div className="flex justify-end pt-2">
                  <button 
                    type="submit" 
                    disabled={dispatching}
                    className="bg-red-600 text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-700 transition-colors shadow-md flex items-center gap-2 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">send</span>
                    {dispatching ? "Broadcasting..." : "Dispatch Emergency Broadcast"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Active Alerts List */}
          <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-[#001d36]">Active & Recent Dispatches (Firestore Stream)</h3>
              <span className="text-xs font-mono text-green-700 bg-green-50 border border-green-200 px-2.5 py-0.5 rounded-full font-bold">
                ● Live Firestore Connected
              </span>
            </div>

            <div className="space-y-3">
              {alertsList.map((alt) => (
                <div key={alt.id || alt.title} className="p-4 border border-[#E7DED2] rounded-lg bg-white flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        alt.severity === "Critical" ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"
                      }`}>
                        {alt.severity}
                      </span>
                      <span className="font-mono text-xs text-[#74777e]">
                        #{alt.id ? alt.id.slice(0, 8).toUpperCase() : "ALT-801"} • {alt.createdAt ? "Live Broadcast" : "Recently"}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-[#001d36]">{alt.title}</h4>
                    <p className="text-xs text-[#74777e] mt-1">{alt.message || `Target Recipients: ${alt.target}`}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">
                      {alt.status || "Broadcasting"}
                    </span>
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
