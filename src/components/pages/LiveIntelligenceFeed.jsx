import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidebar } from '../common/Sidebar'
import { Header } from '../common/Header'
import { VerificationBadge } from '../common/VerificationBadge'
import { SeverityBadge } from '../common/SeverityBadge'
import { ConfidenceIndicator } from '../common/ConfidenceIndicator'
import { formatRelativeTime } from '../../utils/intelligenceUtils'
import { listenToIntelligenceFeed, createIntelligenceItem } from '../../services/intelligenceService'
import { useAuth } from '../../context/AuthContext'

export const LiveIntelligenceFeed = () => {
  const navigate = useNavigate()
  const { userRole } = useAuth()
  const [filterSource, setFilterSource] = useState("All")
  const [feedItems, setFeedItems] = useState([])
  const [loading, setLoading] = useState(true)

  // Report Ingestion state
  const [newText, setNewText] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [newSource, setNewSource] = useState('Citizen Stream')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    const unsubscribe = listenToIntelligenceFeed((data) => {
      setFeedItems(data || [])
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handlePostReport = async (e) => {
    e.preventDefault()
    if (!newText.trim()) return
    setPosting(true)
    try {
      await createIntelligenceItem({
        source: newSource,
        handle: "@field_observer",
        text: newText,
        address: newLocation || "Field Observation",
        urgency: "High",
        sentiment: "Field Report",
        confidence: 90
      })
      setNewText('')
      setNewLocation('')
      alert("Report submitted to live intelligence pipeline for classification.")
    } catch (e) {
      console.error("Error posting intelligence item:", e)
      alert("Failed to submit report.")
    } finally {
      setPosting(false)
    }
  }

  const filteredItems = feedItems.filter(item => {
    if (filterSource === "All") return true
    const src = (item.source || "").toLowerCase()
    if (filterSource === "Citizen") return src.includes("citizen") || src.includes("field") || src.includes("social")
    if (filterSource === "Sensors") return src.includes("sensor") || src.includes("noaa") || src.includes("telemetry") || src.includes("usgs")
    if (filterSource === "News") return src.includes("news") || src.includes("gdelt") || src.includes("reliefweb") || src.includes("gdacs")
    return true
  })

  return (
    <div className="bg-[#F7F3EC] text-[#1c1c18] font-sans flex h-screen overflow-hidden antialiased">
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-[260px] min-h-screen relative overflow-hidden">
        <Header title="Live Intelligence Stream" />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">

          {/* Operational Pipeline Intro */}
          <div className="bg-white border border-[#E7DED2] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#001d36] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-blue-600">rss_feed</span>
                Incoming Multi-Source Intelligence Stream
              </h2>
              <p className="text-xs text-[#74777e] mt-0.5">
                Normalized raw feeds from GDACS, USGS, GDELT, sensors, and citizen observations ingested for AI clustering and corroboration.
              </p>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-[#74777e]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{feedItems.length} stream events recorded</span>
            </div>
          </div>

          {/* Report Ingestion Form */}
          {userRole !== "viewer" && (
            <div className="bg-white border border-[#E7DED2] rounded-xl p-4 space-y-3 shadow-xs">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#001d36] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">add_circle</span>
                Submit Field Intelligence Observation
              </h3>
              
              <form onSubmit={handlePostReport} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-6">
                  <input 
                    type="text" 
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder="Describe observed conditions, hazards, or structural damage..."
                    className="w-full border border-[#E7DED2] rounded-lg px-3 py-2 text-xs focus:border-[#001d36] focus:outline-none bg-[#FAF7F2]"
                    required
                  />
                </div>
                <div className="sm:col-span-3">
                  <input 
                    type="text" 
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Location / Sector..."
                    className="w-full border border-[#E7DED2] rounded-lg px-3 py-2 text-xs focus:border-[#001d36] focus:outline-none bg-[#FAF7F2]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <select 
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    className="w-full border border-[#E7DED2] rounded-lg px-2.5 py-2 text-xs focus:border-[#001d36] focus:outline-none cursor-pointer bg-[#FAF7F2]"
                  >
                    <option value="Citizen Stream">Citizen Report</option>
                    <option value="Drone Recon">Aerial Drone Recon</option>
                    <option value="Field Reporter">Field Observer</option>
                    <option value="Sensor Alert">Sensor Alert</option>
                  </select>
                </div>
                <div className="sm:col-span-1">
                  <button 
                    type="submit" 
                    disabled={posting}
                    className="w-full bg-[#001d36] text-white py-2 rounded-lg text-xs font-semibold hover:bg-[#17324d] transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {posting ? "..." : "Submit"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Source Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-[#E7DED2]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[#74777e]">Filter Source:</span>
              {[
                { id: "All", label: "All Streams" },
                { id: "Citizen", label: "Citizen & Field" },
                { id: "Sensors", label: "Sensors & Telemetry" },
                { id: "News", label: "Official Feeds & News" },
              ].map((f) => (
                <button 
                  key={f.id}
                  onClick={() => setFilterSource(f.id)}
                  className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                    filterSource === f.id ? "bg-[#001d36] text-white font-bold" : "bg-[#F7F3EC] text-[#43474d] hover:bg-[#E7DED2]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="text-xs font-mono text-[#74777e]">
              Showing {filteredItems.length} of {feedItems.length} records
            </div>
          </div>

          {/* STEP 5: Feed Stream List */}
          <div className="space-y-3 max-w-4xl">
            {loading ? (
              <div className="bg-white border border-[#E7DED2] rounded-lg p-8 text-center text-xs text-[#74777e] flex items-center justify-center gap-2">
                <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                Connecting to live intelligence feed...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="bg-white border border-[#E7DED2] rounded-lg p-8 text-center text-xs text-[#74777e] space-y-1">
                <div className="font-semibold text-slate-700">No intelligence reports for this stream filter.</div>
                <p className="text-[11px]">Reports appear in real-time as background pipelines ingest data.</p>
              </div>
            ) : (
              filteredItems.map((item, idx) => {
                const conf = item.confidence || 75
                const linkedId = item.incidentId || item.clusterId || null
                const rawTime = item.createdAt?.toDate ? item.createdAt.toDate() : item.createdAt
                const relativeTime = formatRelativeTime(rawTime)
                const disasterType = item.disasterType || "Hazard Observation"
                const urgency = item.urgency || "Moderate"

                // Determine verification status if available on item
                const status = item.verificationStatus || (item.verified ? "VERIFIED" : item.corroborated ? "CORROBORATED" : "UNVERIFIED")

                return (
                  <div key={item.id || idx} className="bg-white border border-[#E7DED2] rounded-xl p-4 space-y-3 hover:border-[#001d36] transition-colors shadow-xs">
                    {/* Header Row: Source, Handle, Urgency, Timestamp */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-[#001d36] text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                          {item.source || "Field Stream"}
                        </span>
                        <span className="text-xs font-mono font-bold text-[#001d36]">{item.handle || "@feed"}</span>
                        {urgency && (
                          <SeverityBadge severity={urgency} size="xs" />
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <VerificationBadge status={status} size="xs" />
                        <span className="text-[11px] font-mono text-[#74777e]">{relativeTime}</span>
                      </div>
                    </div>

                    {/* Report Text */}
                    <p className="text-xs text-[#1c1c18] leading-relaxed">
                      {item.text}
                    </p>

                    {item.media && (
                      <div className="h-44 rounded-lg overflow-hidden border border-[#E7DED2]">
                        <img alt="Report media" src={item.media} className="w-full h-full object-cover" />
                      </div>
                    )}

                    {/* AI Classification & Corroboration Block */}
                    <div className="bg-[#FAF7F2] border border-[#E7DED2] rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#74777e]">AI Classification:</span>
                        <span className="font-bold text-[#001d36] uppercase">{disasterType}</span>
                        <ConfidenceIndicator value={conf} />
                      </div>

                      {/* Linked Incident Relationship */}
                      {linkedId ? (
                        <button
                          onClick={() => navigate(`/admin/incident/${linkedId}`)}
                          className="text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1 cursor-pointer"
                          title="Open associated incident intelligence file"
                        >
                          <span>↳ Linked to Incident #{String(linkedId).slice(0, 8)}</span>
                          <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">
                          Stand-alone event (Pending clustering)
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default LiveIntelligenceFeed
