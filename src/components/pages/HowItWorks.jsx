import React from 'react'
import { useNavigate } from 'react-router-dom'

export const HowItWorks = () => {
  const navigate = useNavigate()

  const steps = [
    {
      num: "01",
      title: "Multi-Source Continuous Intake",
      desc: "DisasterLens AI ingests streaming feeds from public social networks, seismic sensors, IoT water gauges, satellite SAR frames, and emergency services API endpoints 24/7.",
      icon: "cloud_sync"
    },
    {
      num: "02",
      title: "AI NLP & Computer Vision Classifier",
      desc: "Our custom transformer models analyze image metadata, text sentiment, and geographical keywords to filter noise and flag genuine crisis events within seconds.",
      icon: "psychology"
    },
    {
      num: "03",
      title: "Spatiotemporal Event Clustering",
      desc: "Independent signals within specified geographical radii are grouped into coherent incident nodes with confidence scoring algorithm metrics.",
      icon: "hub"
    },
    {
      num: "04",
      title: "Automated Agency Broadcast",
      desc: "High-confidence verified threats trigger immediate alerts for first responders, emergency command centers, and public warning systems.",
      icon: "send"
    }
  ]

  return (
    <div className="bg-[#F7F3EC] text-[#1c1c18] font-sans min-h-screen flex flex-col antialiased">
      {/* Top Bar */}
      <nav className="flex justify-between items-center px-8 py-4 bg-[#001d36] text-white border-b border-white/10">
        <div 
          onClick={() => navigate("/")} 
          className="flex items-center gap-3 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[#D98B3A] text-2xl">radar</span>
          <span className="font-bold text-lg">DisasterLens AI</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/login")}
            className="bg-white text-[#001d36] px-4 py-2 rounded-lg text-xs font-bold hover:bg-opacity-90 transition-opacity"
          >
            Login / Secure Access
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 space-y-12">
        <div className="text-center space-y-4">
          <span className="bg-[#D98B3A]/20 text-[#D98B3A] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Operational Architecture
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#001d36]">How DisasterLens AI Works</h1>
          <p className="text-sm text-[#74777e] max-w-xl mx-auto">
            From raw multi-source noise to verified ground-truth intelligence in under 30 seconds.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map((step) => (
            <div key={step.num} className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-6 shadow-sm space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-[#D98B3A] font-mono">{step.num}</span>
                <span className="material-symbols-outlined text-2xl text-[#001d36]">{step.icon}</span>
              </div>
              <h3 className="font-bold text-base text-[#001d36]">{step.title}</h3>
              <p className="text-xs text-[#74777e] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center pt-6">
          <button 
            onClick={() => navigate("/login")}
            className="bg-[#001d36] text-white px-8 py-3 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#17324d] transition-colors shadow-md"
          >
            Access Command Center
          </button>
        </div>
      </main>
    </div>
  )
}
export default HowItWorks
