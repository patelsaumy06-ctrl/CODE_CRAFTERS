import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidebar } from '../common/Sidebar'
import { Header } from '../common/Header'
import { VerificationBadge } from '../common/VerificationBadge'
import { SeverityBadge } from '../common/SeverityBadge'
import { ConfidenceIndicator } from '../common/ConfidenceIndicator'
import { sortPriorityIncidents, formatRelativeTime } from '../../utils/intelligenceUtils'
import { createAlert, listenToAlerts } from '../../services/alertService'
import { listenToIncidents } from '../../services/incidentService'
import { useAuth } from '../../context/AuthContext'

export const AlertsNotifications = () => {
  const navigate = useNavigate()
  const { userRole } = useAuth()
  const [broadcastTitle, setBroadcastTitle] = useState("")
  const [broadcastMessage, setBroadcastMessage] = useState("")
  const [severity, setSeverity] = useState("Critical")
  const [target, setTarget] = useState("All Sector First Responders")
  const [dispatching, setDispatching] = useState(false)

  const [alertsList, setAlertsList] = useState([])
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribeAlerts = listenToAlerts((data) => {
      setAlertsList(data || [])
      setLoading(false)
    })

    const unsubscribeIncidents = listenToIncidents((res) => {
      if (res.incidents) {
        setIncidents(res.incidents)
      }
    }, 3)

    return () => {
      unsubscribeAlerts()
      unsubscribeIncidents()
    }
  }, [])

  // High Priority Incidents (Critical and High severity) requiring alert attention
  const highPriorityIncidents = sortPriorityIncidents(
    incidents.filter((i) => {
      const s = (i.severity || "").toLowerCase()
      return s === "critical" || s === "high"
    })
  ).slice(0, 4)

  const handlePreFillAlert = (inc) => {
    setBroadcastTitle(`EMERGENCY: ${inc.title || (inc.disasterType || "Disaster").toUpperCase()}`)
    setBroadcastMessage(
      `URGENT ADVISORY: High-severity ${inc.disasterType || "hazard"} detected near ${
        inc.location?.address || "target coordinates"
      }. First responders should mobilize and prepare evacuation corridors immediately.`
    )
    setSeverity((inc.severity || "Critical").charAt(0).toUpperCase() + (inc.severity || "critical").slice(1))
    // Scroll to form smoothly
    const formEl = document.getElementById("alert-composer-form")
    if (formEl) {
      formEl.scrollIntoView({ behavior: "smooth" })
    }
  }

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
      alert(`Emergency alert dispatched: "${broadcastTitle}"`)
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
        <Header title="Emergency Alerts & Notifications" />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">

          {/* STEP 7: High-Priority Incidents Alert Queue */}
          {highPriorityIncidents.length > 0 && (
            <div className="bg-white border border-red-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-red-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-600 text-lg">priority_high</span>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-red-950">
                    High-Priority Incidents Requiring Alert Review
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  {highPriorityIncidents.length} Urgent {highPriorityIncidents.length === 1 ? "Incident" : "Incidents"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {highPriorityIncidents.map((inc) => {
                  const locationStr = inc.location?.address || `${Number(inc.location?.latitude ?? 0).toFixed(2)}°, ${Number(inc.location?.longitude ?? 0).toFixed(2)}°`
                  const eventTime = inc.event_time || inc.source_updated_at || inc.timestamp

                  return (
                    <div 
                      key={inc.id || inc.source_event_id}
                      className="p-3.5 border border-red-200 bg-red-50/30 rounded-lg space-y-2.5 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <SeverityBadge severity={inc.severity || "critical"} size="xs" pulse />
                          <VerificationBadge incident={inc} size="xs" />
                        </div>

                        <h4 className="font-bold text-xs text-[#001d36] line-clamp-1">
                          {inc.title}
                        </h4>

                        <div className="text-[11px] text-[#74777e] mt-1 flex justify-between">
                          <span className="truncate max-w-[200px]">📍 {locationStr}</span>
                          <span className="font-mono text-[10px] text-slate-500">{formatRelativeTime(eventTime)}</span>
                        </div>

                        <div className="pt-1.5 mt-1 border-t border-red-100 flex items-center justify-between text-xs">
                          <ConfidenceIndicator incident={inc} />
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => navigate(`/admin/incident/${inc.id || inc.source_event_id}`)}
                          className="flex-1 bg-white border border-[#E7DED2] hover:border-[#001d36] text-[#001d36] py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer text-center"
                        >
                          Review Incident
                        </button>
                        {userRole !== "viewer" && (
                          <button
                            onClick={() => handlePreFillAlert(inc)}
                            className="flex-1 bg-red-700 hover:bg-red-800 text-white py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">edit_notifications</span>
                            Prepare Alert
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Broadcast Dispatcher Form */}
          {userRole !== "viewer" && (
            <div id="alert-composer-form" className="bg-white border border-[#E7DED2] rounded-xl p-5 space-y-4 shadow-sm">
              <h2 className="font-bold text-xs uppercase tracking-wider text-[#001d36] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-red-600">campaign</span>
                Emergency Alert Dispatcher
              </h2>
              <p className="text-xs text-[#74777e]">
                Authorize and broadcast actionable operational bulletins to responder networks and civilian channels.
              </p>

              <form onSubmit={handleBroadcast} className="space-y-3.5 pt-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#43474d]">Alert Title *</label>
                    <input 
                      type="text" 
                      required
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      placeholder="e.g. EVACUATION ADVISORY: Flash Flood Inundation Sector 4"
                      className="w-full border border-[#E7DED2] rounded-lg p-2.5 text-xs focus:border-[#001d36] focus:outline-none bg-[#FAF7F2]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#43474d]">Severity Level *</label>
                    <select 
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value)}
                      className="w-full border border-[#E7DED2] rounded-lg p-2.5 text-xs focus:border-[#001d36] focus:outline-none cursor-pointer bg-[#FAF7F2]"
                    >
                      <option value="Critical">Critical (Immediate Danger to Life)</option>
                      <option value="High">High (Urgent Response / Evacuate)</option>
                      <option value="Advisory">Advisory (Monitoring / Caution)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#43474d]">Target Audience / Channel *</label>
                  <select 
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="w-full border border-[#E7DED2] rounded-lg p-2.5 text-xs focus:border-[#001d36] focus:outline-none cursor-pointer bg-[#FAF7F2]"
                  >
                    <option value="All Sector First Responders">All Sector First Responders & Emergency Units</option>
                    <option value="Civilian Public (SMS/App)">Civilian Public Emergency Broadcast (SMS/Cell)</option>
                    <option value="Command Center Staff Only">Operations Command Staff Only</option>
                    <option value="External Relief Agencies">Humanitarian & Relief Partner Agencies</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#43474d]">Broadcast Message Content *</label>
                  <textarea 
                    required
                    rows="3"
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Enter precise operational directives, evacuation routes, or shelter locations..."
                    className="w-full border border-[#E7DED2] rounded-lg p-2.5 text-xs focus:border-[#001d36] focus:outline-none bg-[#FAF7F2]"
                  ></textarea>
                </div>

                <div className="flex justify-end pt-1">
                  <button 
                    type="submit" 
                    disabled={dispatching}
                    className="bg-red-700 text-white px-5 py-2.5 rounded-lg text-xs font-semibold hover:bg-red-800 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    <span className="material-symbols-outlined text-base">send</span>
                    {dispatching ? "Broadcasting Alert..." : "Authorize & Send Alert"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Active Alerts List */}
          <div className="bg-white border border-[#E7DED2] rounded-xl p-5 space-y-3 shadow-sm">
            <div className="flex justify-between items-center border-b border-[#E7DED2] pb-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#001d36]">
                Broadcast History & Audit Log
              </h3>
              <span className="text-xs font-mono text-[#74777e]">
                {alertsList.length} total logged
              </span>
            </div>

            <div className="space-y-3">
              {alertsList.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#74777e] space-y-1">
                  <span className="material-symbols-outlined text-3xl text-slate-300">notifications_paused</span>
                  <div className="font-semibold text-slate-700">No active alerts dispatched.</div>
                  <p className="text-[11px]">Authorized emergency broadcasts will appear here in chronological order.</p>
                </div>
              ) : (
                alertsList.map((alt) => (
                  <div key={alt.id || alt.title} className="p-3.5 border border-[#E7DED2] rounded-lg bg-[#FAF7F2] flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <SeverityBadge severity={alt.severity || "critical"} size="xs" />
                        <span className="text-[11px] font-mono text-[#74777e]">
                          Target: <b>{alt.target}</b>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatRelativeTime(alt.createdAt)}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-[#001d36]">{alt.title}</h4>
                      <p className="text-xs text-[#43474d] leading-relaxed">{alt.message}</p>
                    </div>

                    <span className="bg-white border border-emerald-300 text-emerald-800 px-2.5 py-1 rounded text-[10px] font-bold uppercase">
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
