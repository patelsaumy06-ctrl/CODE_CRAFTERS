import React, { useState } from 'react'
import { Sidebar } from '../common/Sidebar'
import { Header } from '../common/Header'

export const LiveIntelligenceFeed = () => {
  const [filterSource, setFilterSource] = useState("All")

  const feedItems = [
    {
      id: "FEED-1029",
      source: "X/Twitter Stream",
      handle: "@city_resident",
      text: "Water level rising fast near 4th street bridge! Roads completely impassable. Stay clear!",
      time: "Just now",
      urgency: "High",
      sentiment: "Panic / Crisis",
      media: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=400",
      confidence: 91
    },
    {
      id: "FEED-1028",
      source: "NOAA Sensor API",
      handle: "Station #402",
      text: "Telemetry spike: Water Gauge reading +2.4 meters above normal baseline.",
      time: "2m ago",
      urgency: "Critical",
      sentiment: "Sensor Trigger",
      media: null,
      confidence: 99
    },
    {
      id: "FEED-1025",
      source: "Citizen Report App",
      handle: "Anonymous User #88",
      text: "Sparking electric pole near flooded sub-station B. Power cut across 2 blocks.",
      time: "5m ago",
      urgency: "Moderate",
      sentiment: "Infrastructure Hazard",
      media: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&q=80&w=400",
      confidence: 84
    }
  ]

  return (
    <div className="bg-[#F7F3EC] text-[#1c1c18] font-sans flex h-screen overflow-hidden antialiased">
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-[260px] min-h-screen relative overflow-hidden">
        <Header title="Real-Time Intelligence Feed" />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Source Filter */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase text-[#74777e]">Filter Source:</span>
              <button 
                onClick={() => setFilterSource("All")}
                className={`px-3 py-1 text-xs font-bold rounded-lg ${filterSource === "All" ? "bg-[#001d36] text-white" : "bg-[#FFFDF9] border border-[#E7DED2]"}`}
              >
                All Sources
              </button>
              <button 
                onClick={() => setFilterSource("Social")}
                className={`px-3 py-1 text-xs font-bold rounded-lg ${filterSource === "Social" ? "bg-[#001d36] text-white" : "bg-[#FFFDF9] border border-[#E7DED2]"}`}
              >
                Social Media Streams
              </button>
              <button 
                onClick={() => setFilterSource("Sensors")}
                className={`px-3 py-1 text-xs font-bold rounded-lg ${filterSource === "Sensors" ? "bg-[#001d36] text-white" : "bg-[#FFFDF9] border border-[#E7DED2]"}`}
              >
                IoT Sensors & Telemetry
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              INGEST STREAM: 120 items/min
            </div>
          </div>

          {/* Feed Cards */}
          <div className="space-y-4 max-w-4xl">
            {feedItems.map((item) => (
              <div key={item.id} className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#001d36] text-white text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold">
                      {item.source}
                    </span>
                    <span className="text-xs font-bold text-[#001d36]">{item.handle}</span>
                  </div>
                  <span className="text-xs font-mono text-[#74777e]">{item.time}</span>
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
