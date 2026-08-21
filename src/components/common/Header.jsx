import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { fetchProvenance } from '../../services/incidentService'
import { formatRelativeTime } from '../../utils/intelligenceUtils'

export const Header = ({ title = "Dashboard" }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [roleMenuOpen, setRoleMenuOpen] = useState(false)
  const [provenance, setProvenance] = useState(null)

  const userEmail = localStorage.getItem("userEmail") || "operator@disasterlens.ai"
  const currentRole = localStorage.getItem("role") || "admin"

  useEffect(() => {
    let isMounted = true
    const checkStatus = () => {
      fetchProvenance().then((res) => {
        if (isMounted && res) {
          setProvenance(res)
        }
      })
    }
    checkStatus()
    const interval = setInterval(checkStatus, 8000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  const switchRole = (newRole) => {
    localStorage.setItem("role", newRole)
    localStorage.setItem("token", "token_" + Date.now())
    setRoleMenuOpen(false)
    window.location.reload()
  }

  const gdacsStatus = provenance?.sources?.gdacs?.status || "LIVE"
  const usgsStatus = provenance?.sources?.usgs?.status || "LIVE"
  const isHealthy = gdacsStatus === "LIVE" && usgsStatus === "LIVE"
  const lastSyncTime = provenance?.lastSynchronization || null
  const syncLabel = lastSyncTime ? formatRelativeTime(lastSyncTime) : "Live"

  const navItems = [
    { name: "Operations Dashboard", path: "/admin", icon: "dashboard" },
    { name: "Incident Investigation", path: "/admin/incident", icon: "emergency" },
    { name: "Intelligence Stream", path: "/admin/intelligence-feed", icon: "rss_feed" },
    { name: "Emergency Alerts", path: "/admin/notifications", icon: "notifications_active" },
    { name: "Intelligence Search", path: "/admin/search", icon: "manage_search" },
    { name: "Analytics & Pipeline", path: "/admin/analytics", icon: "analytics" },
    { name: "Control Center", path: "/admin/control-center", icon: "admin_panel_settings" },
    { name: "How it works", path: "/how-it-works", icon: "help_outline" },
    { name: "Support & Docs", path: "/support", icon: "support_agent" },
  ]

  return (
    <>
      <header className="sticky top-0 z-20 w-full h-14 bg-white border-b border-[#E7DED2] flex justify-between items-center px-4 md:px-6 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-[#001d36] hover:opacity-80 transition-opacity p-1 cursor-pointer"
            title="Toggle navigation"
          >
            <span className="material-symbols-outlined text-xl">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
          <h1 className="text-sm font-bold text-[#001d36] uppercase tracking-wider">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Search Trigger */}
          <div
            onClick={() => navigate("/admin/search")}
            className="hidden md:flex items-center gap-2 bg-[#F7F3EC] border border-[#E7DED2] rounded-lg px-3 py-1.5 cursor-pointer hover:border-[#001d36] transition-colors"
          >
            <span className="material-symbols-outlined text-[#74777e] text-sm">search</span>
            <span className="text-xs text-[#74777e] pr-4">Search intelligence...</span>
            <kbd className="hidden lg:inline-block bg-white text-[10px] text-[#74777e] border border-[#c3c6ce] px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
          </div>

          {/* STEP 9: Authentic Multi-Source Telemetry Status Badges */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-[#43474d] bg-[#FAF7F2] border border-[#E7DED2] px-2.5 py-1 rounded-lg">
              <span className={`w-2 h-2 rounded-full ${
                isHealthy ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`}></span>
              <span className="font-bold text-[#001d36] text-[11px]">SYNC:</span>
              <span className="text-[11px] font-mono text-slate-700">{syncLabel}</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[#43474d] bg-[#FAF7F2] border border-[#E7DED2] px-2 py-1 rounded-lg font-mono text-[11px]">
              <span className="font-bold text-[#001d36]">GDACS</span>
              <span className={gdacsStatus === "LIVE" ? "text-emerald-700 font-bold" : "text-amber-700"}>
                {gdacsStatus === "LIVE" ? "✓" : gdacsStatus}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[#43474d] bg-[#FAF7F2] border border-[#E7DED2] px-2 py-1 rounded-lg font-mono text-[11px]">
              <span className="font-bold text-[#001d36]">USGS</span>
              <span className={usgsStatus === "LIVE" ? "text-emerald-700 font-bold" : "text-amber-700"}>
                {usgsStatus === "LIVE" ? "✓" : usgsStatus}
              </span>
            </div>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => navigate("/admin/search")}
              className="md:hidden w-8 h-8 flex items-center justify-center hover:bg-[#F7F3EC] rounded-lg transition-colors text-[#001d36] cursor-pointer"
              title="Search"
            >
              <span className="material-symbols-outlined text-xl">search</span>
            </button>
            <button
              onClick={() => navigate("/admin/notifications")}
              className="w-8 h-8 flex items-center justify-center hover:bg-[#F7F3EC] rounded-lg transition-colors text-[#001d36] relative cursor-pointer"
              title="Emergency Alerts"
            >
              <span className="material-symbols-outlined text-xl">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full animate-ping"></span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full"></span>
            </button>
          </div>

          {/* User Profile & Role Switcher */}
          <div className="relative flex items-center gap-2 pl-2 border-l border-[#E7DED2]">
            <div className="hidden xl:block text-right cursor-pointer" onClick={() => setRoleMenuOpen(!roleMenuOpen)}>
              <div className="text-xs font-semibold text-[#001d36] truncate max-w-[140px]">{userEmail}</div>
              <div className="text-[10px] text-[#74777e] uppercase tracking-wider flex items-center justify-end gap-0.5">
                {currentRole}
                <span className="material-symbols-outlined text-[12px]">expand_more</span>
              </div>
            </div>

            <div
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="w-8 h-8 rounded-full overflow-hidden border border-[#E7DED2] shrink-0 cursor-pointer hover:border-[#001d36] transition-colors bg-[#001d36] flex items-center justify-center text-white"
              title="Switch role"
            >
              <span className="material-symbols-outlined text-base">person</span>
            </div>

            {/* Role Switcher Dropdown */}
            {roleMenuOpen && (
              <div className="absolute right-0 top-12 w-56 bg-white border border-[#E7DED2] rounded-lg shadow-lg p-2 z-50 space-y-1">
                <div className="text-[10px] font-bold text-[#74777e] uppercase px-2 pb-1 border-b border-[#E7DED2]">
                  Operator Role Clearance
                </div>
                {[
                  { value: "admin", label: "Admin / Commander" },
                  { value: "responder", label: "Field First Responder" },
                  { value: "viewer", label: "Intelligence Viewer" },
                ].map((r) => (
                  <button
                    key={r.value}
                    onClick={() => switchRole(r.value)}
                    className={`w-full text-left p-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                      currentRole === r.value ? "bg-[#001d36] text-white font-bold" : "hover:bg-[#F7F3EC] text-[#001d36]"
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
          <div className="w-[270px] bg-[#17324D] text-white h-full p-5 flex flex-col space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#D98B3A] text-2xl">radar</span>
                <span className="font-bold text-base">DisasterLens AI</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-white/70 hover:text-white cursor-pointer">
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
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-xs font-medium cursor-pointer ${
                      isActive ? "bg-[#D98B3A] text-white font-bold" : "text-white/75 hover:bg-white/10"
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
              className="bg-red-600/80 hover:bg-red-600 text-white w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
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
