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
      setFeedItems(data)
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
        sentiment: "Citizen Incident Ingest",
        confidence: 92
      })
      setNewText('')
      alert("Telemetry post successfully ingested into Firestore stream!")
    } catch (e) {
      console.error("Error posting intelligence item:", e)
      alert("Failed to post telemetry item to Firestore.")
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
        <Header title="Real-Time Intelligence Feed" />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Report Ingestion Form */}
          {userRole !== "viewer" && (
            <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-4 shadow-sm space-y-3">
              <h3 className="font-bold text-xs text-[#001d36] uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-[#D98B3A] text-base">rss_feed</span>
                Ingest Live Ground Intelligence to Firestore
              </h3>
              
              <form onSubmit={handlePostReport} className="flex gap-3 flex-wrap">
                <input 
                  type="text" 
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Enter field observation or intelligence blurb..."
                  className="flex-1 min-w-[250px] border border-[#E7DED2] rounded-lg p-2 text-xs focus:border-[#D98B3A]"
                  required
                />
                <select 
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  className="w-40 border border-[#E7DED2] rounded-lg p-2 text-xs focus:border-[#D98B3A]"
                >
                  <option value="Citizen Stream">Citizen Stream</option>
                  <option value="Drone Recon">Drone Recon</option>
                  <option value="Satellite Array">Satellite Array</option>
                  <option value="Field Reporter">Field Reporter</option>
                  <option value="Sensor Alert">Sensor Alert</option>
                </select>
                <button 
                  type="submit" 
                  disabled={posting}
                  className="bg-[#001d36] text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#17324d] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {posting ? "Ingesting..." : "Publish to Feed"}
                </button>
              </form>
            </div>
          )}

          {/* Source Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase text-[#74777e]">Filter Source:</span>
              <button 
                onClick={() => setFilterSource("All")}
                className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer ${filterSource === "All" ? "bg-[#001d36] text-white" : "bg-[#FFFDF9] border border-[#E7DED2]"}`}
              >
                All Sources
              </button>
              <button 
                onClick={() => setFilterSource("Social")}
                className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer ${filterSource === "Social" ? "bg-[#001d36] text-white" : "bg-[#FFFDF9] border border-[#E7DED2]"}`}
              >
                Social Media Streams
              </button>
              <button 
                onClick={() => setFilterSource("Sensors")}
                className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer ${filterSource === "Sensors" ? "bg-[#001d36] text-white" : "bg-[#FFFDF9] border border-[#E7DED2]"}`}
              >
                IoT Sensors & Telemetry
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              FIRESTORE STREAM: ACTIVE ({feedItems.length} items)
            </div>
          </div>

          {/* Feed Cards */}
          <div className="space-y-4 max-w-4xl">
            {filteredItems.map((item) => (
              <div key={item.id || item.text} className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#001d36] text-white text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold">
                      {item.source}
                    </span>
                    <span className="text-xs font-bold text-[#001d36]">{item.handle}</span>
                  </div>
                  <span className="text-xs font-mono text-[#74777e]">
                    {item.createdAt ? "Live Stream" : "Just now"}
                  </span>
                </div>

                <p className="text-xs text-[#1c1c18] font-medium leading-relaxed">
                  {item.text}
                </p>

                {item.media && (
                  <div className="h-44 rounded-lg overflow-hidden border border-[#E7DED2]">
                    <img alt="Feed Media" src={item.media} className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-[#E7DED2] text-xs">
                  <span className="text-[#74777e]">Classifier Tag: <strong className="text-[#001d36]">{item.sentiment}</strong></span>
                  <span className="font-mono text-green-700 font-bold">AI Conf: {item.confidence}%</span>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
export default LiveIntelligenceFeed
