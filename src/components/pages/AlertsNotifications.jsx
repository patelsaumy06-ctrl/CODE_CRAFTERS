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
      setAlertsList(data || [])
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
        status: "Active"
      })
      alert(`Alert sent: "${broadcastTitle}"`)
      setBroadcastTitle("")
      setBroadcastMessage("")
    } catch (error) {
      console.error("Error dispatching alert:", error)
      alert("Failed to send alert: " + error.message)
    } finally {
      setDispatching(false)
    }
  }

  return (
    <div className="bg-[#F7F3EC] text-[#1c1c18] font-sans flex h-screen overflow-hidden antialiased">
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-[260px] min-h-screen relative overflow-hidden">
        <Header title="Alerts & Notifications" />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">

          {/* Broadcast Dispatcher Form */}
          {userRole !== "viewer" && (
            <div className="bg-white border border-[#E7DED2] rounded-lg p-5 space-y-3">
              <h2 className="font-semibold text-sm text-[#001d36] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-red-600">campaign</span>
                Send Alert
              </h2>
              <p className="text-xs text-[#74777e]">
                Send an emergency alert to responders and the public.
              </p>

              <form onSubmit={handleBroadcast} className="space-y-3.5 pt-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#43474d]">Alert Title</label>
                    <input 
                      type="text" 
                      required
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      placeholder="e.g. Evacuation advisory for River Basin"
                      className="w-full border border-[#E7DED2] rounded-lg p-2 text-xs focus:border-[#001d36] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#43474d]">Severity Level</label>
                    <select 
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value)}
                      className="w-full border border-[#E7DED2] rounded-lg p-2 text-xs focus:border-[#001d36] focus:outline-none cursor-pointer"
                    >
                      <option value="Critical">Critical (Immediate danger)</option>
                      <option value="High">High (Prepare for action)</option>
                      <option value="Advisory">Advisory (Monitor situation)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#43474d]">Target Audience</label>
                  <select 
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="w-full border border-[#E7DED2] rounded-lg p-2 text-xs focus:border-[#001d36] focus:outline-none cursor-pointer"
                  >
                    <option value="All Sector First Responders">All First Responders</option>
                    <option value="Civilian Public (SMS/App)">Public Notification</option>
                    <option value="Command Center Staff Only">Operations Staff Only</option>
                    <option value="External Relief Agencies">Relief Agencies</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#43474d]">Message Content</label>
                  <textarea 
                    required
                    rows="3"
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Enter actionable instructions..."
                    className="w-full border border-[#E7DED2] rounded-lg p-2 text-xs focus:border-[#001d36] focus:outline-none"
                  ></textarea>
                </div>

                <div className="flex justify-end pt-1">
                  <button 
                    type="submit" 
                    disabled={dispatching}
                    className="bg-[#001d36] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[#17324d] transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">send</span>
                    {dispatching ? "Sending..." : "Send Alert"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Active Alerts List */}
          <div className="bg-white border border-[#E7DED2] rounded-lg p-5 space-y-3">
            <div className="flex justify-between items-center border-b border-[#E7DED2] pb-2.5">
              <h3 className="font-semibold text-xs text-[#001d36]">Recent Alerts</h3>
              <span className="text-xs text-[#74777e]">
                {alertsList.length} total
              </span>
            </div>

            <div className="space-y-2.5">
              {alertsList.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#74777e]">
                  No active alerts.
                </div>
              ) : (
                alertsList.map((alt) => (
                  <div key={alt.id || alt.title} className="p-3.5 border border-[#E7DED2] rounded-lg bg-[#FAF7F2] flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          alt.severity === "Critical" ? "bg-red-50 text-red-700 border border-red-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {alt.severity}
                        </span>
                        <span className="text-[11px] text-[#74777e]">
                          {alt.createdAt ? "Recent" : "Logged"} · Target: {alt.target}
                        </span>
                      </div>
                      <h4 className="font-semibold text-xs text-[#001d36]">{alt.title}</h4>
                      <p className="text-xs text-[#43474d]">{alt.message}</p>
                    </div>

                    <span className="bg-white border border-[#E7DED2] text-[#001d36] px-2.5 py-1 rounded text-[11px] font-medium">
                      {alt.status || "Active"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
export default AlertsNotifications
