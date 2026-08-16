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
    { name: "Command Center", path: "/admin", icon: "dashboard" },
    { name: "Control Center", path: "/admin/control-center", icon: "admin_panel_settings" },
    { name: "Live Incidents", path: "/admin/incident", icon: "emergency" },
    { name: "Analytics & Reports", path: "/admin/analytics", icon: "analytics" },
    { name: "Alerts & Notifications", path: "/admin/notifications", icon: "notifications_active" },
    { name: "Intelligence Feed", path: "/admin/intelligence-feed", icon: "rss_feed" },
    { name: "Search Intelligence", path: "/admin/search", icon: "manage_search" },
  ]

  const secondaryItems = [
    { name: "How It Works", path: "/how-it-works", icon: "help_outline" },
    { name: "Support & Help", path: "/support", icon: "support_agent" },
  ]

  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] bg-[#17324D] text-[#819aba] shadow-md border-r border-[#c3c6ce]/20 flex flex-col py-6 z-30 hidden lg:flex">
      {/* Brand Header */}
      <div className="px-6 mb-6">
        <div 
          onClick={() => navigate("/")} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <span className="material-symbols-outlined text-[#D98B3A] text-2xl group-hover:scale-110 transition-transform">
            radar
          </span>
          <div>
            <h1 className="font-headline-md text-lg font-bold text-white leading-none">
              DisasterLens AI
            </h1>
            <p className="font-data-label text-[10px] tracking-wider font-semibold text-[#819aba] uppercase mt-1 opacity-80">
              Intelligence Platform
            </p>
          </div>
        </div>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto px-3">
        <div className="px-3 py-1 font-data-label text-[10px] font-bold text-white/40 uppercase tracking-widest">
          Main Console
        </div>
        {navItems.map((item) => {
          const isActive = currentPath === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all w-full text-left cursor-pointer ${
                isActive
                  ? 'bg-[#D98B3A] text-white shadow-sm font-bold'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] shrink-0">
                {item.icon}
              </span>
              <span className="truncate">{item.name}</span>
            </button>
          )
        })}

        <div className="px-3 py-1 font-data-label text-[10px] font-bold text-white/40 uppercase tracking-widest mt-4">
          Resources
        </div>
        {secondaryItems.map((item) => {
          const isActive = currentPath === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all w-full text-left cursor-pointer ${
                isActive
                  ? 'bg-white/20 text-white font-bold'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] shrink-0">
                {item.icon}
              </span>
              <span className="truncate">{item.name}</span>
            </button>
          )
        })}
      </nav>

      {/* Footer Section */}
      <div className="mt-auto px-6 pt-4 border-t border-white/10">
        <button 
          onClick={() => navigate("/admin/analytics")}
          className="w-full bg-[#D98B3A] text-white rounded-lg py-2 px-3 text-xs font-bold uppercase tracking-wider hover:bg-opacity-90 transition-opacity flex items-center justify-center gap-2 mb-3 shadow-sm cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">download</span>
          Export Report
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center justify-between w-full px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2 font-semibold">
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Logout
          </span>
          <span className="font-data-label text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-white/60">
            v2.4
          </span>
        </button>
      </div>
    </aside>
  )
}
export default Sidebar
