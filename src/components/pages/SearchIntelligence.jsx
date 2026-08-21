import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidebar } from '../common/Sidebar'
import { Header } from '../common/Header'
import { VerificationBadge } from '../common/VerificationBadge'
import { SeverityBadge } from '../common/SeverityBadge'
import { ConfidenceIndicator } from '../common/ConfidenceIndicator'
import { formatRelativeTime, checkRegionMatch, normalizeVerificationStatus } from '../../utils/intelligenceUtils'
import { searchIntelligence } from '../../services/searchService'

export const SearchIntelligence = () => {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)

  // Filter States
  const [disasterType, setDisasterType] = useState("All")
  const [severity, setSeverity] = useState("All")
  const [verification, setVerification] = useState("All")
  const [region, setRegion] = useState("Global")
  const [minConfidence, setMinConfidence] = useState("0")
  const [timeFilter, setTimeFilter] = useState("All")

  const suggestedSearches = [
    "Flash flood",
    "Earthquake magnitude",
    "Wildfire smoke",
    "Dam breach",
    "Cyclone surge",
    "Gas leak evacuation"
  ]

  const executeSearch = async (textQuery, filters = {}) => {
    const q = textQuery !== undefined ? textQuery : query
    if (!q.trim() && filters.disasterType === "All" && filters.severity === "All") {
      return
    }

    setSearching(true)
    setSearched(true)
    try {
      const minConfVal = Number(filters.minConfidence ?? minConfidence) / 100
      const searchResults = await searchIntelligence(q, {
        disasterType: filters.disasterType ?? disasterType,
        severity: filters.severity ?? severity,
        minConfidence: minConfVal > 0 ? minConfVal : undefined,
      })
      setResults(searchResults || [])
    } catch (error) {
      console.error("Search execution error:", error)
    } finally {
      setSearching(false)
    }
  }

  const handleSearchSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault()
    executeSearch(query)
  }

  // Client-side refinement for filters not handled on server (e.g. region, verification, time)
  const filteredResults = results.filter((item) => {
    // 1. Verification filter
    if (verification !== "All") {
      const normV = normalizeVerificationStatus(item)
      if (normV !== verification) return false
    }

    // 2. Region filter
    if (region !== "Global") {
      const mockInc = {
        location: item.location,
        title: item.title,
        description: item.snippet,
      }
      if (!checkRegionMatch(mockInc, region)) return false
    }

    // 3. Disaster Type filter
    if (disasterType !== "All") {
      const dt = (item.disasterType || "").toLowerCase()
      if (!dt.includes(disasterType.toLowerCase())) return false
    }

    // 4. Severity filter
    if (severity !== "All") {
      const sev = (item.severity || "").toLowerCase()
      if (sev !== severity.toLowerCase()) return false
    }

    // 5. Confidence threshold filter
    if (Number(minConfidence) > 0) {
      if ((item.confidence || 0) < Number(minConfidence)) return false
    }

    return true
  })

  return (
    <div className="bg-[#F7F3EC] text-[#1c1c18] font-sans flex h-screen overflow-hidden antialiased">
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-[260px] min-h-screen relative overflow-hidden">
        <Header title="Search Intelligence Archive" />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">

          {/* Search Box & Controls */}
          <div className="bg-white border border-[#E7DED2] rounded-xl p-5 md:p-6 space-y-4 max-w-4xl mx-auto shadow-xs">
            <div>
              <h2 className="text-base font-bold text-[#001d36] uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-[#001d36]">manage_search</span>
                Multi-Source Intelligence Search
              </h2>
              <p className="text-xs text-[#74777e] mt-0.5">
                Search verified incidents, unstructured stream reports, and historical records across all providers.
              </p>
            </div>

            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search keywords, locations, event IDs, hazards, or affected infrastructure..."
                className="w-full bg-[#FAF7F2] border border-[#E7DED2] rounded-lg py-3 pl-11 pr-28 text-xs text-[#001d36] focus:outline-none focus:border-[#001d36] shadow-xs"
              />
              <span className="material-symbols-outlined absolute left-3.5 top-3 text-[#74777e] text-lg">search</span>
              <button 
                type="submit"
                disabled={searching}
                className="absolute right-2 top-2 bg-[#001d36] text-white px-4 py-1.5 rounded-md text-xs font-semibold hover:bg-[#17324d] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
              >
                {searching ? "Searching..." : "Search"}
              </button>
            </form>

            {/* STEP 6: Multi-Dimensional Filter Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-[#E7DED2] text-xs">
              {/* Type */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#74777e]">Disaster Type</label>
                <select
                  value={disasterType}
                  onChange={(e) => {
                    setDisasterType(e.target.value)
                    if (query.trim()) executeSearch(query, { disasterType: e.target.value })
                  }}
                  className="w-full bg-[#F7F3EC] border border-[#E7DED2] rounded px-2 py-1 text-xs text-[#001d36] focus:outline-none cursor-pointer"
                >
                  <option value="All">All Types</option>
                  <option value="flood">Flood</option>
                  <option value="earthquake">Earthquake</option>
                  <option value="wildfire">Wildfire</option>
                  <option value="cyclone">Cyclone / Storm</option>
                  <option value="landslide">Landslide</option>
                  <option value="drought">Drought</option>
                </select>
              </div>

              {/* Severity */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#74777e]">Severity</label>
                <select
                  value={severity}
                  onChange={(e) => {
                    setSeverity(e.target.value)
                    if (query.trim()) executeSearch(query, { severity: e.target.value })
                  }}
                  className="w-full bg-[#F7F3EC] border border-[#E7DED2] rounded px-2 py-1 text-xs text-[#001d36] focus:outline-none cursor-pointer"
                >
                  <option value="All">All Levels</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Verification */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#74777e]">Verification</label>
                <select
                  value={verification}
                  onChange={(e) => setVerification(e.target.value)}
                  className="w-full bg-[#F7F3EC] border border-[#E7DED2] rounded px-2 py-1 text-xs text-[#001d36] focus:outline-none cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="VERIFIED">✓ Verified</option>
                  <option value="CORROBORATED">◎ Corroborated</option>
                  <option value="UNVERIFIED">? Unverified</option>
                </select>
              </div>

              {/* Region */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#74777e]">Region</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full bg-[#F7F3EC] border border-[#E7DED2] rounded px-2 py-1 text-xs text-[#001d36] focus:outline-none cursor-pointer"
                >
                  <option value="Global">Global</option>
                  <option value="Asia">Asia Pacific</option>
                  <option value="Europe">Europe</option>
                  <option value="Americas">Americas</option>
                  <option value="Africa">Africa</option>
                </select>
              </div>

              {/* Confidence Threshold */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#74777e]">Min Confidence</label>
                <select
                  value={minConfidence}
                  onChange={(e) => {
                    setMinConfidence(e.target.value)
                    if (query.trim()) executeSearch(query, { minConfidence: e.target.value })
                  }}
                  className="w-full bg-[#F7F3EC] border border-[#E7DED2] rounded px-2 py-1 text-xs text-[#001d36] focus:outline-none cursor-pointer"
                >
                  <option value="0">Any Confidence</option>
                  <option value="60">&gt; 60%</option>
                  <option value="75">&gt; 75%</option>
                  <option value="90">&gt; 90%</option>
                </select>
              </div>

              {/* Time Window */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#74777e]">Time Window</label>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="w-full bg-[#F7F3EC] border border-[#E7DED2] rounded px-2 py-1 text-xs text-[#001d36] focus:outline-none cursor-pointer"
                >
                  <option value="All">All Time</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="3d">Last 3 Days</option>
                  <option value="7d">Last 7 Days</option>
                </select>
              </div>
            </div>

            {/* Quick Search Suggestions */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-medium text-[#74777e]">Suggested Queries:</span>
              {suggestedSearches.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(s)
                    executeSearch(s)
                  }}
                  className="bg-[#F7F3EC] border border-[#E7DED2] text-[11px] font-medium text-[#43474d] px-2.5 py-0.5 rounded hover:border-[#74777e] hover:bg-white transition-colors cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Search Results Display */}
          <div className="bg-white border border-[#E7DED2] rounded-xl p-5 space-y-4 max-w-4xl mx-auto shadow-sm">
            <div className="flex justify-between items-center border-b border-[#E7DED2] pb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#001d36]">Search Results</h3>
                <span className="text-xs font-mono text-[#74777e]">
                  ({filteredResults.length} {filteredResults.length === 1 ? 'match' : 'matches'})
                </span>
              </div>
              {searched && (
                <button
                  onClick={() => {
                    setQuery("")
                    setResults([])
                    setSearched(false)
                    setDisasterType("All")
                    setSeverity("All")
                    setVerification("All")
                    setRegion("Global")
                    setMinConfidence("0")
                  }}
                  className="text-xs text-red-600 hover:underline cursor-pointer"
                >
                  Clear Results
                </button>
              )}
            </div>

            {searching ? (
              <div className="py-12 text-center text-xs text-[#74777e] flex items-center justify-center gap-2">
                <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                Searching multi-collection intelligence index...
              </div>
            ) : searched && filteredResults.length === 0 ? (
              <div className="text-center py-10 text-xs text-[#74777e] space-y-1">
                <span className="material-symbols-outlined text-3xl text-slate-400">search_off</span>
                <div className="font-semibold text-slate-700">No matching records found for "{query}".</div>
                <p className="text-[11px]">Try adjusting the keywords or widening the filter criteria.</p>
              </div>
            ) : filteredResults.length > 0 ? (
              <div className="space-y-3">
                {filteredResults.map((res, idx) => {
                  const isIncident = res.type === "Incident Report" || !res.type?.includes("Stream")
                  const rawTime = res.timestamp?.toDate ? res.timestamp.toDate() : res.timestamp
                  const timeLabel = formatRelativeTime(rawTime)

                  return (
                    <div 
                      key={res.id || idx} 
                      onClick={() => {
                        if (res.id) {
                          navigate(`/admin/incident/${res.id}`)
                        }
                      }}
                      className="p-4 border border-[#E7DED2] rounded-xl bg-[#FAF7F2] hover:bg-white hover:border-[#001d36] transition-all space-y-2.5 cursor-pointer group shadow-2xs"
                    >
                      {/* Top Row: Type, Severity, Verification, Confidence */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[#001d36] bg-white border border-[#E7DED2] px-2 py-0.5 rounded">
                            {res.disasterType || res.type || "Report"}
                          </span>
                          {res.severity && (
                            <SeverityBadge severity={res.severity} size="xs" />
                          )}
                          <VerificationBadge incident={res} size="xs" />
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <ConfidenceIndicator value={res.confidence} />
                          <span className="font-mono text-[10px] text-slate-500">{timeLabel}</span>
                        </div>
                      </div>

                      {/* Middle: Title & Snippet */}
                      <div>
                        <h4 className="font-bold text-xs text-[#001d36] group-hover:text-blue-900 group-hover:underline">
                          {res.title}
                        </h4>
                        <p className="text-xs text-[#43474d] leading-relaxed mt-0.5 line-clamp-2">
                          {res.snippet}
                        </p>
                      </div>

                      {/* Bottom: Provenance & Action Link */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#E7DED2]/60 text-[11px] text-[#74777e]">
                        <div className="flex items-center gap-3">
                          <span>Source: <b className="text-[#001d36]">{res.source || "Sensor / Agency"}</b></span>
                          {res.sourceCount && (
                            <span>Corroboration: <b>{res.sourceCount} Sources</b></span>
                          )}
                        </div>

                        <span className="font-semibold text-blue-700 group-hover:underline flex items-center gap-0.5 text-xs">
                          <span>Inspect Record</span>
                          <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-[#74777e] space-y-1">
                <span className="material-symbols-outlined text-3xl text-slate-300">manage_search</span>
                <p>Enter search keywords or select filters to query the multi-source disaster database.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default SearchIntelligence
