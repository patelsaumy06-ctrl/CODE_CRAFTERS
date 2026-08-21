import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidebar } from '../common/Sidebar'
import { Header } from '../common/Header'
import { DisasterMap } from '../common/DisasterMap'
import { VerificationBadge } from '../common/VerificationBadge'
import { SeverityBadge } from '../common/SeverityBadge'
import { PriorityBadge } from '../common/PriorityBadge'
import { ConfidenceIndicator } from '../common/ConfidenceIndicator'
import {
  normalizeVerificationStatus,
  sortPriorityIncidents,
  checkRegionMatch,
  getConfidenceValue,
  formatRelativeTime,
  extractIncidentSources,
} from '../../utils/intelligenceUtils'
import { listenToIncidents, createIncident, triggerLiveSync, fetchProvenance } from '../../services/incidentService'
import { useAuth } from '../../context/AuthContext'

export const Dashboard = () => {
  const navigate = useNavigate()
  const { userRole } = useAuth()
  const [selectedDisaster, setSelectedDisaster] = useState("All")
  const [selectedLocation, setSelectedLocation] = useState("Global")
  const [selectedUrgency, setSelectedUrgency] = useState("All")

  const [dbIncidents, setDbIncidents] = useState([])
  const [dateWindow, setDateWindow] = useState(null)
  const [sourcesHealth, setSourcesHealth] = useState({})
  const [provenance, setProvenance] = useState(null)
  const [loadingIncidents, setLoadingIncidents] = useState(true)
  const [apiError, setApiError] = useState(null)
  const [syncing, setSyncing] = useState(false)

  // Incident Creation Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    disasterType: 'flood',
    severity: 'high',
    status: 'reported',
    address: '',
    latitude: '',
    longitude: '',
    source: 'Operator Console Report',
    sourceUrl: ''
  })

  useEffect(() => {
    const unsubscribe = listenToIncidents((res) => {
      if (res.error) {
        setApiError(res.error)
      } else {
        setApiError(null)
        setDbIncidents(res.incidents || [])
        if (res.date_window) setDateWindow(res.date_window)
        if (res.sources_health) setSourcesHealth(res.sources_health)
        if (res.provenance) setProvenance(res.provenance)
      }
      setLoadingIncidents(false)
    }, 3)

    fetchProvenance(3).then((p) => {
      if (p) {
        setProvenance(p)
        if (p.date_window) setDateWindow(p.date_window)
      }
    })

    return () => unsubscribe()
  }, [])

  const handleManualSync = async () => {
    setSyncing(true)
    try {
      const res = await triggerLiveSync(null, 3)
      if (res.data) setDbIncidents(res.data)
      if (res.date_window) setDateWindow(res.date_window)
      if (res.sources_health) setSourcesHealth(res.sources_health)
      if (res.provenance) setProvenance(res.provenance)
      setApiError(null)
    } catch (err) {
      console.error("Live sync failed:", err)
      setApiError("Failed to synchronize with live authoritative feeds.")
    } finally {
      setSyncing(false)
    }
  }

  const checkTypeMatch = (inc, type) => {
    if (!type || type === "All") return true
    const incidentType = (inc.disasterType || "").toLowerCase()
    const target = type.toLowerCase()
    if (target === "cyclone" || target === "storm") {
      return incidentType.includes("cyclone") || incidentType.includes("storm") || incidentType.includes("hurricane") || incidentType.includes("typhoon")
    }
    return incidentType.includes(target)
  }

  const checkSeverityMatch = (inc, severity) => {
    if (!severity || severity === "All") return true
    const incSev = (inc.severity || "").toLowerCase()
    const target = severity.toLowerCase()
    if (target === "critical_high" || target === "critical & high") {
      return incSev === "critical" || incSev === "high"
    }
    return incSev === target
  }

  // Filter incidents across Type, Region, and Severity
  const filteredIncidents = dbIncidents.filter(inc => {
    if (!checkTypeMatch(inc, selectedDisaster)) return false
    if (!checkRegionMatch(inc, selectedLocation)) return false
    if (!checkSeverityMatch(inc, selectedUrgency)) return false
    return true
  })

  // Priority-sorted incidents for the operational queue
  const priorityIncidents = sortPriorityIncidents(filteredIncidents)

  const isFiltered = selectedDisaster !== "All" || selectedLocation !== "Global" || selectedUrgency !== "All"

  // Real data KPI metrics derived strictly from the current filtered dataset
  const totalCount = filteredIncidents.length
  const activeCount = filteredIncidents.filter(i => {
    const s = (i.status || "").toLowerCase()
    return s === 'active' || s === 'reported' || s === 'investigating' || !s
  }).length

  const criticalAndHighCount = filteredIncidents.filter(i => {
    const s = (i.severity || '').toLowerCase()
    return s === 'critical' || s === 'high'
  }).length

  const unverifiedCount = filteredIncidents.filter(i => normalizeVerificationStatus(i) === 'UNVERIFIED').length
  const corroboratedCount = filteredIncidents.filter(i => normalizeVerificationStatus(i) === 'CORROBORATED').length
  const verifiedCount = filteredIncidents.filter(i => normalizeVerificationStatus(i) === 'VERIFIED').length

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    setCreating(true)

    const latNum = formData.latitude !== '' ? Number(formData.latitude) : 0
    const lonNum = formData.longitude !== '' ? Number(formData.longitude) : 0

    try {
      await createIncident({
        title: formData.title,
        description: formData.description,
        disasterType: formData.disasterType,
        severity: formData.severity,
        status: formData.status,
        event_time: new Date().toISOString(),
        location: {
          latitude: !isNaN(latNum) ? latNum : 0,
          longitude: !isNaN(lonNum) ? lonNum : 0,
          address: formData.address || "Field Reported Location"
        },
        source: formData.source || "Operator Field Report",
        sourceUrl: formData.sourceUrl
      })
      setIsModalOpen(false)
      setFormData({
        title: '',
        description: '',
        disasterType: 'flood',
        severity: 'high',
        status: 'reported',
        address: '',
        latitude: '',
        longitude: '',
        source: 'Operator Console Report',
        sourceUrl: ''
      })
      handleManualSync()
    } catch (error) {
      console.error("Error creating incident:", error)
      alert("Failed to submit incident: " + (error.message || "Permission denied"))
    } finally {
      setCreating(false)
    }
  }

  const formatUtcDateShort = (isoString) => {
    if (!isoString) return ""
    try {
      const d = new Date(isoString)
      if (isNaN(d.getTime())) return ""
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`
    } catch {
      return ""
    }
  }

  const formatUtcTime = (isoString) => {
    if (!isoString) return "Pending sync"
    try {
      const d = new Date(isoString)
      return isNaN(d.getTime()) ? "Invalid date" : d.toUTCString().replace("GMT", "UTC")
    } catch {
      return "Invalid date"
    }
  }

  const windowStartFormatted = dateWindow?.start ? formatUtcDateShort(dateWindow.start) : formatUtcDateShort(new Date(Date.now() - 2 * 86400000))
  const windowEndFormatted = dateWindow?.end ? formatUtcDateShort(dateWindow.end) : formatUtcDateShort(new Date())
  const windowLabel = `${windowStartFormatted} — ${windowEndFormatted}`

  const gdacsStatus = provenance?.sources?.gdacs?.status || sourcesHealth.gdacs?.status || "LIVE"
  const usgsStatus = provenance?.sources?.usgs?.status || sourcesHealth.usgs?.status || "LIVE"
  const isOffline = (gdacsStatus === "OFFLINE" && usgsStatus === "OFFLINE") || Boolean(apiError)

  const gdacsEventCount = sourcesHealth.gdacs?.events ?? provenance?.sources?.gdacs?.eventsInWindow ?? 0
  const usgsEventCount = sourcesHealth.usgs?.events ?? provenance?.sources?.usgs?.eventsInWindow ?? 0

  return (
    <div className="bg-[#F7F3EC] text-[#1c1c18] font-sans flex h-screen overflow-hidden antialiased">
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-[260px] min-h-screen relative overflow-hidden">
        <Header title="Disaster Intelligence Console" />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">

          {/* Operational Intelligence Pipeline Status Banner */}
          <div className="bg-[#001d36] text-white rounded-xl p-4 md:p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[11px] font-mono tracking-widest uppercase text-emerald-300 font-bold">
                  OPERATIONAL INTELLIGENCE PIPELINE · 3-DAY UTC WINDOW
                </span>
              </div>
              <h2 className="text-lg md:text-xl font-bold tracking-tight">
                {windowLabel}
              </h2>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-slate-300 pt-0.5">
                <span className="text-amber-300 font-bold">COLLECT</span>
                <span className="text-slate-500">→</span>
                <span className="text-blue-300 font-bold">CLASSIFY</span>
                <span className="text-slate-500">→</span>
                <span className="text-indigo-300 font-bold">CORROBORATE</span>
                <span className="text-slate-500">→</span>
                <span className="text-emerald-300 font-bold">VERIFY</span>
                <span className="text-slate-500">→</span>
                <span className="text-orange-300 font-bold">PRIORITIZE</span>
                <span className="text-slate-500">→</span>
                <span className="text-red-300 font-bold">ACT</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleManualSync}
                disabled={syncing}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Synchronize GDACS & USGS live external feeds"
              >
                <span className={`material-symbols-outlined text-sm ${syncing ? 'animate-spin' : ''}`}>sync</span>
                {syncing ? "Synchronizing..." : "Sync Feeds"}
              </button>
            </div>
          </div>

          {/* Multi-Source Health & Provenance Panel */}
          <div className="bg-white border border-[#E7DED2] rounded-xl p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E7DED2] pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#001d36] text-lg">verified_user</span>
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#001d36]">Data Provenance & Source Telemetry</h3>
              </div>
              <div className="text-[11px] font-mono text-[#74777e]">
                Live 3-Day Window ({dbIncidents.length} Total Ingested)
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* GDACS Health Card */}
              <div className="bg-[#FAF7F2] border border-[#E7DED2] rounded-lg p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#001d36]">GDACS Global Alerts</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    gdacsStatus === "LIVE" ? "bg-emerald-100 text-emerald-800" :
                    gdacsStatus === "SYNCING" ? "bg-blue-100 text-blue-800" :
                    gdacsStatus === "STALE" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                  }`}>
                    ● {gdacsStatus}
                  </span>
                </div>
                <div className="text-sm font-bold text-[#001d36]">
                  {loadingIncidents ? "—" : `${gdacsEventCount} events`}
                </div>
                <p className="text-[10px] text-[#74777e] truncate">
                  Updated: {formatUtcTime(provenance?.sources?.gdacs?.lastSourceUpdate || provenance?.sources?.gdacs?.lastSuccess)}
                </p>
              </div>

              {/* USGS Health Card */}
              <div className="bg-[#FAF7F2] border border-[#E7DED2] rounded-lg p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#001d36]">USGS Earthquakes</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    usgsStatus === "LIVE" ? "bg-emerald-100 text-emerald-800" :
                    usgsStatus === "SYNCING" ? "bg-blue-100 text-blue-800" :
                    usgsStatus === "STALE" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                  }`}>
                    ● {usgsStatus}
                  </span>
                </div>
                <div className="text-sm font-bold text-[#001d36]">
                  {loadingIncidents ? "—" : `${usgsEventCount} events`}
                </div>
                <p className="text-[10px] text-[#74777e] truncate">
                  Updated: {formatUtcTime(provenance?.sources?.usgs?.lastSourceUpdate || provenance?.sources?.usgs?.lastSuccess)}
                </p>
              </div>

              {/* Open-Meteo Telemetry */}
              <div className="bg-[#FAF7F2] border border-[#E7DED2] rounded-lg p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#001d36]">Open-Meteo Risk</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    ● ON-DEMAND
                  </span>
                </div>
                <div className="text-sm font-bold text-[#001d36]">Weather & Flood</div>
                <p className="text-[10px] text-[#74777e]">Precipitation, wind & discharge</p>
              </div>

              {/* Ingestion Freshness */}
              <div className="bg-[#FAF7F2] border border-[#E7DED2] rounded-lg p-3 space-y-1.5">
                <div className="text-[11px] font-medium text-[#74777e]">Feed Freshness</div>
                <div className="text-sm font-bold text-[#001d36]">
                  {provenance?.dataAgeMinutes !== null && provenance?.dataAgeMinutes !== undefined
                    ? `${provenance.dataAgeMinutes} min ago`
                    : "Continuous Sync"}
                </div>
                <p className="text-[10px] text-slate-600">Auto-polled every 5 minutes</p>
              </div>
            </div>
          </div>

          {/* Live Data Unavailable Alert */}
          {isOffline && (
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-5 text-red-950 space-y-2.5">
              <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
                <span className="material-symbols-outlined text-xl">error</span>
                LIVE FEED UNAVAILABLE
              </div>
              <p className="text-xs text-red-800 leading-relaxed">
                Unable to reach authoritative external feeds.
                {provenance?.sources?.gdacs?.lastError ? ` GDACS: ${provenance.sources.gdacs.lastError}.` : ""}
              </p>
              <div className="text-xs text-red-700 font-mono">
                Last successful synchronization: {formatUtcTime(provenance?.lastSynchronization)}
              </div>
              <div className="pt-2">
                <button
                  onClick={handleManualSync}
                  disabled={syncing}
                  className="bg-red-800 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-900 transition-colors cursor-pointer"
                >
                  {syncing ? "Retrying..." : "Retry Synchronization"}
                </button>
              </div>
            </div>
          )}

          {/* Operational Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-[#E7DED2]">
            <div className="flex flex-wrap items-center gap-3">
              {/* Disaster Type Filter */}
              <div className="flex items-center gap-1.5 text-xs text-[#43474d]">
                <span className="material-symbols-outlined text-[#74777e] text-base">filter_list</span>
                <span className="font-medium">Type:</span>
                <select 
                  value={selectedDisaster} 
                  onChange={(e) => setSelectedDisaster(e.target.value)}
                  className="bg-[#F7F3EC] border border-[#E7DED2] rounded px-2.5 py-1 font-medium text-[#001d36] focus:outline-none cursor-pointer hover:border-[#74777e] transition-colors"
                >
                  <option value="All">All Types</option>
                  <option value="flood">Floods</option>
                  <option value="earthquake">Earthquakes</option>
                  <option value="wildfire">Wildfires</option>
                  <option value="cyclone">Cyclones & Storms</option>
                  <option value="landslide">Landslides</option>
                  <option value="drought">Drought</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Region Filter (Updated with active geographic & keyword filtering) */}
              <div className="flex items-center gap-1.5 text-xs text-[#43474d]">
                <span className="material-symbols-outlined text-[#74777e] text-base">public</span>
                <span className="font-medium">Region:</span>
                <select 
                  value={selectedLocation} 
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="bg-[#F7F3EC] border border-[#E7DED2] rounded px-2.5 py-1 font-medium text-[#001d36] focus:outline-none cursor-pointer hover:border-[#74777e] transition-colors"
                >
                  <option value="Global">All Regions (Global)</option>
                  <option value="Asia">Asia Pacific</option>
                  <option value="Europe">Europe</option>
                  <option value="Americas">Americas</option>
                  <option value="Africa">Africa</option>
                  <option value="Oceania">Oceania</option>
                </select>
              </div>

              {/* Severity Filter */}
              <div className="flex items-center gap-1.5 text-xs text-[#43474d]">
                <span className="material-symbols-outlined text-[#74777e] text-base">priority_high</span>
                <span className="font-medium">Severity:</span>
                <select 
                  value={selectedUrgency} 
                  onChange={(e) => setSelectedUrgency(e.target.value)}
                  className="bg-[#F7F3EC] border border-[#E7DED2] rounded px-2.5 py-1 font-medium text-[#001d36] focus:outline-none cursor-pointer hover:border-[#74777e] transition-colors"
                >
                  <option value="All">All Severity Levels</option>
                  <option value="critical">Critical Only</option>
                  <option value="high">High Only</option>
                  <option value="critical_high">Critical & High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Reset Filter Button */}
              {isFiltered && (
                <button
                  onClick={() => {
                    setSelectedDisaster("All")
                    setSelectedLocation("Global")
                    setSelectedUrgency("All")
                  }}
                  className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-1 rounded transition-colors font-medium cursor-pointer"
                  title="Reset all filters"
                >
                  <span className="material-symbols-outlined text-sm">filter_alt_off</span>
                  Clear Filters ({totalCount} matched)
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {userRole !== "viewer" && (
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-[#001d36] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#17324d] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  Report Incident
                </button>
              )}
            </div>
          </div>

          {/* STEP 2A: Main Operational KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            {/* 1. Active Incidents */}
            <div className="bg-white border border-[#E7DED2] rounded-lg p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#74777e]">Active Incidents</span>
                <span className="material-symbols-outlined text-sm text-[#74777e]">radar</span>
              </div>
              <div className="mt-1 text-2xl font-extrabold text-[#001d36]">
                {loadingIncidents ? "—" : activeCount}
              </div>
              <p className="text-[11px] text-[#74777e] mt-0.5">
                {isFiltered ? `${totalCount} matching filters` : "In 3-day active window"}
              </p>
            </div>

            {/* 2. Critical / High Priority */}
            <div className="bg-white border border-[#E7DED2] rounded-lg p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-red-700">Critical / High Priority</span>
                <span className="material-symbols-outlined text-sm text-red-600">warning</span>
              </div>
              <div className="mt-1 text-2xl font-extrabold text-red-700">
                {loadingIncidents ? "—" : criticalAndHighCount}
              </div>
              <p className="text-[11px] text-red-600/80 mt-0.5">
                Urgent response required
              </p>
            </div>

            {/* 3. ? UNVERIFIED */}
            <div className="bg-white border border-amber-200 rounded-lg p-4 bg-amber-50/20 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-800 flex items-center gap-1">
                  <span className="font-bold">?</span> UNVERIFIED
                </span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                  SINGLE SOURCE
                </span>
              </div>
              <div className="mt-1 text-2xl font-extrabold text-amber-800">
                {loadingIncidents ? "—" : unverifiedCount}
              </div>
              <p className="text-[11px] text-amber-700/80 mt-0.5">
                Awaiting corroboration
              </p>
            </div>

            {/* 4. ◎ CORROBORATED */}
            <div className="bg-white border border-blue-200 rounded-lg p-4 bg-blue-50/20 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-800 flex items-center gap-1">
                  <span className="font-bold">◎</span> CORROBORATED
                </span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded">
                  2+ SOURCES
                </span>
              </div>
              <div className="mt-1 text-2xl font-extrabold text-blue-800">
                {loadingIncidents ? "—" : corroboratedCount}
              </div>
              <p className="text-[11px] text-blue-700/80 mt-0.5">
                Cross-source corroborated
              </p>
            </div>

            {/* 5. ✓ VERIFIED */}
            <div className="bg-white border border-emerald-200 rounded-lg p-4 bg-emerald-50/20 shadow-xs col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1">
                  <span className="font-bold">✓</span> VERIFIED
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                  CONFIRMED
                </span>
              </div>
              <div className="mt-1 text-2xl font-extrabold text-emerald-800">
                {loadingIncidents ? "—" : verifiedCount}
              </div>
              <p className="text-[11px] text-emerald-700/80 mt-0.5">
                Official / sensor verified
              </p>
            </div>
          </div>

          {/* Main Grid: Tactical Incident Map + Priority Incidents Queue */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[560px]">
            {/* Tactical Map Container */}
            <div className="lg:col-span-7 xl:col-span-8 bg-white border border-[#E7DED2] rounded-lg flex flex-col overflow-hidden shadow-sm">
              <div className="px-4 py-2.5 border-b border-[#E7DED2] flex justify-between items-center bg-[#FAF7F2]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#001d36] text-lg">map</span>
                  <h3 className="font-semibold text-[#001d36] text-xs uppercase tracking-wider">Tactical Intelligence Map</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-[#74777e]">
                    {filteredIncidents.length} {filteredIncidents.length === 1 ? "incident plotted" : "incidents plotted"}
                  </span>
                </div>
              </div>

              <div className="flex-1 relative bg-[#e2e8f0] p-1 flex flex-col justify-center min-h-[460px]">
                <DisasterMap
                  incidents={filteredIncidents}
                  height="480px"
                  onSelectIncident={(inc) => navigate(`/admin/incident/${inc.id || inc.source_event_id}`)}
                />
              </div>
            </div>

            {/* STEP 2C & 2D: Priority Incidents Queue */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col space-y-3">
              {/* Queue Header & Counter */}
              <div className="bg-white border border-[#E7DED2] rounded-lg p-3.5 flex items-center justify-between shadow-xs">
                <div>
                  <div className="font-bold text-xs uppercase tracking-wider text-[#001d36] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-red-600">sort</span>
                    Priority Incidents Queue
                  </div>
                  <p className="text-[11px] text-[#74777e] mt-0.5">
                    Sorted by Severity (Critical → High → Med → Low), then Confidence
                  </p>
                </div>
                <button 
                  onClick={() => navigate("/admin/incident")}
                  className="text-xs font-semibold text-[#001d36] hover:underline cursor-pointer"
                >
                  View all
                </button>
              </div>

              {/* Priority Incident Cards List */}
              <div className="bg-white border border-[#E7DED2] rounded-lg p-3 flex-1 flex flex-col shadow-sm">
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[440px] pr-1">
                  {priorityIncidents.length === 0 ? (
                    <div className="text-center py-12 text-xs text-[#74777e] space-y-1.5">
                      <span className="material-symbols-outlined text-2xl text-slate-400">check_circle</span>
                      <div className="font-semibold text-slate-700">No active priority incidents</div>
                      <p className="text-[11px] text-slate-500">
                        {isFiltered ? "No live records match the current filter selection." : "All feeds normal in the selected window."}
                      </p>
                    </div>
                  ) : (
                    priorityIncidents.map((inc) => {
                      const sev = inc.severity || "medium"
                      const eventTime = inc.event_time || inc.source_updated_at || inc.timestamp
                      const relativeTime = formatRelativeTime(eventTime)
                      const sources = extractIncidentSources(inc)
                      const locationStr = inc.location?.address || `${Number(inc.location?.latitude ?? 0).toFixed(2)}°, ${Number(inc.location?.longitude ?? 0).toFixed(2)}°`
                      const evidenceCount = Array.isArray(inc.evidence) && inc.evidence.length > 0
                        ? inc.evidence.length
                        : inc.sourceCount || sources.length

                      return (
                        <div 
                          key={inc.id || inc.source_event_id}
                          onClick={() => navigate(`/admin/incident/${inc.id || inc.source_event_id}`)}
                          className="p-3 border border-[#E7DED2] rounded-lg hover:border-[#001d36] hover:shadow-xs transition-all bg-white cursor-pointer space-y-2 group"
                        >
                          {/* Row 1: Severity, Disaster Type, Priority, Verification Badge */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <SeverityBadge severity={sev} size="xs" />
                              <PriorityBadge priority={inc.priority || "MEDIUM"} size="small" />
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#001d36] bg-[#FAF7F2] border border-[#E7DED2] px-1.5 py-0.5 rounded">
                                {inc.disasterType || 'Incident'}
                              </span>
                            </div>
                            <VerificationBadge incident={inc} size="xs" />
                          </div>

                          {/* Row 2: Title & Location */}
                          <div>
                            <h4 className="font-bold text-xs text-[#001d36] group-hover:text-blue-900 line-clamp-1">
                              {inc.title || "Disaster Event"}
                            </h4>
                            <div className="flex items-center justify-between text-[11px] text-[#74777e] mt-0.5">
                              <span className="truncate max-w-[180px]">📍 {locationStr}</span>
                              <span className="font-mono text-[10px] text-slate-500 shrink-0">{relativeTime}</span>
                            </div>
                          </div>

                          {/* Row 3: Confidence, Evidence Count, Sources */}
                          <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[10px]">
                            <ConfidenceIndicator incident={inc} />
                            
                            <div className="flex items-center gap-1.5 text-[#74777e]">
                              <span className="font-bold text-[#001d36] bg-[#F7F3EC] px-1.5 py-0.5 rounded border border-[#E7DED2]">
                                {evidenceCount} {evidenceCount === 1 ? 'SOURCE' : 'SOURCES'}
                              </span>
                            </div>
                          </div>

                          {/* Row 4: Source Pills & News Count */}
                          <div className="flex flex-wrap items-center gap-1 text-[9px] text-slate-500">
                            {inc.newsEvidenceCount > 0 && (
                              <span className="bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-0.5">
                                📰 {inc.newsEvidenceCount} News
                              </span>
                            )}
                            {sources.slice(0, 3).map((src, i) => (
                              <span key={i} className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-mono">
                                {src}
                              </span>
                            ))}
                            {sources.length > 3 && (
                              <span className="text-slate-400 font-mono">+{sources.length - 3}</span>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Report Incident Modal */}
      {userRole !== "viewer" && isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#001d36]/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E7DED2] rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#E7DED2] pb-3">
              <div>
                <h3 className="text-base font-semibold text-[#001d36]">
                  Report Incident to Live Pipeline
                </h3>
                <p className="text-xs text-[#74777e]">
                  Submit verified or field observations for AI classification & multi-source corroboration.
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-[#74777e] hover:text-[#001d36] text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#43474d] mb-1">Incident Title *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Severe Flash Flood and Submerged Bridge"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E7DED2] rounded-lg text-xs font-medium focus:outline-none focus:border-[#001d36]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#43474d] mb-1">Description / Observed Conditions</label>
                <textarea 
                  rows="3"
                  placeholder="Describe observed hazards, structural damage, water levels, or evacuation needs..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E7DED2] rounded-lg text-xs font-medium focus:outline-none focus:border-[#001d36]"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#43474d] mb-1">Disaster Type</label>
                  <select 
                    value={formData.disasterType}
                    onChange={(e) => setFormData({ ...formData, disasterType: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E7DED2] rounded-lg text-xs font-medium focus:outline-none focus:border-[#001d36] cursor-pointer"
                  >
                    <option value="flood">Flood</option>
                    <option value="earthquake">Earthquake</option>
                    <option value="cyclone">Cyclone / Storm</option>
                    <option value="wildfire">Wildfire</option>
                    <option value="landslide">Landslide</option>
                    <option value="drought">Drought</option>
                    <option value="industrial">Industrial Hazard</option>
                    <option value="infrastructure">Infrastructure Failure</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#43474d] mb-1">Severity Level</label>
                  <select 
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E7DED2] rounded-lg text-xs font-medium focus:outline-none focus:border-[#001d36] cursor-pointer"
                  >
                    <option value="low">Low (Localized)</option>
                    <option value="medium">Medium (Moderate)</option>
                    <option value="high">High (Urgent Threat)</option>
                    <option value="critical">Critical (Immediate Danger)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#43474d] mb-1">Location / Address *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Sector 4, River Embankment, Ahmedabad"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E7DED2] rounded-lg text-xs font-medium focus:outline-none focus:border-[#001d36]"
                />
              </div>

              {/* Real Coordinates Entry (Prevents default/spoofed city coordinates) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#FAF7F2] p-3 rounded-lg border border-[#E7DED2]">
                <div>
                  <label className="block text-[11px] font-medium text-[#43474d] mb-1">
                    Latitude (Optional)
                  </label>
                  <input 
                    type="number" 
                    step="any"
                    placeholder="e.g. 23.0225"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-[#E7DED2] rounded bg-white text-xs font-mono focus:outline-none focus:border-[#001d36]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#43474d] mb-1">
                    Longitude (Optional)
                  </label>
                  <input 
                    type="number" 
                    step="any"
                    placeholder="e.g. 72.5714"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-[#E7DED2] rounded bg-white text-xs font-mono focus:outline-none focus:border-[#001d36]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E7DED2]">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-[#74777e] hover:bg-[#F7F3EC] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={creating}
                  className="bg-[#001d36] text-white px-5 py-2 rounded-lg text-xs font-semibold hover:bg-[#17324d] transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {creating ? "Submitting to Pipeline..." : "Submit Incident"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
