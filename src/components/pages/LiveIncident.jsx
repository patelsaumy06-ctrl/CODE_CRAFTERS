import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Sidebar } from '../common/Sidebar'
import { Header } from '../common/Header'
import { getIncidentById, listenToIncidents, updateIncident } from '../../services/incidentService'
import { useAuth } from '../../context/AuthContext'

export const LiveIncident = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { userRole } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [incident, setIncident] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubscribe = () => {}
    if (id) {
      getIncidentById(id).then((docData) => {
        if (docData) {
          setIncident(docData)
        }
        setLoading(false)
      }).catch(err => {
        console.error("Error fetching incident by ID:", err)
        setLoading(false)
      })
    } else {
      unsubscribe = listenToIncidents((incidents) => {
        if (incidents && incidents.length > 0) {
          setIncident(incidents[0])
        }
        setLoading(false)
      })
    }
    return () => unsubscribe()
  }, [id])

  const handleToggleVerify = async () => {
    if (!incident || !incident.id) return
    const newVerified = !incident.verified
    try {
      await updateIncident(incident.id, { verified: newVerified, status: newVerified ? "verified" : "investigating" })
      setIncident(prev => ({ ...prev, verified: newVerified, status: newVerified ? "verified" : "investigating" }))
      alert(`Incident status updated to ${newVerified ? "VERIFIED" : "INVESTIGATING"} in Firestore!`)
    } catch (e) {
      console.error("Error updating incident status:", e)
      alert("Failed to update incident in Firestore.")
    }
  }

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

  const incTitle = incident?.title || "Flash Flood & Levee Breach Warning"
  const incSeverity = incident?.severity || "critical"
  const incLocation = incident?.location?.address || "Northern River Basin (Sector 4)"
  const incDesc = incident?.description || "Detected via multi-source sensor arrays, Satellite SAR imagery, and high-density local social reports."
  const isVerified = incident?.verified || false

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
                  INCIDENT #{incident?.id ? incident.id.slice(0, 8).toUpperCase() : "INC-9042"} • {incSeverity.toUpperCase()}
                </span>
                <span className="text-xs text-[#74777e] font-mono">Location: {incLocation}</span>
              </div>
              <h2 className="text-2xl font-bold text-[#001d36]">{incTitle}</h2>
              <p className="text-xs text-[#74777e] mt-1">{incDesc}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-[#74777e]">AI Confidence Score</div>
                <div className="text-xl font-bold text-green-700 font-mono">
                  {isVerified ? "99.2% Confirmed" : "94.8% Verified"}
                </div>
              </div>

              {userRole !== "viewer" && (
                <button 
                  onClick={handleToggleVerify}
                  className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border ${
                    isVerified ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-200" : "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200"
                  }`}
                >
                  {isVerified ? "✓ Verified Event" : "Verify Ground Truth"}
                </button>
              )}

              {userRole !== "viewer" && (
                <button 
                  onClick={() => navigate("/admin/notifications")}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-700 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">campaign</span>
                  Issue Broadcast Alert
                </button>
              )}
            </div>
          </div>

          {/* Tab Selection */}
          <div className="flex border-b border-[#E7DED2] gap-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
                activeTab === "overview"
                  ? "border-[#D98B3A] text-[#001d36]"
                  : "border-transparent text-[#74777e] hover:text-[#001d36]"
              }`}
            >
              Evidence & Media Stream
            </button>
            <button
              onClick={() => setActiveTab("timeline")}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
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
                          <span className="bg-slate-100 text-[#001d36] text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                            {m.type}
                          </span>
                          <h4 className="font-bold text-xs text-[#001d36] mt-2 truncate">{m.title}</h4>
                          <span className="text-[10px] text-[#74777e]">{m.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-5 shadow-sm space-y-3">
                  <h3 className="font-bold text-sm text-[#001d36] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#D98B3A]">analytics</span>
                    Multi-Source Sensor AI Consensus Breakdown
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between font-semibold mb-1">
                        <span>Hydrological Telemetry Sensor Consensus</span>
                        <span className="font-mono text-green-700 font-bold">98.2%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-green-600 h-full w-[98%]"></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between font-semibold mb-1">
                        <span>Social Stream Sentiment NLP Agreement</span>
                        <span className="font-mono text-green-700 font-bold">91.4%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-[#001d36] h-full w-[91%]"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Tactical Action Panel */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-5 shadow-sm space-y-4">
                  <h3 className="font-bold text-sm text-[#001d36] flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-600">health_and_safety</span>
                    Recommended Tactical Actions
                  </h3>

                  <div className="space-y-3">
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs space-y-1">
                      <span className="font-bold text-red-800 uppercase text-[10px]">Priority 1</span>
                      <p className="font-semibold text-[#001d36]">Dispatch Water Rescue Squad 4</p>
                      <p className="text-[11px] text-[#74777e]">Deploy boat teams to Northern Basin sector bridge.</p>
                    </div>

                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1">
                      <span className="font-bold text-amber-800 uppercase text-[10px]">Priority 2</span>
                      <p className="font-semibold text-[#001d36]">Activate Reverse 911 Geofence</p>
                      <p className="text-[11px] text-[#74777e]">Send emergency SMS alert to residents within 2.5km radius.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-6 shadow-sm space-y-6 max-w-4xl">
              <h3 className="font-bold text-sm text-[#001d36]">AI Ground-Truth Verification Log</h3>
              <div className="relative pl-6 border-l-2 border-[#D98B3A] space-y-6">
                {timelineEvents.map((ev, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-[#001d36] border-2 border-white"></div>
                    <span className="font-mono text-xs text-[#D98B3A] font-bold">{ev.time}</span>
                    <p className="text-xs text-[#001d36] font-medium mt-0.5">{ev.text}</p>
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
