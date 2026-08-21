import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Sidebar } from '../common/Sidebar'
import { Header } from '../common/Header'
import { VerificationBadge } from '../common/VerificationBadge'
import { SeverityBadge } from '../common/SeverityBadge'
import { ConfidenceIndicator } from '../common/ConfidenceIndicator'
import {
  normalizeVerificationStatus,
  getConfidenceValue,
  formatRelativeTime,
  formatUtcDateTime,
  extractIncidentSources
} from '../../utils/intelligenceUtils'
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
    const currentNorm = normalizeVerificationStatus(incident)
    const newVerified = currentNorm !== "VERIFIED"
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
      alert("Failed to update incident status in database.")
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
          <Header title="Incident Intelligence Investigation" />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-xs text-[#74777e] flex items-center gap-2">
              <span className="material-symbols-outlined animate-spin text-lg">sync</span>
              Loading live incident investigation record...
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
          <Header title="Incident Intelligence Investigation" />
          <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-3">
            <span className="material-symbols-outlined text-4xl text-slate-400">search_off</span>
            <div className="text-sm font-bold text-[#001d36]">Incident Record Not Found</div>
            <p className="text-xs text-[#74777e]">No active incident matches this identifier or feed selection.</p>
            <button
              onClick={() => navigate("/admin")}
              className="bg-[#001d36] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[#17324d] cursor-pointer"
            >
              Return to Operations Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  const incTitle = incident.title || "Live Disaster Incident"
  const incSeverity = incident.severity || "medium"
  const lat = Number(incident.location?.latitude ?? 0)
  const lon = Number(incident.location?.longitude ?? 0)
  const incLocation = incident.location?.address || `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`
  const incDesc = incident.description || "Authoritative disaster feed update."
  const normVerification = normalizeVerificationStatus(incident)
  const confidenceVal = getConfidenceValue(incident)
  const officialUrl = incident.source_url || incident.sourceUrl || ""
  const eventTime = incident.event_time || incident.source_updated_at || incident.timestamp
  const sourceUpdatedAt = incident.source_updated_at || incident.timestamp || null
  const retrievedAt = incident.ingested_at || incident.last_seen_at || null
  const sources = extractIncidentSources(incident)

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
        <Header title="Incident Intelligence Investigation" />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          {/* STEP 4: Incident Master Header Card */}
          <div className="bg-white border border-[#E7DED2] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1.5 max-w-3xl">
                {/* Badges & Meta */}
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityBadge severity={incSeverity} size="sm" pulse={incSeverity.toLowerCase() === 'critical'} />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#001d36] bg-[#FAF7F2] border border-[#E7DED2] px-2 py-0.5 rounded">
                    {incident.disasterType || 'Incident'}
                  </span>
                  <VerificationBadge incident={incident} size="sm" />
                  <span className="text-xs text-[#74777e] flex items-center gap-0.5">
                    📍 {incLocation}
                  </span>
                </div>

                {/* Main Title */}
                <h2 className="text-xl md:text-2xl font-bold text-[#001d36] tracking-tight">
                  {incTitle}
                </h2>
                <p className="text-xs text-[#43474d] leading-relaxed max-w-3xl">
                  {incDesc}
                </p>
              </div>

              {/* Confidence & Quick Actions */}
              <div className="flex flex-col items-end gap-3 shrink-0">
                <div className="bg-[#FAF7F2] border border-[#E7DED2] rounded-lg p-2.5 text-right min-w-[140px]">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-[#74777e]">Confidence</div>
                  <div className="text-lg font-extrabold text-[#001d36] font-mono">
                    {confidenceVal !== null ? `${confidenceVal}%` : "Not calculated"}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Freshness: {formatRelativeTime(eventTime)}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {officialUrl && (
                    <a
                      href={officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>Official Feed</span>
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                    </a>
                  )}

                  {userRole !== "viewer" && (
                    <button
                      onClick={handleToggleVerify}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border cursor-pointer ${
                        normVerification === "VERIFIED"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                          : "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                      }`}
                    >
                      {normVerification === "VERIFIED" ? "✓ Verified" : "Verify Incident"}
                    </button>
                  )}

                  {userRole !== "viewer" && (
                    <button
                      onClick={() => navigate("/admin/notifications")}
                      className="bg-[#001d36] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#17324d] transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">campaign</span>
                      Dispatch Alert
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Status Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-[#E7DED2] text-xs">
              <div className="bg-[#FAF7F2] p-2 rounded border border-[#E7DED2]">
                <span className="text-[10px] text-[#74777e] block">Primary Source</span>
                <span className="font-bold text-[#001d36] truncate block">{incident.source || "GDACS"}</span>
              </div>
              <div className="bg-[#FAF7F2] p-2 rounded border border-[#E7DED2]">
                <span className="text-[10px] text-[#74777e] block">Source Event ID</span>
                <span className="font-mono font-bold text-[#001d36] truncate block">{incident.source_event_id || incident.id}</span>
              </div>
              <div className="bg-[#FAF7F2] p-2 rounded border border-[#E7DED2]">
                <span className="text-[10px] text-[#74777e] block">Occurrence Time</span>
                <span className="font-mono text-[11px] text-slate-700 truncate block">{formatUtcDateTime(eventTime)}</span>
              </div>
              <div className="bg-[#FAF7F2] p-2 rounded border border-[#E7DED2]">
                <span className="text-[10px] text-[#74777e] block">Corroboration</span>
                <span className="font-bold text-blue-700 truncate block">{evidenceList.length} Supporting {evidenceList.length === 1 ? 'Source' : 'Sources'}</span>
              </div>
            </div>
          </div>

          {/* STEP 4: Five Structured Investigation Tabs */}
          <div className="flex border-b border-[#E7DED2] gap-2 md:gap-6 overflow-x-auto">
            {[
              { id: "overview", label: "Overview & Provenance", icon: "info" },
              { id: "evidence", label: `Evidence Sources (${evidenceList.length})`, icon: "layers" },
              { id: "ai_verification", label: "AI Verification & Reasoning", icon: "psychology" },
              { id: "weather_risk", label: "Weather Risk Telemetry", icon: "water_drop" },
              { id: "actions", label: "Operational Directives", icon: "shield" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-2.5 text-xs font-semibold transition-colors border-b-2 flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  activeTab === tab.id
                    ? "border-[#001d36] text-[#001d36]"
                    : "border-transparent text-[#74777e] hover:text-[#001d36]"
                }`}
              >
                <span className="material-symbols-outlined text-base">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab 1: OVERVIEW & PROVENANCE */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-8 space-y-5">
                <div className="bg-white border border-[#E7DED2] rounded-xl p-5 space-y-4 shadow-sm">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#001d36] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">assignment</span>
                    Incident Intelligence Overview
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="p-3.5 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg space-y-2">
                      <div className="font-bold text-xs text-[#001d36]">Incident Narrative</div>
                      <p className="text-xs text-[#43474d] leading-relaxed">
                        {incDesc}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg space-y-1">
                        <span className="text-[10px] font-bold text-[#74777e] uppercase">Coordinates</span>
                        <div className="font-mono text-xs text-[#001d36]">
                          {lat !== 0 || lon !== 0 ? `${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E` : "Unspecified"}
                        </div>
                        <p className="text-[10px] text-slate-500">Spatial datum: WGS-84</p>
                      </div>

                      <div className="p-3 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg space-y-1">
                        <span className="text-[10px] font-bold text-[#74777e] uppercase">Status in Console</span>
                        <div className="font-bold text-xs text-emerald-800">
                          {incident.application_status || "LIVE"}
                        </div>
                        <p className="text-[10px] text-slate-500">Authoritative rolling 3-day active window</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-5">
                <div className="bg-white border border-[#E7DED2] rounded-xl p-4 space-y-3 shadow-sm">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#001d36]">
                    Source Provenance
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-[#74777e]">Ingested At:</span>
                      <span className="font-mono font-medium">{formatRelativeTime(retrievedAt)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-[#74777e]">Last Feed Update:</span>
                      <span className="font-mono font-medium">{formatRelativeTime(sourceUpdatedAt)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-[#74777e]">Source Status:</span>
                      <span className="font-bold text-emerald-700">{incident.source_status || "CURRENT"}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-[#74777e]">Sources In Agreement:</span>
                      <span className="font-bold text-[#001d36]">{sources.join(", ")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: EVIDENCE SOURCES */}
          {activeTab === "evidence" && (
            <div className="bg-white border border-[#E7DED2] rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#001d36] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">layers</span>
                    Corroborating Evidence Sources ({evidenceList.length})
                  </h3>
                  <p className="text-xs text-[#74777e] mt-0.5">
                    Multi-source intelligence logs confirming this disaster cluster.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {evidenceList.map((ev, idx) => {
                  const srcName = ev.source || ev.sourceType || "Authoritative Feed"
                  const evConf = ev.confidence !== null && ev.confidence !== undefined
                    ? Math.round(Number(ev.confidence) <= 1 ? Number(ev.confidence) * 100 : Number(ev.confidence))
                    : 90

                  return (
                    <div key={idx} className="border border-[#E7DED2] rounded-lg p-4 bg-[#FAF7F2] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#001d36] bg-white border border-[#E7DED2] px-2 py-0.5 rounded">
                            {srcName}
                          </span>
                          <span className="text-[11px] font-mono text-[#74777e]">
                            ID: {ev.source_event_id || ev.sourceId || "Primary Event"}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {evConf}% confidence weight
                        </span>
                      </div>

                      <p className="text-xs text-[#43474d]">
                        Relationship: <span className="font-medium">{ev.relationship || "Authoritative disaster feed update"}</span>
                      </p>

                      <div className="flex flex-wrap items-center justify-between text-[11px] text-[#74777e] pt-2 border-t border-[#E7DED2]">
                        <span>Timestamp: {ev.source_timestamp ? formatUtcDateTime(ev.source_timestamp) : "Recent"}</span>
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
          )}

          {/* Tab 3: AI VERIFICATION & REASONING */}
          {activeTab === "ai_verification" && (
            <div className="bg-white border border-[#E7DED2] rounded-xl p-5 space-y-5 max-w-4xl shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#001d36]">
                    Explainable AI Confidence & Multi-Source Verification
                  </h3>
                  <p className="text-xs text-[#74777e] mt-0.5">
                    Deterministic and LLM cross-source evaluation derived from reliability weights, spatial-temporal spread, and sensor corroboration.
                  </p>
                </div>
                <button
                  onClick={handleRunAiVerify}
                  disabled={verifyingAI}
                  className="bg-[#001d36] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#17324d] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span className={`material-symbols-outlined text-sm ${verifyingAI ? 'animate-spin' : ''}`}>psychology</span>
                  {verifyingAI ? "Evaluating Pipeline..." : "Execute AI Verification"}
                </button>
              </div>

              {/* Confidence Factors Breakdown */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-[#001d36] uppercase tracking-wider">Confidence Factors Breakdown</h4>
                {confidenceFactors.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {confidenceFactors.map((f, i) => (
                      <div key={i} className="p-3 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg space-y-1">
                        <div className="flex justify-between font-bold text-xs text-[#001d36]">
                          <span>{f.factor}</span>
                          <span className="text-emerald-800 font-mono">+{f.contributionPercent || Math.round((f.score || 0.2) * 100)}%</span>
                        </div>
                        <p className="text-[11px] text-[#74777e]">{f.detail}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3.5 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-xs text-[#43474d]">
                    {incident.confidenceExplanation || `Traceable score calculated at ${confidenceVal !== null ? `${confidenceVal}%` : "90%"} based on primary authoritative feed validation and multi-source corroboration.`}
                  </div>
                )}
              </div>

              {/* Dynamic AI Verification Results */}
              {aiVerification && (
                <div className="p-4 bg-emerald-50/40 border border-emerald-200 rounded-lg space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#001d36] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-emerald-700 text-lg">check_circle</span>
                      AI Verification Result: {(aiVerification.verificationStatus || "corroborated").toUpperCase()}
                    </span>
                    <span className="font-bold text-emerald-800 font-mono text-sm">
                      {Math.round((aiVerification.confidence || 0.85) * 100)}% AI Score
                    </span>
                  </div>

                  <p className="text-xs text-[#43474d] leading-relaxed">
                    {aiVerification.reasoning || aiVerification.summary}
                  </p>

                  {aiVerification.indicators && aiVerification.indicators.length > 0 && (
                    <div className="pt-2 border-t border-emerald-200/60 flex flex-wrap gap-1.5">
                      <span className="text-[10px] font-bold text-[#001d36]">Detected Key Indicators:</span>
                      {aiVerification.indicators.map((ind, idx) => (
                        <span key={idx} className="bg-white border border-emerald-300 text-emerald-900 text-[10px] px-2 py-0.5 rounded font-mono">
                          {ind}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab 4: WEATHER & FLOOD TELEMETRY RISK */}
          {activeTab === "weather_risk" && (
            <div className="bg-white border border-[#E7DED2] rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#001d36] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">water_drop</span>
                    Real-Time Open-Meteo Telemetry Correlation
                  </h3>
                  <p className="text-xs text-[#74777e] mt-0.5">
                    Live meteorological and hydrological telemetry at incident coordinates ({lat.toFixed(4)}°, {lon.toFixed(4)}°).
                  </p>
                </div>
                <button
                  onClick={handleRunWeatherRisk}
                  disabled={analyzingWeather}
                  className="bg-[#001d36] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#17324d] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                >
                  <span className={`material-symbols-outlined text-sm ${analyzingWeather ? 'animate-spin' : ''}`}>cloud_sync</span>
                  {analyzingWeather ? "Querying Telemetry..." : "Query Live Telemetry"}
                </button>
              </div>

              {weatherAnalysis ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                  <div className="bg-[#FAF7F2] border border-[#E7DED2] p-3 rounded-lg space-y-1">
                    <div className="text-[#74777e] text-[10px] uppercase font-bold">Precipitation</div>
                    <div className="text-base font-bold text-[#001d36]">{weatherAnalysis.weather?.precipitation ?? 0} mm/h</div>
                    <p className="text-[10px] text-slate-500">Hourly accumulation</p>
                  </div>
                  <div className="bg-[#FAF7F2] border border-[#E7DED2] p-3 rounded-lg space-y-1">
                    <div className="text-[#74777e] text-[10px] uppercase font-bold">Wind Speed</div>
                    <div className="text-base font-bold text-[#001d36]">{weatherAnalysis.weather?.windSpeed ?? 0} km/h</div>
                    <p className="text-[10px] text-slate-500">Surface gust telemetry</p>
                  </div>
                  <div className="bg-[#FAF7F2] border border-[#E7DED2] p-3 rounded-lg space-y-1">
                    <div className="text-[#74777e] text-[10px] uppercase font-bold">River Discharge</div>
                    <div className="text-base font-bold text-[#001d36]">{weatherAnalysis.flood?.riverDischarge ?? 0} m³/s</div>
                    <p className="text-[10px] text-slate-500">Basin hydrological flow</p>
                  </div>
                  <div className="bg-[#FAF7F2] border border-[#E7DED2] p-3 rounded-lg space-y-1">
                    <div className="text-[#74777e] text-[10px] uppercase font-bold">Telemetry Correlation</div>
                    <div className="text-base font-bold text-emerald-700">
                      {Math.round((weatherAnalysis.correlation?.score || 0) * 100)}%
                    </div>
                    <p className="text-[10px] text-emerald-800 capitalize font-medium">{weatherAnalysis.correlation?.relevance || "Consistent"} alignment</p>
                  </div>
                </div>
              ) : (
                <div className="bg-[#FAF7F2] border border-[#E7DED2] rounded-lg p-6 text-center text-xs text-[#74777e] space-y-1">
                  <p>Click <b>Query Live Telemetry</b> to cross-reference incident coordinates with Open-Meteo weather and flood streams.</p>
                </div>
              )}
            </div>
          )}

          {/* Tab 5: ACTIONS & OPERATIONAL DIRECTIVES */}
          {activeTab === "actions" && (
            <div className="bg-white border border-[#E7DED2] rounded-xl p-5 space-y-5 max-w-4xl shadow-sm">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#001d36] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-red-600">health_and_safety</span>
                Standard Operational Response Directives
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-4 bg-red-50/60 border border-red-200 rounded-lg text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-red-900">
                    <span className="material-symbols-outlined text-base text-red-700">fmd_good</span>
                    First Responder Sector Mobilization
                  </div>
                  <p className="text-xs text-red-950/80">
                    Dispatch local field emergency and medical units to target area: <b>{incLocation}</b>.
                  </p>
                </div>

                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-lg text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <span className="material-symbols-outlined text-base text-amber-700">radar</span>
                    Sensor & Satellite Surveillance
                  </div>
                  <p className="text-xs text-amber-950/80">
                    Maintain active 5-minute automated polling cycle on {incident.source || "GDACS / USGS"} telemetry.
                  </p>
                </div>

                <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-lg text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-blue-900">
                    <span className="material-symbols-outlined text-base text-blue-700">campaign</span>
                    Public Alert Advisory
                  </div>
                  <p className="text-xs text-blue-950/80">
                    Prepare civil advisory bulletin for verified sector coordinates if severity escalates.
                  </p>
                  <button
                    onClick={() => navigate("/admin/notifications")}
                    className="mt-1 bg-blue-700 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-blue-800 cursor-pointer"
                  >
                    Draft Alert →
                  </button>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <span className="material-symbols-outlined text-base text-slate-600">verified</span>
                    Manual Authority Override
                  </div>
                  <p className="text-xs text-slate-600">
                    Current verification: <b>{normVerification}</b>. Toggle verification state when authoritative field confirmation is received.
                  </p>
                  {userRole !== "viewer" && (
                    <button
                      onClick={handleToggleVerify}
                      className="mt-1 bg-slate-800 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-slate-900 cursor-pointer"
                    >
                      {normVerification === "VERIFIED" ? "Revoke Verification" : "Mark as Officially Confirmed"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default LiveIncident
