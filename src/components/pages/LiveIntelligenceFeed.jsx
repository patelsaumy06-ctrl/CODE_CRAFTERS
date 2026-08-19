import React, { useState, useEffect } from 'react'
import { Sidebar } from '../common/Sidebar'
import { Header } from '../common/Header'
import { listenToIntelligenceFeed, createIntelligenceItem } from '../../services/intelligenceService'
import { useAuth } from '../../context/AuthContext'

export const LiveIntelligenceFeed = () => {
  const { userRole } = useAuth()
  const [filterSource, setFilterSource] = useState("All")
  const [feedItems, setFeedItems] = useState([])
  const [loading, setLoading] = useState(true)

  // Report Ingestion state
  const [newText, setNewText] = useState('')
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
        urgency: "High",
        sentiment: "Field Report",
        confidence: 92
      })
      setNewText('')
      alert("Report submitted successfully.")
    } catch (e) {
      console.error("Error posting intelligence item:", e)
      alert("Failed to submit report.")
    } finally {
      setPosting(false)
    }
  }

  const filteredItems = feedItems.filter(item => {
    if (filterSource === "All") return true
    if (filterSource === "Social") return item.source.toLowerCase().includes("twitter") || item.source.toLowerCase().includes("social") || item.source.toLowerCase().includes("citizen")
    if (filterSource === "Sensors") return item.source.toLowerCase().includes("sensor") || item.source.toLowerCase().includes("noaa") || item.source.toLowerCase().includes("telemetry")
    return true
  })

  return (
    <div className="bg-[#F7F3EC] text-[#1c1c18] font-sans flex h-screen overflow-hidden antialiased">
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-[260px] min-h-screen relative overflow-hidden">
        <Header title="Incoming Reports" />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">

          {/* Report Ingestion Form */}
          {userRole !== "viewer" && (
            <div className="bg-white border border-[#E7DED2] rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-xs text-[#001d36] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">add_circle</span>
                Submit Report
              </h3>
              
              <form onSubmit={handlePostReport} className="flex gap-2.5 flex-wrap">
                <input 
                  type="text" 
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Describe what you observed..."
                  className="flex-1 min-w-[240px] border border-[#E7DED2] rounded-lg px-3 py-2 text-xs focus:border-[#001d36] focus:outline-none"
                  required
                />
                <select 
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  className="w-36 border border-[#E7DED2] rounded-lg px-2.5 py-2 text-xs focus:border-[#001d36] focus:outline-none cursor-pointer"
                >
                  <option value="Citizen Stream">Citizen Report</option>
                  <option value="Drone Recon">Aerial Survey</option>
                  <option value="Field Reporter">Field Observer</option>
                  <option value="Sensor Alert">Sensor Alert</option>
                </select>
                <button 
                  type="submit" 
                  disabled={posting}
                  className="bg-[#001d36] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[#17324d] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {posting ? "Submitting..." : "Submit"}
                </button>
              </form>
            </div>
          )}

          {/* Source Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-[#E7DED2]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#74777e]">Filter:</span>
              <button 
                onClick={() => setFilterSource("All")}
                className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                  filterSource === "All" ? "bg-[#001d36] text-white" : "bg-[#F7F3EC] text-[#43474d] hover:bg-[#E7DED2]"
                }`}
              >
                All Sources
              </button>
              <button 
                onClick={() => setFilterSource("Social")}
                className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                  filterSource === "Social" ? "bg-[#001d36] text-white" : "bg-[#F7F3EC] text-[#43474d] hover:bg-[#E7DED2]"
                }`}
              >
                Citizen Reports
              </button>
              <button 
                onClick={() => setFilterSource("Sensors")}
                className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                  filterSource === "Sensors" ? "bg-[#001d36] text-white" : "bg-[#F7F3EC] text-[#43474d] hover:bg-[#E7DED2]"
                }`}
              >
                Sensors
              </button>
            </div>

            <div className="text-xs text-[#74777e]">
              Live · {feedItems.length} reports
            </div>
          </div>

          {/* Feed List */}
          <div className="space-y-3 max-w-4xl">
            {filteredItems.length === 0 ? (
              <div className="bg-white border border-[#E7DED2] rounded-lg p-6 text-center text-xs text-[#74777e]">
                No reports available for this filter.
              </div>
            ) : (
              filteredItems.map((item, idx) => (
                <div key={item.id || idx} className="bg-white border border-[#E7DED2] rounded-lg p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#FAF7F2] border border-[#E7DED2] text-[#001d36] text-[10px] px-2 py-0.5 rounded font-medium">
                        {item.source}
                      </span>
                      <span className="text-xs font-medium text-[#001d36]">{item.handle}</span>
                    </div>
                    <span className="text-[11px] text-[#74777e]">
                      {item.createdAt ? "Recent" : "Just now"}
                    </span>
                  </div>

                  <p className="text-xs text-[#1c1c18] leading-relaxed">
                    {item.text}
                  </p>

                  {item.media && (
                    <div className="h-40 rounded-lg overflow-hidden border border-[#E7DED2]">
                      <img alt="Report media" src={item.media} className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-[#74777e]">
                    <span>Category: <strong className="text-[#001d36] font-medium">{item.sentiment}</strong></span>
                    <span className="font-medium text-slate-700">Confidence: {item.confidence}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
export default LiveIntelligenceFeed
