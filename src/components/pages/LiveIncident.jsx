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
      unsubscribe = listenToIncidents((res) => {
        const incidents = res.incidents || []
        if (incidents.length > 0) {
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
    const newStatus = newVerified ? "OFFICIALLY_CONFIRMED" : "UNVERIFIED"
    try {
      await updateIncident(incident.id, {
        verified: newVerified,
        status: newVerified ? "verified" : "investigating",
        verificationStatus: newStatus,
      })
      setIncident((prev) => ({
        ...prev,
        verified: newVerified,
        status: newVerified ? "verified" : "investigating",
        verificationStatus: newStatus,
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
      const lat = Number(incident.location?.latitude ?? 0)
      const lon = Number(incident.location?.longitude ?? 0)
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
        sources: incident.evidence || [{ sourceType: incident.source || "authoritative_feed", text: incident.title }],
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

  if (loading) {
    return (
      <div className="bg-[#F7F3EC] text-[#1c1c18] font-sans flex h-screen overflow-hidden antialiased">
        <Sidebar />
        <div className="flex-1 flex flex-col lg:ml-[260px] min-h-screen relative overflow-hidden">
          <Header title="Incident Details" />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-xs text-[#74777e] flex items-center gap-2">
              <span className="material-symbols-outlined animate-spin">sync</span>
              Loading live incident record...
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!incident) {
    return (
      <div className="bg-[#F7F3EC] text-[#1c1c18] font-sans flex h-screen overflow-hidden antialiased">
        <Sidebar />
        <div className="flex-1 flex flex-col lg:ml-[260px] min-h-screen relative overflow-hidden">
          <Header title="Incident Details" />
          <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-3">
            <div className="text-sm font-bold text-[#001d36]">Incident Not Found</div>
            <p className="text-xs text-[#74777e]">No active live incident record matches this selection.</p>
            <button
              onClick={() => navigate("/admin")}
              className="bg-[#001d36] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[#17324d] cursor-pointer"
            >
              Return to Live Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  const incTitle = incident.title || "Live Disaster Incident"
  const incSeverity = (incident.severity || "medium").toLowerCase()
  const lat = Number(incident.location?.latitude ?? 0)
  const lon = Number(incident.location?.longitude ?? 0)
  const incLocation = incident.location?.address || `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`
  const incDesc = incident.description || "Authoritative disaster feed update."
  const isVerified = incident.verified || incident.verificationStatus === "OFFICIALLY_CONFIRMED" || incident.verificationStatus === "verified"
  const verificationStatus = incident.verificationStatus || (isVerified ? "OFFICIALLY_CONFIRMED" : "UNVERIFIED")

  const confidencePct = incident.confidencePercent ?? (incident.confidence !== null && incident.confidence !== undefined ? Math.round(Number(incident.confidence) <= 1 ? Number(incident.confidence) * 100 : Number(incident.confidence)) : null)
  const officialUrl = incident.source_url || incident.sourceUrl || ""
  const sourceUpdatedAt = incident.source_updated_at || incident.timestamp || null
  const retrievedAt = incident.ingested_at || incident.last_seen_at || null

  const evidenceList = Array.isArray(incident.evidence) && incident.evidence.length > 0
    ? incident.evidence
    : [
        {
          source: incident.source || "GDACS",
          source_event_id: incident.source_event_id || incident.id,
          source_url: officialUrl,
          source_timestamp: sourceUpdatedAt,
          retrieved_at: retrievedAt,
          relationship: "Primary Authoritative Alert Feed",
          confidence: incident.confidence || 0.9,
        },
      ]

  const confidenceFactors = incident.confidenceFactors || []

  return (
    <div className="bg-[#F7F3EC] text-[#1c1c18] font-sans flex h-screen overflow-hidden antialiased">
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-[260px] min-h-screen relative overflow-hidden">
        <Header title="Incident Details" />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          {/* Incident Header Card */}
          <div className="bg-white border border-[#E7DED2] rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                  incSeverity === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                  incSeverity === 'high' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-slate-50 text-slate-700 border-slate-200'
                }`}>
                  {incSeverity}
                </span>

                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                  verificationStatus === "OFFICIALLY_CONFIRMED" ? "bg-green-50 text-green-800 border-green-200" :
                  verificationStatus === "CORROBORATED" ? "bg-blue-50 text-blue-800 border-blue-200" :
                  "bg-amber-50 text-amber-800 border-amber-200"
                }`}>
                  {verificationStatus}
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
                  {confidencePct !== null ? `${confidencePct}%` : "Not calculated"}
                </div>
              </div>

              {officialUrl && (
                <a
                  href={officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>View Official Source</span>
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </a>
              )}

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

          {/* Authoritative Source Provenance Card (Requirement 13) */}
          <div className="bg-white border border-[#E7DED2] rounded-xl p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#001d36] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-[#001d36]">verified</span>
              Live Source Data Provenance
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div className="bg-[#FAF7F2] border border-[#E7DED2] p-2.5 rounded-lg">
                <div className="text-[10px] text-[#74777e]">Primary Source</div>
                <div className="font-bold text-[#001d36] truncate">{incident.source || "GDACS"}</div>
              </div>

              <div className="bg-[#FAF7F2] border border-[#E7DED2] p-2.5 rounded-lg">
                <div className="text-[10px] text-[#74777e]">Source Event ID</div>
                <div className="font-mono font-bold text-[#001d36] truncate">{incident.source_event_id || incident.id}</div>
              </div>

              <div className="bg-[#FAF7F2] border border-[#E7DED2] p-2.5 rounded-lg">
                <div className="text-[10px] text-[#74777e]">Event Occurrence (event_time)</div>
                <div className="font-mono text-[11px] font-bold text-[#001d36] truncate">
                  {incident.event_time ? new Date(incident.event_time).toUTCString().replace("GMT", "UTC") : "Recent"}
                </div>
              </div>

              <div className="bg-[#FAF7F2] border border-[#E7DED2] p-2.5 rounded-lg">
                <div className="text-[10px] text-[#74777e]">Last Source Update</div>
                <div className="font-mono text-[11px] text-slate-700 truncate">
                  {sourceUpdatedAt ? new Date(sourceUpdatedAt).toUTCString().replace("GMT", "UTC") : "Recent"}
                </div>
              </div>

              <div className="bg-[#FAF7F2] border border-[#E7DED2] p-2.5 rounded-lg">
                <div className="text-[10px] text-[#74777e]">Retrieved by DisasterLens</div>
                <div className="font-mono text-[11px] text-slate-700 truncate">
                  {retrievedAt ? new Date(retrievedAt).toUTCString().replace("GMT", "UTC") : "Live"}
                </div>
              </div>

              <div className="bg-[#FAF7F2] border border-[#E7DED2] p-2.5 rounded-lg">
                <div className="text-[10px] text-[#74777e]">Source Status</div>
                <div className="font-bold text-green-700 truncate">{incident.source_status || "CURRENT"}</div>
              </div>
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
              Evidence & Telemetry ({evidenceList.length})
            </button>
            <button
              onClick={() => setActiveTab("ai_verify")}
              className={`pb-2.5 text-xs font-semibold transition-colors border-b-2 cursor-pointer ${
                activeTab === "ai_verify"
                  ? "border-[#001d36] text-[#001d36]"
                  : "border-transparent text-[#74777e] hover:text-[#001d36]"
              }`}
            >
              Confidence Breakdown & AI Verification
            </button>
          </div>

          {/* Main Grid Content */}
          {activeTab === "overview" ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: Authentic Evidence Records */}
              <div className="lg:col-span-8 space-y-5">
                <div className="bg-white border border-[#E7DED2] rounded-xl p-4 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-xs text-[#001d36] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base">layers</span>
                      Corroborating Evidence Sources ({evidenceList.length})
                    </h3>
                  </div>

                  <div className="space-y-2.5">
                    {evidenceList.map((ev, idx) => {
                      const srcName = ev.source || ev.sourceType || "Authoritative Feed"
                      const evConf = ev.confidence !== null && ev.confidence !== undefined
                        ? Math.round(Number(ev.confidence) <= 1 ? Number(ev.confidence) * 100 : Number(ev.confidence))
                        : 90

                      return (
                        <div key={idx} className="border border-[#E7DED2] rounded-lg p-3 bg-[#FAF7F2] space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#001d36]">{srcName}</span>
                              <span className="text-[11px] font-mono text-[#74777e]">ID: {ev.source_event_id || ev.sourceId || "Primary"}</span>
                            </div>
                            <span className="text-[11px] font-semibold text-green-800 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                              {evConf}% confidence
                            </span>
                          </div>

                          <p className="text-xs text-[#43474d]">
                            Relationship: <span className="font-medium">{ev.relationship || "Authoritative disaster feed update"}</span>
                          </p>

                          <div className="flex flex-wrap items-center justify-between text-[11px] text-[#74777e] pt-1.5 border-t border-[#E7DED2]">
                            <span>Source Timestamp: {ev.source_timestamp ? new Date(ev.source_timestamp).toUTCString() : "Recent"}</span>
                            {ev.source_url && (
                              <a
                                href={ev.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline font-semibold flex items-center gap-0.5"
                              >
                                <span>Official Source Link</span>
                                <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                              </a>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Weather & Flood Correlation Panel */}
                <div className="bg-white border border-[#E7DED2] rounded-xl p-4 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-xs text-[#001d36] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base">water_drop</span>
                      Real-Time Open-Meteo Telemetry Correlation
                    </h3>
                    <button
                      onClick={handleRunWeatherRisk}
                      disabled={analyzingWeather}
                      className="bg-[#001d36] text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#17324d] transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {analyzingWeather ? "Checking..." : "Query Telemetry"}
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
                        <div className="text-[#74777e] text-[10px]">Telemetry Alignment</div>
                        <div className="text-sm font-semibold text-green-700">
                          {Math.round((weatherAnalysis.correlation?.score || 0) * 100)}% ({weatherAnalysis.correlation?.relevance || "moderate"})
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-[#74777e]">
                      Click "Query Telemetry" to cross-reference incident coordinates ({lat.toFixed(2)}°, {lon.toFixed(2)}°) with live weather & flood metrics.
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column: Recommendations */}
              <div className="lg:col-span-4 space-y-5">
                <div className="bg-white border border-[#E7DED2] rounded-xl p-4 space-y-3 shadow-sm">
                  <h3 className="font-semibold text-xs text-[#001d36] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">health_and_safety</span>
                    Operational Directives
                  </h3>

                  <div className="space-y-2.5">
                    <div className="p-3 bg-red-50/60 border border-red-200 rounded-lg text-xs space-y-0.5">
                      <p className="font-semibold text-[#001d36]">First Responder Dispatch</p>
                      <p className="text-[11px] text-[#74777e]">Coordinate emergency units to {incLocation}.</p>
                    </div>

                    <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-xs space-y-0.5">
                      <p className="font-semibold text-[#001d36]">Continuous Feed Monitoring</p>
                      <p className="text-[11px] text-[#74777e]">Maintain active sync cycle with {incident.source || "GDACS"}.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* AI Verification & Confidence Factors Tab */
            <div className="bg-white border border-[#E7DED2] rounded-xl p-5 space-y-5 max-w-4xl shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-[#001d36]">
                    Explainable Confidence & Verification Factors
                  </h3>
                  <p className="text-xs text-[#74777e] mt-0.5">
                    Every score is derived from source reliability, multi-source corroboration, sensor cross-reference, and spatial-temporal alignment.
                  </p>
                </div>
                <button
                  onClick={handleRunAiVerify}
                  disabled={verifyingAI}
                  className="bg-[#001d36] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#17324d] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {verifyingAI ? "Evaluating..." : "Run AI Verification"}
                </button>
              </div>

              {/* Confidence Factors Grid */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-[#001d36]">Confidence Factors Breakdown</h4>
                {confidenceFactors.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {confidenceFactors.map((f, i) => (
                      <div key={i} className="p-3 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg space-y-1">
                        <div className="flex justify-between font-bold text-xs text-[#001d36]">
                          <span>{f.factor}</span>
                          <span className="text-green-800">+{f.contributionPercent || Math.round(f.score * 100)}%</span>
                        </div>
                        <p className="text-[11px] text-[#74777e]">{f.detail}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#74777e]">
                    {incident.confidenceExplanation || `Calculated confidence: ${confidencePct !== null ? `${confidencePct}%` : "Not calculated"} based on authoritative feed validation.`}
                  </p>
                )}
              </div>

              {/* AI Verification Results */}
              {aiVerification && (
                <div className="p-4 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#001d36]">
                      AI Status: {(aiVerification.verificationStatus || "corroborated").toUpperCase()}
                    </span>
                    <span className="font-bold text-green-700">
                      {Math.round((aiVerification.confidence || 0.85) * 100)}% Overall Confidence
                    </span>
                  </div>
                  <p className="text-xs text-[#43474d] leading-relaxed">{aiVerification.reasoning || aiVerification.summary}</p>
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
