import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export const Header = ({ title = "Command Center" }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [roleMenuOpen, setRoleMenuOpen] = useState(false)

  const userEmail = localStorage.getItem("userEmail") || "commander@agency.gov"
  const currentRole = localStorage.getItem("role") || "admin"

  const switchRole = (newRole) => {
    localStorage.setItem("role", newRole)
    localStorage.setItem("token", "token_" + Date.now())
    setRoleMenuOpen(false)
    window.location.reload()
  }

  const navItems = [
    { name: "Command Center", path: "/admin", icon: "dashboard" },
    { name: "Control Center", path: "/admin/control-center", icon: "admin_panel_settings" },
    { name: "Live Incidents", path: "/admin/incident", icon: "emergency" },
    { name: "Analytics & Reports", path: "/admin/analytics", icon: "analytics" },
    { name: "Alerts & Notifications", path: "/admin/notifications", icon: "notifications_active" },
    { name: "Intelligence Feed", path: "/admin/intelligence-feed", icon: "rss_feed" },
    { name: "Search Intelligence", path: "/admin/search", icon: "manage_search" },
    { name: "How It Works", path: "/how-it-works", icon: "help_outline" },
    { name: "Support & Help", path: "/support", icon: "support_agent" },
  ]

  return (
    <>
      <header className="sticky top-0 z-20 w-full h-16 bg-[#FFFDF9] border-b border-[#E7DED2] flex justify-between items-center px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-[#001d36] hover:opacity-80 transition-opacity p-1"
            title="Toggle Mobile Navigation"
          >
            <span className="material-symbols-outlined text-2xl">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
          <div>
            <h1 className="text-lg font-bold text-[#001d36] leading-none">{title}</h1>
            <p className="text-[11px] text-[#74777e] mt-0.5 font-medium hidden sm:block">
              DisasterLens AI Operational Environment
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Search Bar Shortcut */}
          <div
            onClick={() => navigate("/admin/search")}
            className="hidden md:flex items-center gap-2 bg-[#F7F3EC] border border-[#E7DED2] rounded-full px-3 py-1.5 cursor-pointer hover:border-[#D98B3A] transition-colors"
          >
            <span className="material-symbols-outlined text-[#74777e] text-sm">search</span>
            <span className="text-xs text-[#74777e] pr-4">Search intelligence database...</span>
            <kbd className="hidden lg:inline-block bg-white text-[10px] text-[#74777e] border border-[#c3c6ce] px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
          </div>

          {/* Live System Status Indicator */}
          <div className="hidden sm:flex items-center bg-green-50 border border-green-200 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2"></span>
            <span className="font-data-label text-[10px] font-bold text-green-800 uppercase tracking-wider">
              Live Stream Active
            </span>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate("/admin/search")}
              className="md:hidden w-9 h-9 flex items-center justify-center hover:bg-[#F7F3EC] rounded-full transition-colors text-[#001d36]"
              title="Search Intelligence"
            >
              <span className="material-symbols-outlined text-xl">search</span>
            </button>
            <button
              onClick={() => navigate("/admin/notifications")}
              className="w-9 h-9 flex items-center justify-center hover:bg-[#F7F3EC] rounded-full transition-colors text-[#001d36] relative"
              title="Notifications"
            >
              <span className="material-symbols-outlined text-xl">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full animate-ping"></span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full"></span>
            </button>
          </div>

          {/* User Profile & Role Switcher */}
          <div className="relative flex items-center gap-3 pl-2 border-l border-[#E7DED2]">
            <div className="hidden xl:block text-right cursor-pointer" onClick={() => setRoleMenuOpen(!roleMenuOpen)}>
              <div className="text-xs font-bold text-[#001d36] truncate max-w-[140px]">{userEmail}</div>
              <div className="text-[10px] font-mono font-bold text-[#D98B3A] uppercase flex items-center justify-end gap-1">
                {currentRole}
                <span className="material-symbols-outlined text-[12px]">expand_more</span>
              </div>
            </div>
            
            <div
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#D98B3A] shrink-0 cursor-pointer hover:ring-2 hover:ring-[#D98B3A]/40 transition-all"
              title="Quick Demo Role Switcher"
            >
              <img
                alt="User Avatar"
                className="w-full h-full object-cover"
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256"
              />
            </div>

            {/* Role Switcher Dropdown */}
            {roleMenuOpen && (
              <div className="absolute right-0 top-12 w-64 bg-white border border-[#E7DED2] rounded-xl shadow-xl p-3 z-50 space-y-2">
                <div className="text-[10px] font-mono font-bold text-[#74777e] uppercase border-b border-[#E7DED2] pb-1">
                  Hackathon Demo Role Switcher
                </div>
                <button
                  onClick={() => switchRole("admin")}
                  className={`w-full text-left p-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                    currentRole === "admin" ? "bg-[#001d36] text-white" : "hover:bg-[#F7F3EC] text-[#001d36]"
                  }`}
                >
                  <span>Commander / Admin</span>
                  {currentRole === "admin" && <span className="material-symbols-outlined text-sm">check</span>}
                </button>
                <button
                  onClick={() => switchRole("responder")}
                  className={`w-full text-left p-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                    currentRole === "responder" ? "bg-[#001d36] text-white" : "hover:bg-[#F7F3EC] text-[#001d36]"
                  }`}
                >
                  <span>First Responder</span>
                  {currentRole === "responder" && <span className="material-symbols-outlined text-sm">check</span>}
                </button>
                <button
                  onClick={() => switchRole("user")}
                  className={`w-full text-left p-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                    currentRole === "user" ? "bg-[#001d36] text-white" : "hover:bg-[#F7F3EC] text-[#001d36]"
                  }`}
                >
                  <span>Public / Citizen (View Only)</span>
                  {currentRole === "user" && <span className="material-symbols-outlined text-sm">check</span>}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-[#001d36]/50 backdrop-blur-sm flex">
          <div className="w-[280px] bg-[#17324D] text-white h-full p-6 flex flex-col space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#D98B3A] text-2xl">radar</span>
                <span className="font-bold text-lg">DisasterLens AI</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-white/70 hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path)
                      setMobileMenuOpen(false)
                    }}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-xs font-semibold ${
                      isActive ? "bg-[#D98B3A] text-white font-bold" : "text-white/70 hover:bg-white/10"
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">{item.icon}</span>
                    <span>{item.name}</span>
                  </button>
                )
              })}
            </nav>

            <button
              onClick={() => {
                localStorage.clear()
                navigate("/login")
              }}
              className="bg-red-600/80 hover:bg-red-600 text-white w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              Logout
            </button>
          </div>
        </div>
      )}
    </>
  )
}
export default Header
