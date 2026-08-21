import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("role")
    localStorage.removeItem("userEmail")
    navigate("/login")
  }

  // Group 1: Operations
  const operationItems = [
    { name: "Operations Dashboard", path: "/admin", icon: "dashboard" },
    { name: "Incident Investigation", path: "/admin/incident", icon: "emergency" },
    { name: "Live Intelligence", path: "/admin/intelligence-feed", icon: "rss_feed" },
    { name: "Emergency Alerts", path: "/admin/notifications", icon: "notifications_active" },
  ]

  // Group 2: Analysis
  const analysisItems = [
    { name: "Search Intelligence", path: "/admin/search", icon: "manage_search" },
    { name: "Analytics & Pipeline", path: "/admin/analytics", icon: "analytics" },
  ]

  // Group 3: System
  const systemItems = [
    { name: "Control Center", path: "/admin/control-center", icon: "admin_panel_settings" },
  ]

  // Group 4: Resources
  const resourceItems = [
    { name: "How it Works", path: "/how-it-works", icon: "help_outline" },
    { name: "Support & Onboarding", path: "/support", icon: "support_agent" },
  ]

  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] bg-[#17324D] text-[#819aba] border-r border-[#c3c6ce]/20 flex flex-col py-5 z-30 hidden lg:flex shadow-md select-none">
      {/* Console Brand Header */}
      <div className="px-5 mb-5">
        <div 
          onClick={() => navigate("/admin")} 
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <span className="material-symbols-outlined text-[#D98B3A] text-2xl group-hover:rotate-45 transition-transform duration-300">
            radar
          </span>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight leading-none">
              DisasterLens AI
            </h1>
            <p className="text-[10px] uppercase font-bold tracking-widest text-[#D98B3A] mt-1">
              Intelligence Console
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 flex flex-col gap-3 overflow-y-auto px-3">
        {/* 1. OPERATIONS */}
        <div>
          <div className="px-3 py-1 text-[10px] font-bold text-white/50 uppercase tracking-widest">
            Operations
          </div>
          <div className="space-y-0.5 mt-1">
            {operationItems.map((item) => {
              const isActive = currentPath === item.path || (item.path === "/admin/incident" && currentPath.startsWith("/admin/incident"))
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors w-full text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#D98B3A] text-white font-bold shadow-xs'
                      : 'text-white/75 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] shrink-0">
                    {item.icon}
                  </span>
                  <span className="truncate">{item.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 2. ANALYSIS */}
        <div>
          <div className="px-3 py-1 text-[10px] font-bold text-white/50 uppercase tracking-widest">
            Analysis
          </div>
          <div className="space-y-0.5 mt-1">
            {analysisItems.map((item) => {
              const isActive = currentPath === item.path
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors w-full text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#D98B3A] text-white font-bold shadow-xs'
                      : 'text-white/75 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] shrink-0">
                    {item.icon}
                  </span>
                  <span className="truncate">{item.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 3. SYSTEM */}
        <div>
          <div className="px-3 py-1 text-[10px] font-bold text-white/50 uppercase tracking-widest">
            System
          </div>
          <div className="space-y-0.5 mt-1">
            {systemItems.map((item) => {
              const isActive = currentPath === item.path
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors w-full text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#D98B3A] text-white font-bold shadow-xs'
                      : 'text-white/75 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] shrink-0">
                    {item.icon}
                  </span>
                  <span className="truncate">{item.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 4. RESOURCES */}
        <div>
          <div className="px-3 py-1 text-[10px] font-bold text-white/50 uppercase tracking-widest">
            Resources
          </div>
          <div className="space-y-0.5 mt-1">
            {resourceItems.map((item) => {
              const isActive = currentPath === item.path
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors w-full text-left cursor-pointer ${
                    isActive
                      ? 'bg-white/20 text-white font-bold'
                      : 'text-white/75 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] shrink-0">
                    {item.icon}
                  </span>
                  <span className="truncate">{item.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Footer Actions */}
      <div className="mt-auto px-4 pt-3 border-t border-white/10 space-y-2">
        <button 
          onClick={() => navigate("/admin/analytics")}
          className="w-full bg-[#001d36] text-white border border-white/15 rounded-lg py-2 px-3 text-xs font-bold hover:bg-white/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">download</span>
          Export Report
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center justify-between w-full px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2 font-medium">
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Sign out
          </span>
          <span className="text-[10px] text-white/40 font-mono">
            v1.0-LIVE
          </span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
