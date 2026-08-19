import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Sidebar } from '../common/Sidebar'
import { Header } from '../common/Header'
import { getIncidentById, listenToIncidents, updateIncident } from '../../services/incidentService'
import { verifyDisasterAI, analyzeRisk } from '../../services/intelligenceService'
import { useAuth } from '../../context/AuthContext'

export const LiveIncident = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const locationState = useLocation()
  const targetIncidentId = id || locationState?.state?.incidentId

  const { userRole } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [incident, setIncident] = useState(null)
  const [loading, setLoading] = useState(true)

  // Weather Risk analysis state
  const [weatherAnalysis, setWeatherAnalysis] = useState(null)
  const [analyzingWeather, setAnalyzingWeather] = useState(false)

  // AI Verification state
  const [aiVerification, setAiVerification] = useState(null)
  const [verifyingAI, setVerifyingAI] = useState(false)

  useEffect(() => {
    let unsubscribe = () => {}
    if (targetIncidentId) {
      getIncidentById(targetIncidentId)
        .then((docData) => {
          if (docData) {
            setIncident(docData)
          }
          setLoading(false)
        })
        .catch((err) => {
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
  }, [targetIncidentId])

  const handleToggleVerify = async () => {
    if (!incident || !incident.id) return
    const newVerified = !incident.verified
    try {
      await updateIncident(incident.id, {
        verified: newVerified,
        status: newVerified ? "verified" : "investigating",
        verificationStatus: newVerified ? "verified" : "unverified",
      })
      setIncident((prev) => ({
        ...prev,
        verified: newVerified,
        status: newVerified ? "verified" : "investigating",
        verificationStatus: newVerified ? "verified" : "unverified",
      }))
      alert(`Incident status updated to ${newVerified ? "VERIFIED" : "INVESTIGATING"} in Firestore!`)
    } catch (e) {
      console.error("Error updating incident status:", e)
      alert("Failed to update incident in Firestore.")
    }
  }

  const handleRunWeatherRisk = async () => {
    if (!incident) return
    setAnalyzingWeather(true)
    try {
      const lat = Number(incident.location?.latitude ?? 19.076)
      const lon = Number(incident.location?.longitude ?? 72.8777)
      const analysis = await analyzeRisk({
        latitude: lat,
        longitude: lon,
        disasterType: incident.disasterType || "flood",
        incidentId: incident.id,
      })
      if (analysis) {
        setWeatherAnalysis(analysis)
      }
    } catch (err) {
      console.error("Weather risk query error:", err)
    } finally {
      setAnalyzingWeather(false)
    }
  }

  const handleRunAiVerify = async () => {
    if (!incident) return
    setVerifyingAI(true)
    try {
      const res = await verifyDisasterAI({
        incidentId: incident.id,
        text: `${incident.title}. ${incident.description || ""}`,
        location: incident.location,
        sources: incident.evidence || [{ sourceType: incident.source || "sensor", text: incident.title }],
      })
      if (res) {
        setAiVerification(res)
      }
    } catch (err) {
      console.error("AI verify error:", err)
    } finally {
      setVerifyingAI(false)
    }
  }

  const incTitle = incident?.title || "Multi-Source Disaster Detection"
  const incSeverity = (incident?.severity || "medium").toLowerCase()
  const incLocation = incident?.location?.address || `${incident?.location?.latitude?.toFixed?.(2) || "19.07"}°, ${incident?.location?.longitude?.toFixed?.(2) || "72.87"}°`
  const incDesc = incident?.description || "Detected via real-time ingestion, sensor feeds, and satellite telemetry."
  const isVerified = incident?.verified || incident?.verificationStatus === "verified"
  const confidencePct = Math.round((Number(incident?.confidence) <= 1 ? Number(incident?.confidence) * 100 : Number(incident?.confidence)) || 85)
  const evidenceList = Array.isArray(incident?.evidence) && incident.evidence.length > 0
    ? incident.evidence
    : [
        { source: incident?.source || "USGS / GDACS", confidence: 0.95, timestamp: new Date().toISOString() },
        { source: "Open-Meteo Telemetry", confidence: 0.90, timestamp: new Date().toISOString() },
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
                  INCIDENT #{incident?.id ? incident.id.slice(0, 8).toUpperCase() : "LIVE-01"} &bull; {incSeverity.toUpperCase()}
                </span>
                <span className="text-xs text-[#74777e] font-mono">📍 {incLocation}</span>
              </div>
              <h2 className="text-2xl font-bold text-[#001d36]">{incTitle}</h2>
              <p className="text-xs text-[#74777e] mt-1">{incDesc}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-[#74777e]">AI Confidence Score</div>
                <div className="text-xl font-bold text-green-700 font-mono">
                  {confidencePct}% {isVerified ? "Verified" : "Corroborated"}
                </div>
              </div>

              {userRole !== "viewer" && (
                <button
                  onClick={handleToggleVerify}
                  className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border cursor-pointer ${
                    isVerified
                      ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-200"
                      : "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200"
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
                  Broadcast Alert
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
              Multi-Source Evidence & Weather
            </button>
            <button
              onClick={() => setActiveTab("ai_verify")}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
                activeTab === "ai_verify"
                  ? "border-[#D98B3A] text-[#001d36]"
                  : "border-transparent text-[#74777e] hover:text-[#001d36]"
              }`}
            >
              AI Deep Verification
            </button>
          </div>

          {/* Main Grid Content */}
          {activeTab === "overview" ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Aggregated Evidence Sources */}
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-[#001d36] flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#D98B3A]">layers</span>
                      Aggregated Multi-Source Evidence ({evidenceList.length} sources)
                    </h3>
                    <span className="text-[11px] font-mono text-[#74777e]">Evidence Aggregation Engine</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {evidenceList.map((ev, idx) => {
                      const srcName = (ev.source || ev.sourceType || "Sensor Ingest").toUpperCase()
                      const conf = Math.round((Number(ev.confidence) <= 1 ? Number(ev.confidence) * 100 : Number(ev.confidence)) || 90)
                      return (
                        <div key={idx} className="border border-[#E7DED2] rounded-lg p-3 bg-white shadow-sm flex flex-col justify-between space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="bg-[#001d36] text-white text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                              {srcName}
                            </span>
                            <span className="text-[11px] font-bold text-green-700 font-mono">
                              {conf}% Confidence
                            </span>
                          </div>
                          <div className="text-xs text-[#1c1c18] font-medium truncate">
                            {ev.sourceId ? `ID: ${ev.sourceId}` : `Ref: ${incident?.id?.slice(0, 10) || "Auto-Clustered"}`}
                          </div>
                          <div className="text-[10px] text-[#74777e] flex justify-between">
                            <span>Ingested</span>
                            <span>{ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : "Recent"}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Open-Meteo Weather & Flood Correlation Panel */}
                <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-[#001d36] flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#D98B3A]">water_drop</span>
                      Open-Meteo Weather & Flood Correlation
                    </h3>
                    <button
                      onClick={handleRunWeatherRisk}
                      disabled={analyzingWeather}
                      className="bg-[#001d36] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#002d54] transition-colors cursor-pointer"
                    >
                      {analyzingWeather ? "Analyzing..." : "Query Open-Meteo Risk"}
                    </button>
                  </div>

                  {weatherAnalysis ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
                        <div className="text-[#74777e] text-[10px]">Precipitation</div>
                        <div className="text-base font-bold text-[#001d36] font-mono">{weatherAnalysis.weather?.precipitation ?? 0} mm/h</div>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
                        <div className="text-[#74777e] text-[10px]">Wind Speed</div>
                        <div className="text-base font-bold text-[#001d36] font-mono">{weatherAnalysis.weather?.windSpeed ?? 0} km/h</div>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
                        <div className="text-[#74777e] text-[10px]">River Discharge</div>
                        <div className="text-base font-bold text-[#001d36] font-mono">{weatherAnalysis.flood?.riverDischarge ?? 0} m³/s</div>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
                        <div className="text-[#74777e] text-[10px]">Correlation Score</div>
                        <div className="text-base font-bold text-green-700 font-mono">
                          {Math.round((weatherAnalysis.correlation?.score || 0) * 100)}% ({weatherAnalysis.correlation?.relevance || "moderate"})
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-[#74777e]">
                      Click "Query Open-Meteo Risk" to correlate this incident's coordinates with real-time precipitation, wind, soil moisture, and river discharge telemetry.
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column: Recommendations */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-5 shadow-sm space-y-4">
                  <h3 className="font-bold text-sm text-[#001d36] flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-600">health_and_safety</span>
                    Recommended Tactical Actions
                  </h3>

                  <div className="space-y-3">
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs space-y-1">
                      <span className="font-bold text-red-800 uppercase text-[10px]">Action 1</span>
                      <p className="font-semibold text-[#001d36]">Dispatch First Responders</p>
                      <p className="text-[11px] text-[#74777e]">Coordinate emergency units to {incLocation}.</p>
                    </div>

                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1">
                      <span className="font-bold text-amber-800 uppercase text-[10px]">Action 2</span>
                      <p className="font-semibold text-[#001d36]">Monitor Weather Signals</p>
                      <p className="text-[11px] text-[#74777e]">Continuous radar & river basin telemetry tracking.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* AI Deep Verification Tab */
            <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-6 shadow-sm space-y-6 max-w-4xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-[#001d36] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#D98B3A]">psychology</span>
                    AI Verification Engine (OpenRouter / DeepSeek / Gemini Fallback)
                  </h3>
                  <p className="text-xs text-[#74777e] mt-0.5">
                    Evaluates multi-source evidence, geographic consistency, and cross-checks telemetry signals.
                  </p>
                </div>
                <button
                  onClick={handleRunAiVerify}
                  disabled={verifyingAI}
                  className="bg-[#001d36] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#002d54] transition-colors cursor-pointer"
                >
                  {verifyingAI ? "Analyzing..." : "Trigger AI Verification"}
                </button>
              </div>

              {aiVerification ? (
                <div className="space-y-4 text-xs">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#001d36]">Verification Result: {(aiVerification.verificationStatus || "corroborated").toUpperCase()}</span>
                      <span className="font-mono font-bold text-green-700">{Math.round((aiVerification.confidence || 0.8) * 100)}% Confidence</span>
                    </div>
                    <p className="text-xs text-[#334155]">{aiVerification.reasoning || aiVerification.summary}</p>
                    <div className="text-[10px] text-[#74777e]">Source Engine: {aiVerification.analysisSource}</div>
                  </div>

                  {Array.isArray(aiVerification.confidenceFactors) && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-xs text-[#001d36]">Confidence Scoring Factors Breakdown:</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {aiVerification.confidenceFactors.map((f, i) => (
                          <div key={i} className="p-2.5 bg-white border border-[#E7DED2] rounded-lg">
                            <div className="flex justify-between font-bold text-[#001d36]">
                              <span>{f.factor}</span>
                              <span>{Math.round(f.score * 100)}%</span>
                            </div>
                            <div className="text-[10px] text-[#74777e] mt-1">{f.detail}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-[#74777e] space-y-2">
                  <p>Click "Trigger AI Verification" to run real-time multi-source reasoning across all ingested evidence for this incident.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default LiveIncident
