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
    } catch (e) {
      console.error("Error updating incident status:", e)
      alert("Failed to update incident in database.")
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

  const incTitle = incident?.title || "Incident Report"
  const incSeverity = (incident?.severity || "medium").toLowerCase()
  const incLocation = incident?.location?.address || `${Number(incident?.location?.latitude ?? 19.07).toFixed(2)}°, ${Number(incident?.location?.longitude ?? 72.87).toFixed(2)}°`
  const incDesc = incident?.description || "Incident logged into system."
  const isVerified = incident?.verified || incident?.verificationStatus === "verified"
  const confidencePct = Math.round((Number(incident?.confidence) <= 1 ? Number(incident?.confidence) * 100 : Number(incident?.confidence)) || 85)
  const evidenceList = Array.isArray(incident?.evidence) && incident.evidence.length > 0
    ? incident.evidence
    : [
        { source: incident?.source || "Report Ingest", confidence: 0.90, timestamp: new Date().toISOString() },
      ]

  return (
    <div className="bg-[#F7F3EC] text-[#1c1c18] font-sans flex h-screen overflow-hidden antialiased">
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-[260px] min-h-screen relative overflow-hidden">
        <Header title="Incident Details" />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          {/* Incident Header Card */}
          <div className="bg-white border border-[#E7DED2] rounded-lg p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${
                  incSeverity === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                  incSeverity === 'high' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-slate-50 text-slate-700 border-slate-200'
                }`}>
                  {incSeverity}
                </span>
                <span className="text-xs text-[#74777e]">📍 {incLocation}</span>
              </div>
              <h2 className="text-xl font-bold text-[#001d36]">{incTitle}</h2>
              <p className="text-xs text-[#43474d] mt-1 max-w-3xl leading-relaxed">{incDesc}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right pr-2">
                <div className="text-[11px] text-[#74777e]">Confidence</div>
                <div className="text-base font-bold text-[#001d36]">
                  {confidencePct}% · {isVerified ? "Verified" : "Unverified"}
                </div>
              </div>

              {userRole !== "viewer" && (
                <button
                  onClick={handleToggleVerify}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border cursor-pointer ${
                    isVerified
                      ? "bg-green-50 text-green-800 border-green-200 hover:bg-green-100"
                      : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                  }`}
                >
                  {isVerified ? "✓ Verified" : "Verify Incident"}
                </button>
              )}

              {userRole !== "viewer" && (
                <button
                  onClick={() => navigate("/admin/notifications")}
                  className="bg-[#001d36] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#17324d] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">campaign</span>
                  Send Alert
                </button>
              )}
            </div>
          </div>

          {/* Tab Selection */}
          <div className="flex border-b border-[#E7DED2] gap-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`pb-2.5 text-xs font-semibold transition-colors border-b-2 cursor-pointer ${
                activeTab === "overview"
                  ? "border-[#001d36] text-[#001d36]"
                  : "border-transparent text-[#74777e] hover:text-[#001d36]"
              }`}
            >
              Evidence & Weather
            </button>
            <button
              onClick={() => setActiveTab("ai_verify")}
              className={`pb-2.5 text-xs font-semibold transition-colors border-b-2 cursor-pointer ${
                activeTab === "ai_verify"
                  ? "border-[#001d36] text-[#001d36]"
                  : "border-transparent text-[#74777e] hover:text-[#001d36]"
              }`}
            >
              Verification
            </button>
          </div>

          {/* Main Grid Content */}
          {activeTab === "overview" ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: Evidence Sources & Weather */}
              <div className="lg:col-span-8 space-y-5">
                <div className="bg-white border border-[#E7DED2] rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-xs text-[#001d36] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base">layers</span>
                      Evidence Sources ({evidenceList.length})
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {evidenceList.map((ev, idx) => {
                      const srcName = (ev.source || ev.sourceType || "Report Ingest")
                      const conf = Math.round((Number(ev.confidence) <= 1 ? Number(ev.confidence) * 100 : Number(ev.confidence)) || 90)
                      return (
                        <div key={idx} className="border border-[#E7DED2] rounded-lg p-3 bg-[#FAF7F2] flex flex-col justify-between space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#001d36]">
                              {srcName}
                            </span>
                            <span className="text-[11px] font-medium text-slate-700">
                              {conf}% confidence
                            </span>
                          </div>
                          <div className="text-[11px] text-[#43474d] truncate">
                            {ev.text || ev.sourceId || "Corroborated incident report"}
                          </div>
                          <div className="text-[10px] text-[#74777e]">
                            {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : "Recent"}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Weather & Flood Correlation Panel */}
                <div className="bg-white border border-[#E7DED2] rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-xs text-[#001d36] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base">water_drop</span>
                      Weather Correlation
                    </h3>
                    <button
                      onClick={handleRunWeatherRisk}
                      disabled={analyzingWeather}
                      className="bg-[#001d36] text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#17324d] transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {analyzingWeather ? "Checking..." : "Check Weather"}
                    </button>
                  </div>

                  {weatherAnalysis ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="bg-[#FAF7F2] border border-[#E7DED2] p-3 rounded-lg">
                        <div className="text-[#74777e] text-[10px]">Precipitation</div>
                        <div className="text-sm font-semibold text-[#001d36]">{weatherAnalysis.weather?.precipitation ?? 0} mm/h</div>
                      </div>
                      <div className="bg-[#FAF7F2] border border-[#E7DED2] p-3 rounded-lg">
                        <div className="text-[#74777e] text-[10px]">Wind Speed</div>
                        <div className="text-sm font-semibold text-[#001d36]">{weatherAnalysis.weather?.windSpeed ?? 0} km/h</div>
                      </div>
                      <div className="bg-[#FAF7F2] border border-[#E7DED2] p-3 rounded-lg">
                        <div className="text-[#74777e] text-[10px]">River Discharge</div>
                        <div className="text-sm font-semibold text-[#001d36]">{weatherAnalysis.flood?.riverDischarge ?? 0} m³/s</div>
                      </div>
                      <div className="bg-[#FAF7F2] border border-[#E7DED2] p-3 rounded-lg">
                        <div className="text-[#74777e] text-[10px]">Correlation</div>
                        <div className="text-sm font-semibold text-green-700">
                          {Math.round((weatherAnalysis.correlation?.score || 0) * 100)}% ({weatherAnalysis.correlation?.relevance || "moderate"})
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-[#74777e]">
                      Click "Check Weather" to correlate coordinates with real-time precipitation, wind, and river telemetry.
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column: Recommendations */}
              <div className="lg:col-span-4 space-y-5">
                <div className="bg-white border border-[#E7DED2] rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-xs text-[#001d36] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">health_and_safety</span>
                    Recommended Actions
                  </h3>

                  <div className="space-y-2.5">
                    <div className="p-3 bg-red-50/60 border border-red-200 rounded-lg text-xs space-y-0.5">
                      <p className="font-semibold text-[#001d36]">Dispatch First Responders</p>
                      <p className="text-[11px] text-[#74777e]">Coordinate emergency units to {incLocation}.</p>
                    </div>

                    <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-xs space-y-0.5">
                      <p className="font-semibold text-[#001d36]">Monitor Weather Signals</p>
                      <p className="text-[11px] text-[#74777e]">Continuous radar & river basin telemetry tracking.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Verification Tab */
            <div className="bg-white border border-[#E7DED2] rounded-lg p-5 space-y-5 max-w-4xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-[#001d36]">
                    Incident Verification
                  </h3>
                  <p className="text-xs text-[#74777e] mt-0.5">
                    Evaluates multi-source evidence, geographic consistency, and cross-checks telemetry signals.
                  </p>
                </div>
                <button
                  onClick={handleRunAiVerify}
                  disabled={verifyingAI}
                  className="bg-[#001d36] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#17324d] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {verifyingAI ? "Verifying..." : "Run Verification"}
                </button>
              </div>

              {aiVerification ? (
                <div className="space-y-3.5 text-xs">
                  <div className="p-4 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-[#001d36]">
                        Status: {(aiVerification.verificationStatus || "corroborated").toUpperCase()}
                      </span>
                      <span className="font-semibold text-green-700">
                        {Math.round((aiVerification.confidence || 0.8) * 100)}% Confidence
                      </span>
                    </div>
                    <p className="text-xs text-[#43474d] leading-relaxed">{aiVerification.reasoning || aiVerification.summary}</p>
                    <div className="text-[10px] text-[#74777e]">Source: {aiVerification.analysisSource}</div>
                  </div>

                  {Array.isArray(aiVerification.confidenceFactors) && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-xs text-[#001d36]">Confidence Factors Breakdown:</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {aiVerification.confidenceFactors.map((f, i) => (
                          <div key={i} className="p-2.5 bg-white border border-[#E7DED2] rounded-lg">
                            <div className="flex justify-between font-medium text-[#001d36]">
                              <span>{f.factor}</span>
                              <span>{Math.round(f.score * 100)}%</span>
                            </div>
                            <div className="text-[10px] text-[#74777e] mt-0.5">{f.detail}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-center text-xs text-[#74777e]">
                  Click "Run Verification" to cross-reference reports and evaluate confidence.
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
