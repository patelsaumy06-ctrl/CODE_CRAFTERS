import React from 'react'
import { Sidebar } from '../common/Sidebar'
import { Header } from '../common/Header'

export const SupportOnboarding = () => {
  return (
    <div className="bg-[#F7F3EC] text-[#1c1c18] font-sans flex h-screen overflow-hidden antialiased">
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-[260px] min-h-screen relative overflow-hidden">
        <Header title="Support & Agency Onboarding" />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-6 shadow-sm space-y-4 max-w-4xl">
            <h2 className="font-bold text-base text-[#001d36] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#D98B3A]">support_agent</span>
              Agency Technical Support & Onboarding Hub
            </h2>
            <p className="text-xs text-[#74777e]">
              Need help configuring your regional sensor connectors, training first responder teams, or setting up automated SMS webhooks? Contact our 24/7 dedicated support team.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 border border-[#E7DED2] rounded-lg bg-white space-y-2">
                <span className="material-symbols-outlined text-2xl text-[#001d36]">menu_book</span>
                <h3 className="font-bold text-xs text-[#001d36]">API Documentation</h3>
                <p className="text-[11px] text-[#74777e]">Integrate custom IoT sensors with our REST & WebSocket APIs.</p>
              </div>

              <div className="p-4 border border-[#E7DED2] rounded-lg bg-white space-y-2">
                <span className="material-symbols-outlined text-2xl text-[#D98B3A]">school</span>
                <h3 className="font-bold text-xs text-[#001d36]">Responder Training</h3>
                <p className="text-[11px] text-[#74777e]">Access video walkthroughs and incident management protocols.</p>
              </div>

              <div className="p-4 border border-[#E7DED2] rounded-lg bg-white space-y-2">
                <span className="material-symbols-outlined text-2xl text-green-700">headset_mic</span>
                <h3 className="font-bold text-xs text-[#001d36]">24/7 Emergency Help</h3>
                <p className="text-[11px] text-[#74777e]">Priority phone hotline for active tactical command centers.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
export default SupportOnboarding
