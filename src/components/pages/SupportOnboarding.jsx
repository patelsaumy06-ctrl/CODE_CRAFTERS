import React from 'react'
import { Sidebar } from '../common/Sidebar'
import { Header } from '../common/Header'

export const SupportOnboarding = () => {
  return (
    <div className="bg-[#F7F3EC] text-[#1c1c18] font-sans flex h-screen overflow-hidden antialiased">
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-[260px] min-h-screen relative overflow-hidden">
        <Header title="Help & Support" />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          <div className="bg-white border border-[#E7DED2] rounded-lg p-5 space-y-4 max-w-3xl">
            <h2 className="font-semibold text-sm text-[#001d36] flex items-center gap-2">
              <span className="material-symbols-outlined text-base">support_agent</span>
              Help & Documentation
            </h2>
            <p className="text-xs text-[#43474d] leading-relaxed">
              Find technical documentation, sensor connector setup guides, and operational support contacts.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
              <div className="p-3.5 border border-[#E7DED2] rounded-lg bg-[#FAF7F2] space-y-1.5">
                <span className="material-symbols-outlined text-xl text-[#001d36]">menu_book</span>
                <h3 className="font-semibold text-xs text-[#001d36]">API Documentation</h3>
                <p className="text-[11px] text-[#74777e] leading-relaxed">Integrate external IoT feeds and custom incident Webhooks.</p>
              </div>

              <div className="p-3.5 border border-[#E7DED2] rounded-lg bg-[#FAF7F2] space-y-1.5">
                <span className="material-symbols-outlined text-xl text-[#001d36]">school</span>
                <h3 className="font-semibold text-xs text-[#001d36]">Operator Training</h3>
                <p className="text-[11px] text-[#74777e] leading-relaxed">Guidelines for incident verification and alert thresholds.</p>
              </div>

              <div className="p-3.5 border border-[#E7DED2] rounded-lg bg-[#FAF7F2] space-y-1.5">
                <span className="material-symbols-outlined text-xl text-[#001d36]">headset_mic</span>
                <h3 className="font-semibold text-xs text-[#001d36]">Technical Support</h3>
                <p className="text-[11px] text-[#74777e] leading-relaxed">Direct support contact for field emergency coordinators.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
export default SupportOnboarding
