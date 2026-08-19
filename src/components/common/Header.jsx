import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export const Header = ({ title = "Dashboard" }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [roleMenuOpen, setRoleMenuOpen] = useState(false)

  const userEmail = localStorage.getItem("userEmail") || "user@disasterlens.ai"
  const currentRole = localStorage.getItem("role") || "viewer"

  const switchRole = (newRole) => {
    localStorage.setItem("role", newRole)
    localStorage.setItem("token", "token_" + Date.now())
    setRoleMenuOpen(false)
    window.location.reload()
  }

  const navItems = [
    { name: "Dashboard", path: "/admin", icon: "dashboard" },
    { name: "Control Center", path: "/admin/control-center", icon: "admin_panel_settings" },
    { name: "Incidents", path: "/admin/incident", icon: "emergency" },
    { name: "Analytics", path: "/admin/analytics", icon: "analytics" },
    { name: "Alerts", path: "/admin/notifications", icon: "notifications_active" },
    { name: "Reports", path: "/admin/intelligence-feed", icon: "rss_feed" },
    { name: "Search", path: "/admin/search", icon: "manage_search" },
    { name: "How it works", path: "/how-it-works", icon: "help_outline" },
    { name: "Support", path: "/support", icon: "support_agent" },
  ]

  return (
    <>
      <header className="sticky top-0 z-20 w-full h-14 bg-white border-b border-[#E7DED2] flex justify-between items-center px-4 md:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-[#001d36] hover:opacity-80 transition-opacity p-1"
            title="Toggle navigation"
          >
            <span className="material-symbols-outlined text-xl">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
          <h1 className="text-sm font-semibold text-[#001d36]">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Shortcut */}
          <div
            onClick={() => navigate("/admin/search")}
            className="hidden md:flex items-center gap-2 bg-[#F7F3EC] border border-[#E7DED2] rounded-lg px-3 py-1.5 cursor-pointer hover:border-[#74777e] transition-colors"
          >
            <span className="material-symbols-outlined text-[#74777e] text-sm">search</span>
            <span className="text-xs text-[#74777e] pr-4">Search...</span>
            <kbd className="hidden lg:inline-block bg-white text-[10px] text-[#74777e] border border-[#c3c6ce] px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
          </div>

          {/* Status */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#43474d] bg-[#F7F3EC] border border-[#E7DED2] px-2.5 py-1 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            <span className="font-medium">Connected</span>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => navigate("/admin/search")}
              className="md:hidden w-8 h-8 flex items-center justify-center hover:bg-[#F7F3EC] rounded-lg transition-colors text-[#001d36]"
              title="Search"
            >
              <span className="material-symbols-outlined text-xl">search</span>
            </button>
            <button
              onClick={() => navigate("/admin/notifications")}
              className="w-8 h-8 flex items-center justify-center hover:bg-[#F7F3EC] rounded-lg transition-colors text-[#001d36] relative"
              title="Notifications"
            >
              <span className="material-symbols-outlined text-xl">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>

          {/* User Profile & Role Switcher */}
          <div className="relative flex items-center gap-2 pl-2 border-l border-[#E7DED2]">
            <div className="hidden xl:block text-right cursor-pointer" onClick={() => setRoleMenuOpen(!roleMenuOpen)}>
              <div className="text-xs font-medium text-[#001d36] truncate max-w-[140px]">{userEmail}</div>
              <div className="text-[10px] text-[#74777e] flex items-center justify-end gap-0.5">
                {currentRole}
                <span className="material-symbols-outlined text-[12px]">expand_more</span>
              </div>
            </div>

            <div
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="w-8 h-8 rounded-full overflow-hidden border border-[#E7DED2] shrink-0 cursor-pointer hover:border-[#74777e] transition-colors bg-[#001d36] flex items-center justify-center"
              title="Switch role"
            >
              <span className="material-symbols-outlined text-white text-base">person</span>
            </div>

            {/* Role Switcher Dropdown */}
            {roleMenuOpen && (
              <div className="absolute right-0 top-12 w-56 bg-white border border-[#E7DED2] rounded-lg shadow-lg p-2 z-50 space-y-1">
                <div className="text-[10px] font-medium text-[#74777e] uppercase px-2 pb-1 border-b border-[#E7DED2]">
                  Switch role
                </div>
                {[
                  { value: "admin", label: "Admin" },
                  { value: "responder", label: "Responder" },
                  { value: "viewer", label: "Viewer" },
                ].map((r) => (
                  <button
                    key={r.value}
                    onClick={() => switchRole(r.value)}
                    className={`w-full text-left p-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${currentRole === r.value ? "bg-[#001d36] text-white" : "hover:bg-[#F7F3EC] text-[#001d36]"
                      }`}
                  >
                    <span>{r.label}</span>
                    {currentRole === r.value && <span className="material-symbols-outlined text-sm">check</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-[#001d36]/40 flex">
          <div className="w-[260px] bg-[#17324D] text-white h-full p-5 flex flex-col space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#D98B3A] text-xl">radar</span>
                <span className="font-semibold text-base">DisasterLens</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-white/70 hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto space-y-0.5">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path)
                      setMobileMenuOpen(false)
                    }}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-xs font-medium ${isActive ? "bg-[#D98B3A] text-white font-semibold" : "text-white/70 hover:bg-white/10"
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
              className="bg-red-600/80 hover:bg-red-600 text-white w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              Sign out
            </button>
          </div>
        </div>
      )}
    </>
  )
}
export default Header
