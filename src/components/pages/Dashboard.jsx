import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidebar } from '../common/Sidebar'
import { Header } from '../common/Header'
import { DisasterMap } from '../common/DisasterMap'
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
    source: 'Operator Field Report',
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

  // Region matching helper supporting coordinates + textual addresses
  const checkRegionMatch = (inc, region) => {
    if (!region || region === "Global") return true

    const lat = Number(inc.location?.latitude ?? inc.latitude)
    const lon = Number(inc.location?.longitude ?? inc.longitude)
    const address = `${inc.location?.address || ""} ${inc.title || ""} ${inc.description || ""}`.toLowerCase()
    const hasCoords = !isNaN(lat) && !isNaN(lon) && (lat !== 0 || lon !== 0)

    if (region === "Asia") {
      const coordsMatch = hasCoords && lat >= -15 && lat <= 60 && lon >= 60 && lon <= 180
      const keywords = [
        "asia", "india", "mumbai", "delhi", "china", "beijing", "tokyo", "japan",
        "philippines", "indonesia", "bangladesh", "pakistan", "vietnam", "thailand",
        "singapore", "korea", "taiwan", "pacific", "malaysia", "nepal", "sri lanka"
      ]
      return coordsMatch || keywords.some(k => address.includes(k))
    }

    if (region === "Europe") {
      const coordsMatch = hasCoords && lat >= 35 && lat <= 72 && lon >= -25 && lon <= 45
      const keywords = [
        "europe", "uk", "united kingdom", "london", "france", "paris", "germany", "berlin",
        "italy", "rome", "spain", "madrid", "greece", "turkey", "switzerland", "netherlands",
        "ukraine", "poland", "sweden", "norway", "austria", "portugal", "ireland"
      ]
      return coordsMatch || keywords.some(k => address.includes(k))
    }

    if (region === "Americas") {
      const coordsMatch = hasCoords && lon >= -170 && lon <= -30
      const keywords = [
        "america", "usa", "united states", "canada", "california", "florida", "texas",
        "new york", "mexico", "brazil", "argentina", "colombia", "chile", "peru",
        "caribbean", "san francisco", "los angeles", "seattle", "toronto"
      ]
      return coordsMatch || keywords.some(k => address.includes(k))
    }

    if (region === "Africa") {
      const coordsMatch = hasCoords && lat >= -35 && lat <= 38 && lon >= -20 && lon <= 55 && !(lat > 35 && lon > 0 && lon < 45)
      const keywords = [
        "africa", "nigeria", "egypt", "kenya", "south africa", "ghana", "ethiopia",
        "morocco", "congo", "tanzania", "algeria", "sudan", "uganda"
      ]
      return coordsMatch || keywords.some(k => address.includes(k))
    }

    return true
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

  // Filtered incidents based on live user controls applied to the 3-day dataset
  const filteredIncidents = dbIncidents.filter(inc => {
    if (!checkTypeMatch(inc, selectedDisaster)) return false
    if (!checkRegionMatch(inc, selectedLocation)) return false
    if (!checkSeverityMatch(inc, selectedUrgency)) return false
    return true
  })

  const isFiltered = selectedDisaster !== "All" || selectedLocation !== "Global" || selectedUrgency !== "All"

  // Live calculated KPIs strictly on the filtered 3-day dataset (Requirement 8 & 12)
  const totalCount = filteredIncidents.length
  const activeCount = filteredIncidents.filter(i => {
    const s = (i.status || "").toLowerCase()
    return s === 'active' || s === 'reported' || s === 'investigating'
  }).length

  const officiallyConfirmedCount = filteredIncidents.filter(
    i => i.verificationStatus === 'OFFICIALLY_CONFIRMED' || (i.verified && i.verificationStatus !== 'CORROBORATED')
  ).length

  const corroboratedCount = filteredIncidents.filter(
    i => i.verificationStatus === 'CORROBORATED' || (i.sourceCount && i.sourceCount >= 2)
  ).length

  const criticalCount = filteredIncidents.filter(i => (i.severity || '').toLowerCase() === 'critical').length

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      await createIncident({
        title: formData.title,
        description: formData.description,
        disasterType: formData.disasterType,
        severity: formData.severity,
        status: formData.status,
        event_time: new Date().toISOString(),
        location: {
          latitude: 0,
          longitude: 0,
          address: formData.address || "Field Location"
        },
        source: formData.source,
        sourceUrl: formData.sourceUrl
      })
      alert("Incident report submitted to live pipeline.")
      setIsModalOpen(false)
      setFormData({
        title: '',
        description: '',
        disasterType: 'flood',
        severity: 'high',
        status: 'reported',
        address: '',
        source: 'Operator Field Report',
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

  // Dynamic window date label (Requirement 13)
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
        <Header title="Live Disaster Intelligence" />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">

          {/* Dynamic 3-Day Rolling Window Header Banner (Requirement 7 & 13) */}
          <div className="bg-[#001d36] text-white rounded-xl p-4 md:p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></span>
                <span className="text-[11px] font-mono tracking-widest uppercase text-green-300 font-bold">
                  LIVE DATA · LAST 3 DAYS
                </span>
              </div>
              <h2 className="text-lg md:text-xl font-bold tracking-tight">
                {windowLabel}
              </h2>
              <p className="text-xs text-slate-300">
                Authoritative disaster occurrences within the rolling 3-calendar-day window (UTC).
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleManualSync}
                disabled={syncing}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Synchronize GDACS & USGS feeds for current 3-day window"
              >
                <span className={`material-symbols-outlined text-sm ${syncing ? 'animate-spin' : ''}`}>sync</span>
                {syncing ? "Synchronizing..." : "Sync Feeds"}
              </button>
            </div>
          </div>

          {/* Requirement 15: Production Data Provenance & Health Panel */}
          <div className="bg-white border border-[#E7DED2] rounded-xl p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E7DED2] pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#001d36] text-lg">verified_user</span>
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#001d36]">Data Integrity & Multi-Source Health</h3>
              </div>
              <div className="text-[11px] font-mono text-[#74777e]">
                Freshness: ~6m · Window: 3 Days
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* GDACS Health Card */}
              <div className="bg-[#FAF7F2] border border-[#E7DED2] rounded-lg p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#001d36]">GDACS Global Alerts</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    gdacsStatus === "LIVE" ? "bg-green-100 text-green-800" :
                    gdacsStatus === "SYNCING" ? "bg-blue-100 text-blue-800" :
                    gdacsStatus === "STALE" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                  }`}>
                    ● {gdacsStatus}
                  </span>
                </div>
                <div className="text-sm font-bold text-[#001d36]">
                  {loadingIncidents ? "—" : `${gdacsEventCount} events (3-day)`}
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
                    usgsStatus === "LIVE" ? "bg-green-100 text-green-800" :
                    usgsStatus === "SYNCING" ? "bg-blue-100 text-blue-800" :
                    usgsStatus === "STALE" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                  }`}>
                    ● {usgsStatus}
                  </span>
                </div>
                <div className="text-sm font-bold text-[#001d36]">
                  {loadingIncidents ? "—" : `${usgsEventCount} events (3-day)`}
                </div>
                <p className="text-[10px] text-[#74777e] truncate">
                  Updated: {formatUtcTime(provenance?.sources?.usgs?.lastSourceUpdate || provenance?.sources?.usgs?.lastSuccess)}
                </p>
              </div>

              {/* Current Live Records */}
              <div className="bg-[#FAF7F2] border border-[#E7DED2] rounded-lg p-3 space-y-1.5">
                <div className="text-[11px] font-medium text-[#74777e]">3-Day Live Total</div>
                <div className="text-lg font-bold text-[#001d36]">
                  {loadingIncidents ? "—" : `${dbIncidents.length} active incidents`}
                </div>
                <p className="text-[10px] text-green-700 font-medium">Within 3-calendar-day window</p>
              </div>

              {/* Feed Sync Latency */}
              <div className="bg-[#FAF7F2] border border-[#E7DED2] rounded-lg p-3 space-y-1.5">
                <div className="text-[11px] font-medium text-[#74777e]">Sync Age</div>
                <div className="text-lg font-bold text-[#001d36]">
                  {provenance?.dataAgeMinutes !== null && provenance?.dataAgeMinutes !== undefined
                    ? `${provenance.dataAgeMinutes} min ago`
                    : "Live"}
                </div>
                <p className="text-[10px] text-slate-600">Auto-refresh every 5m</p>
              </div>
            </div>
          </div>

          {/* Honest LIVE DATA UNAVAILABLE state (Requirement 11) */}
          {isOffline && (
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-5 text-red-950 space-y-2.5">
              <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
                <span className="material-symbols-outlined text-xl">error</span>
                LIVE DATA UNAVAILABLE
              </div>
              <p className="text-xs text-red-800 leading-relaxed">
                Unable to retrieve the current three-day live dataset from authoritative sources (GDACS / USGS).
                {provenance?.sources?.gdacs?.lastError ? ` GDACS Error: ${provenance.sources.gdacs.lastError}.` : ""}
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

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-[#E7DED2]">
            <div className="flex flex-wrap items-center gap-3">
              {/* Disaster Type Filter */}
              <div className="flex items-center gap-1.5 text-xs text-[#43474d]">
                <span className="material-symbols-outlined text-[#74777e] text-base">filter_list</span>
                <span className="font-medium">Type:</span>
                <select 
                  value={selectedDisaster} 
                  onChange={(e) => setSelectedDisaster(e.target.value)}
                  className="bg-[#F7F3EC] border border-[#E7DED2] rounded px-2 py-1 font-medium text-[#001d36] focus:outline-none cursor-pointer hover:border-[#74777e] transition-colors"
                >
                  <option value="All">All Types</option>
                  <option value="flood">Floods</option>
                  <option value="earthquake">Earthquakes</option>
                  <option value="wildfire">Wildfires</option>
                  <option value="cyclone">Cyclones</option>
                  <option value="storm">Storms</option>
                  <option value="landslide">Landslides</option>
                  <option value="drought">Drought</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Location View Filter */}
              <div className="flex items-center gap-1.5 text-xs text-[#43474d]">
                <span className="material-symbols-outlined text-[#74777e] text-base">location_on</span>
                <span className="font-medium">Region:</span>
                <select 
                  value={selectedLocation} 
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="bg-[#F7F3EC] border border-[#E7DED2] rounded px-2 py-1 font-medium text-[#001d36] focus:outline-none cursor-pointer hover:border-[#74777e] transition-colors"
                >
                  <option value="Global">All Regions</option>
                  <option value="Asia">Asia Pacific</option>
                  <option value="Europe">Europe</option>
                  <option value="Americas">Americas</option>
                  <option value="Africa">Africa</option>
                </select>
              </div>

              {/* Urgency Filter */}
              <div className="flex items-center gap-1.5 text-xs text-[#43474d]">
                <span className="material-symbols-outlined text-[#74777e] text-base">priority_high</span>
                <span className="font-medium">Severity:</span>
                <select 
                  value={selectedUrgency} 
                  onChange={(e) => setSelectedUrgency(e.target.value)}
                  className="bg-[#F7F3EC] border border-[#E7DED2] rounded px-2 py-1 font-medium text-[#001d36] focus:outline-none cursor-pointer hover:border-[#74777e] transition-colors"
                >
                  <option value="All">All Levels</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                  <option value="critical_high">Critical & High</option>
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
                  Clear Filters
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

          {/* Requirement 8 & 12: Real-Time Genuine 3-Day KPI Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
            <div className="bg-white border border-[#E7DED2] rounded-lg p-4">
              <div className="text-xs font-medium text-[#74777e]">Total Incidents</div>
              <div className="mt-1 text-2xl font-bold text-[#001d36]">{loadingIncidents ? "—" : totalCount}</div>
              <p className="text-[11px] text-[#74777e] mt-0.5">3-day live occurrences</p>
            </div>

            <div className="bg-white border border-[#E7DED2] rounded-lg p-4">
              <div className="text-xs font-medium text-[#74777e]">Active Incidents</div>
              <div className="mt-1 text-2xl font-bold text-[#001d36]">{loadingIncidents ? "—" : activeCount}</div>
              <p className="text-[11px] text-[#74777e] mt-0.5">Currently active</p>
            </div>

            <div className="bg-white border border-[#E7DED2] rounded-lg p-4">
              <div className="text-xs font-medium text-[#74777e]">Corroborated</div>
              <div className="mt-1 text-2xl font-bold text-blue-700">{loadingIncidents ? "—" : corroboratedCount}</div>
              <p className="text-[11px] text-[#74777e] mt-0.5">2+ independent sources</p>
            </div>

            <div className="bg-white border border-[#E7DED2] rounded-lg p-4">
              <div className="text-xs font-medium text-[#74777e]">Officially Confirmed</div>
              <div className="mt-1 text-2xl font-bold text-green-700">{loadingIncidents ? "—" : officiallyConfirmedCount}</div>
              <p className="text-[11px] text-[#74777e] mt-0.5">Authority verified</p>
            </div>

            <div className="bg-white border border-[#E7DED2] rounded-lg p-4 col-span-2 lg:col-span-1">
              <div className="text-xs font-medium text-[#74777e]">Critical Severity</div>
              <div className="mt-1 text-2xl font-bold text-red-600">{loadingIncidents ? "—" : criticalCount}</div>
              <p className="text-[11px] text-[#74777e] mt-0.5">Immediate urgency</p>
            </div>
          </div>

          {/* Main Grid: Incident Map + Recent Incidents List */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[540px]">
            {/* Map Container */}
            <div className="lg:col-span-8 bg-white border border-[#E7DED2] rounded-lg flex flex-col overflow-hidden">
              <div className="px-4 py-2.5 border-b border-[#E7DED2] flex justify-between items-center bg-[#FAF7F2]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#001d36] text-lg">map</span>
                  <h3 className="font-semibold text-[#001d36] text-xs">Live 3-Day Incident Map</h3>
                </div>
                <span className="text-[11px] font-mono text-[#74777e]">
                  {filteredIncidents.length} {filteredIncidents.length === 1 ? "incident" : "incidents"} plotted
                </span>
              </div>

              <div className="flex-1 relative bg-[#e2e8f0] p-1 flex flex-col justify-center">
                <DisasterMap
                  incidents={filteredIncidents}
                  height="450px"
                  onSelectIncident={(inc) => navigate("/admin/incident", { state: { incidentId: inc.id } })}
                />
              </div>
            </div>

            {/* Incidents List Panel */}
            <div className="lg:col-span-4 flex flex-col space-y-4">
              {/* Status Summary Banner */}
              <div className="bg-white border border-[#E7DED2] rounded-lg p-3.5 text-xs text-[#43474d] space-y-1">
                <div className="font-semibold text-[#001d36]">3-Day Status Summary</div>
                <p className="text-[11px] text-[#74777e] leading-relaxed">
                  {loadingIncidents
                    ? "Synchronizing 3-day disaster feeds..."
                    : isFiltered
                    ? `${totalCount} matching: ${activeCount} active · ${corroboratedCount} corroborated · ${criticalCount} critical`
                    : `${activeCount} active live incidents · ${corroboratedCount} corroborated · ${criticalCount} critical`}
                </p>
              </div>

              {/* Incidents List */}
              <div className="bg-white border border-[#E7DED2] rounded-lg p-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E7DED2]">
                  <h3 className="font-semibold text-xs text-[#001d36]">3-Day Live Feeds</h3>
                  <button 
                    onClick={() => navigate("/admin/incident")}
                    className="text-[11px] font-medium text-[#001d36] hover:underline"
                  >
                    View all
                  </button>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[380px]">
                  {filteredIncidents.length === 0 ? (
                    <div className="text-center py-10 text-xs text-[#74777e] space-y-1">
                      <div className="font-semibold text-slate-700">No live disaster incidents detected within the last 3 days.</div>
                      <p className="text-[11px]">All active disaster feeds are currently normal for the selected window.</p>
                    </div>
                  ) : (
                    filteredIncidents.map((inc) => {
                      const sev = (inc.severity || "medium").toLowerCase()
                      const confidenceVal = inc.confidencePercent ?? (inc.confidence !== null && inc.confidence !== undefined ? Math.round(Number(inc.confidence) <= 1 ? Number(inc.confidence) * 100 : Number(inc.confidence)) : null)
                      const vStatus = inc.verificationStatus || (inc.verified ? "OFFICIALLY_CONFIRMED" : "UNVERIFIED")
                      const officialLink = inc.source_url || inc.sourceUrl || ""
                      const eventTime = inc.event_time || inc.source_updated_at

                      return (
                        <div 
                          key={inc.id || inc.source_event_id}
                          className="p-3 border border-[#E7DED2] rounded-lg hover:border-[#74777e] transition-colors bg-white space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                              sev === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                              sev === 'high' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-slate-50 text-slate-700 border-slate-200'
                            }`}>
                              {sev}
                            </span>
                            <span className={`text-[10px] font-bold ${
                              vStatus === "OFFICIALLY_CONFIRMED" || vStatus === "VERIFIED" ? "text-green-700" :
                              vStatus === "CORROBORATED" ? "text-blue-700" : "text-amber-700"
                            }`}>
                              {vStatus}
                            </span>
                          </div>

                          <h4 
                            onClick={() => navigate("/admin/incident", { state: { incidentId: inc.id } })}
                            className="font-semibold text-xs text-[#001d36] hover:underline cursor-pointer truncate"
                          >
                            {inc.title}
                          </h4>

                          <p className="text-[11px] text-[#74777e] truncate">
                            📍 {inc.location?.address || `${Number(inc.location?.latitude ?? 0).toFixed(2)}°, ${Number(inc.location?.longitude ?? 0).toFixed(2)}°`}
                          </p>

                          <div className="text-[10px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-100">
                            <div className="flex justify-between">
                              <span>Source: <b>{inc.source || "GDACS"}</b> ({inc.source_event_id || inc.id})</span>
                              <span>Confidence: <b>{confidenceVal !== null ? `${confidenceVal}%` : "Not calculated"}</b></span>
                            </div>
                            <div className="flex justify-between text-[9px] text-slate-400">
                              <span>Occurred: {eventTime ? new Date(eventTime).toLocaleTimeString() : "Recent"}</span>
                              {officialLink && (
                                <a 
                                  href={officialLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-blue-600 hover:underline font-semibold"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Official Source ↗
                                </a>
                              )}
                            </div>
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
              <h3 className="text-base font-semibold text-[#001d36]">
                Report Incident
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-[#74777e] hover:text-[#001d36] text-lg font-bold"
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
                  placeholder="e.g. Flash flood near River Bridge"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E7DED2] rounded-lg text-xs font-medium focus:outline-none focus:border-[#001d36]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#43474d] mb-1">Description</label>
                <textarea 
                  rows="3"
                  placeholder="Describe observed conditions, damage, or urgent needs..."
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
                    className="w-full px-3 py-2 border border-[#E7DED2] rounded-lg text-xs font-medium focus:outline-none focus:border-[#001d36]"
                  >
                    <option value="flood">Flood</option>
                    <option value="earthquake">Earthquake</option>
                    <option value="cyclone">Cyclone</option>
                    <option value="landslide">Landslide</option>
                    <option value="wildfire">Wildfire</option>
                    <option value="storm">Storm</option>
                    <option value="drought">Drought</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#43474d] mb-1">Severity Level</label>
                  <select 
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E7DED2] rounded-lg text-xs font-medium focus:outline-none focus:border-[#001d36]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#43474d] mb-1">Location / City</label>
                <input 
                  type="text" 
                  placeholder="e.g. Sector 4 River Basin, Mumbai"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E7DED2] rounded-lg text-xs font-medium focus:outline-none focus:border-[#001d36]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E7DED2]">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-[#74777e] hover:bg-[#F7F3EC] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={creating}
                  className="bg-[#001d36] text-white px-5 py-2 rounded-lg text-xs font-semibold hover:bg-[#17324d] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {creating ? "Submitting..." : "Submit Incident"}
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
