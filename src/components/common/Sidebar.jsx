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

  const navItems = [
    { name: "Dashboard", path: "/admin", icon: "dashboard" },
    { name: "Control Center", path: "/admin/control-center", icon: "admin_panel_settings" },
    { name: "Incidents", path: "/admin/incident", icon: "emergency" },
    { name: "Analytics", path: "/admin/analytics", icon: "analytics" },
    { name: "Alerts", path: "/admin/notifications", icon: "notifications_active" },
    { name: "Reports", path: "/admin/intelligence-feed", icon: "rss_feed" },
    { name: "Search", path: "/admin/search", icon: "manage_search" },
  ]

  const secondaryItems = [
    { name: "How it works", path: "/how-it-works", icon: "help_outline" },
    { name: "Support", path: "/support", icon: "support_agent" },
  ]

  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] bg-[#17324D] text-[#819aba] border-r border-[#c3c6ce]/20 flex flex-col py-5 z-30 hidden lg:flex">
      {/* Brand Header */}
      <div className="px-5 mb-5">
        <div 
          onClick={() => navigate("/")} 
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[#D98B3A] text-2xl">
            radar
          </span>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight leading-none">
              DisasterLens
            </h1>
            <p className="text-[11px] text-[#819aba] mt-0.5">
              Operations Console
            </p>
          </div>
        </div>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 flex flex-col gap-0.5 overflow-y-auto px-3">
        <div className="px-3 py-1.5 text-[10px] font-semibold text-white/40 uppercase tracking-wider">
          Navigation
        </div>
        {navItems.map((item) => {
          const isActive = currentPath === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors w-full text-left cursor-pointer ${
                isActive
                  ? 'bg-[#D98B3A] text-white font-semibold shadow-sm'
                  : 'text-white/75 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="material-symbols-outlined text-[19px] shrink-0">
                {item.icon}
              </span>
              <span className="truncate">{item.name}</span>
            </button>
          )
        })}

        <div className="px-3 py-1.5 text-[10px] font-semibold text-white/40 uppercase tracking-wider mt-4">
          Resources
        </div>
        {secondaryItems.map((item) => {
          const isActive = currentPath === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors w-full text-left cursor-pointer ${
                isActive
                  ? 'bg-white/20 text-white font-semibold'
                  : 'text-white/75 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="material-symbols-outlined text-[19px] shrink-0">
                {item.icon}
              </span>
              <span className="truncate">{item.name}</span>
            </button>
          )
        })}
      </nav>

      {/* Footer Section */}
      <div className="mt-auto px-4 pt-3 border-t border-white/10 space-y-2">
        <button 
          onClick={() => navigate("/admin/analytics")}
          className="w-full bg-[#001d36] text-white border border-white/15 rounded-lg py-2 px-3 text-xs font-semibold hover:bg-white/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
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
            v1.0
          </span>
        </button>
      </div>
    </aside>
  )
}
export default Sidebar
