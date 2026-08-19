import React from 'react'
import { useNavigate } from 'react-router-dom'

export const HowItWorks = () => {
  const navigate = useNavigate()

  const steps = [
    {
      num: "01",
      title: "Data Intake",
      desc: "DisasterLens ingests reports from social streams, seismic sensors, IoT water gauges, satellite telemetry, and emergency feeds.",
      icon: "cloud_sync"
    },
    {
      num: "02",
      title: "Classification & Filtering",
      desc: "Language models and pattern filters categorize reports by disaster type and urgency while filtering out unrelated noise.",
      icon: "filter_alt"
    },
    {
      num: "03",
      title: "Event Clustering & Verification",
      desc: "Independent reports within the same geographic and time window are clustered and cross-referenced with weather telemetry to determine confidence.",
      icon: "hub"
    },
    {
      num: "04",
      title: "Alert Dispatch",
      desc: "Verified high-risk incidents populate the operational map and trigger prioritized alerts for responders and emergency managers.",
      icon: "campaign"
    }
  ]

  return (
    <div className="bg-[#F7F3EC] text-[#1c1c18] font-sans min-h-screen flex flex-col antialiased">
      {/* Top Bar */}
      <nav className="flex justify-between items-center px-6 md:px-10 py-4 bg-[#001d36] text-white">
        <div 
          onClick={() => navigate("/")} 
          className="flex items-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[#D98B3A] text-xl">radar</span>
          <span className="font-semibold text-base">DisasterLens</span>
        </div>
        <button 
          onClick={() => navigate("/login")}
          className="bg-white text-[#001d36] px-4 py-2 rounded-lg text-xs font-semibold hover:bg-white/90 transition-colors"
        >
          Sign in
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 space-y-10">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#001d36]">How DisasterLens Works</h1>
          <p className="text-sm text-[#74777e] max-w-lg mx-auto">
            From raw multi-source signals to verified operational intelligence.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {steps.map((step) => (
            <div key={step.num} className="bg-white border border-[#E7DED2] rounded-lg p-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-[#001d36] font-mono">{step.num}</span>
                <span className="material-symbols-outlined text-xl text-[#74777e]">{step.icon}</span>
              </div>
              <h3 className="font-semibold text-sm text-[#001d36]">{step.title}</h3>
              <p className="text-xs text-[#43474d] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center pt-4">
          <button 
            onClick={() => navigate("/login")}
            className="bg-[#001d36] text-white px-6 py-2.5 rounded-lg text-xs font-semibold hover:bg-[#17324d] transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </main>
    </div>
  )
}
export default HowItWorks
