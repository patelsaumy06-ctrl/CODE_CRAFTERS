import React from 'react'
import { useNavigate } from 'react-router-dom'

export const HeroPage = () => {
  const navigate = useNavigate()

  return (
    <div className="bg-[#F7F3EC] text-[#1c1c18] font-body-md antialiased min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="w-full flex justify-between items-center px-6 md:px-10 py-4 bg-[#001d36] text-white">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <span className="material-symbols-outlined text-[#D98B3A] text-xl">radar</span>
          <span className="text-base font-semibold tracking-tight">DisasterLens</span>
        </div>
        <button
          onClick={() => navigate("/login")}
          className="text-sm font-medium bg-white text-[#001d36] px-4 py-2 rounded-lg hover:bg-white/90 transition-colors"
        >
          Sign in
        </button>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 md:px-10">
        <div className="max-w-2xl mx-auto text-center py-20 md:py-28">
          <h1 className="text-3xl md:text-4xl font-bold text-[#001d36] leading-tight mb-4">
            Disaster intelligence for faster response.
          </h1>
          <p className="text-base text-[#43474d] max-w-lg mx-auto mb-8 leading-relaxed">
            DisasterLens brings incident reports, verification, risk assessment and alerts into one operational dashboard.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="bg-[#001d36] text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-[#17324d] transition-colors"
          >
            Sign in
          </button>
        </div>

        {/* Capabilities */}
        <div className="max-w-3xl w-full mx-auto pb-20 md:pb-28">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <span className="material-symbols-outlined text-[#001d36] text-xl">cloud_sync</span>
                <h3 className="text-sm font-semibold text-[#001d36]">Collect</h3>
              </div>
              <p className="text-sm text-[#43474d] leading-relaxed">
                Bring incident reports and data sources together from sensors, agencies, and public feeds.
              </p>
            </div>
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <span className="material-symbols-outlined text-[#001d36] text-xl">verified</span>
                <h3 className="text-sm font-semibold text-[#001d36]">Verify</h3>
              </div>
              <p className="text-sm text-[#43474d] leading-relaxed">
                Correlate reports from multiple sources and assess confidence with automated verification.
              </p>
            </div>
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <span className="material-symbols-outlined text-[#001d36] text-xl">campaign</span>
                <h3 className="text-sm font-semibold text-[#001d36]">Respond</h3>
              </div>
              <p className="text-sm text-[#43474d] leading-relaxed">
                Prioritize incidents by severity and send targeted alerts to responders and the public.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 px-6 md:px-10 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-[#E7DED2] text-xs text-[#74777e]">
        <span>© 2026 DisasterLens</span>
        <div className="flex gap-6">
          <button onClick={() => navigate("/how-it-works")} className="hover:text-[#001d36] transition-colors">How it works</button>
          <button onClick={() => navigate("/support")} className="hover:text-[#001d36] transition-colors">Support</button>
        </div>
      </footer>
    </div>
  )
}
