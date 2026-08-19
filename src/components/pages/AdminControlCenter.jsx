import React, { useState, useEffect } from 'react'
import { Sidebar } from '../common/Sidebar'
import { Header } from '../common/Header'
import { listenToUsers, inviteAgencyUser, listenToAuditLogs, fetchSystemHealth, fetchPublicHealth } from '../../services/adminService'

export const AdminControlCenter = () => {
  const [activeTab, setActiveTab] = useState("roles")
  const [users, setUsers] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [systemHealth, setSystemHealth] = useState([])
  const [workerHealth, setWorkerHealth] = useState(null)
  const [loading, setLoading] = useState(true)

  // Invite modal state
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteName, setInviteName] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("responder")
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    const unsubUsers = listenToUsers((u) => setUsers(u || []))
    const unsubAudit = listenToAuditLogs((a) => {
      setAuditLogs(a || [])
      setLoading(false)
    })
    fetchSystemHealth().then(setSystemHealth)
    fetchPublicHealth().then(setWorkerHealth)
    return () => {
      unsubUsers()
      unsubAudit()
    }
  }, [])

  const handleInviteSubmit = async (e) => {
    e.preventDefault()
    if (!inviteEmail) return
    setInviting(true)
    try {
      await inviteAgencyUser({
        name: inviteName || "Officer",
        email: inviteEmail,
        role: inviteRole
      })
      alert(`User ${inviteEmail} invited as ${inviteRole}.`)
      setIsInviteOpen(false)
      setInviteName("")
      setInviteEmail("")
    } catch (e) {
      console.error("Error inviting user:", e)
      alert("Failed to invite user: " + e.message)
    } finally {
      setInviting(false)
    }
  }

  return (
    <div className="bg-[#F7F3EC] text-[#1c1c18] font-sans flex h-screen overflow-hidden antialiased">
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-[260px] min-h-screen relative overflow-hidden">
        <Header title="Control Center" />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          {/* Header Banner */}
          <div className="bg-white border border-[#E7DED2] p-4 md:p-5 rounded-lg flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#001d36]">
                Administration
              </h2>
              <p className="text-xs text-[#74777e] mt-0.5 max-w-2xl">
                Manage user permissions, monitor automated ingestion connectors, and review security audit logs.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-green-50 text-green-800 border border-green-200 text-xs px-2.5 py-1 rounded-md font-medium">
                ● System Healthy
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-[#E7DED2] gap-6">
            <button
              onClick={() => setActiveTab("roles")}
              className={`pb-2.5 text-xs font-semibold transition-colors border-b-2 cursor-pointer ${
                activeTab === "roles"
                  ? "border-[#001d36] text-[#001d36]"
                  : "border-transparent text-[#74777e] hover:text-[#001d36]"
              }`}
            >
              Users & Permissions
            </button>
            <button
              onClick={() => setActiveTab("apis")}
              className={`pb-2.5 text-xs font-semibold transition-colors border-b-2 cursor-pointer ${
                activeTab === "apis"
                  ? "border-[#001d36] text-[#001d36]"
                  : "border-transparent text-[#74777e] hover:text-[#001d36]"
              }`}
            >
              Data Sources
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`pb-2.5 text-xs font-semibold transition-colors border-b-2 cursor-pointer ${
                activeTab === "audit"
                  ? "border-[#001d36] text-[#001d36]"
                  : "border-transparent text-[#74777e] hover:text-[#001d36]"
              }`}
            >
              Audit Log
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "roles" && (
            <div className="bg-white border border-[#E7DED2] rounded-lg p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-xs text-[#001d36]">Registered Users</h3>
                <button 
                  onClick={() => setIsInviteOpen(true)}
                  className="bg-[#001d36] text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#17324d] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">person_add</span>
                  Invite User
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F2] border-b border-[#E7DED2] text-[#74777e]">
                    <tr>
                      <th className="p-2.5 font-medium">Name</th>
                      <th className="p-2.5 font-medium">Email</th>
                      <th className="p-2.5 font-medium">Role</th>
                      <th className="p-2.5 font-medium">Status</th>
                      <th className="p-2.5 font-medium">Last Login</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7DED2]">
                    {users.map((u) => (
                      <tr key={u.id || u.email} className="hover:bg-[#FAF7F2]">
                        <td className="p-2.5 font-medium text-[#001d36]">{u.name || "User"}</td>
                        <td className="p-2.5 font-mono text-[#74777e]">{u.email}</td>
                        <td className="p-2.5">
                          <span className="bg-[#FAF7F2] border border-[#E7DED2] text-[#001d36] px-2 py-0.5 rounded text-[10px] font-medium uppercase">
                            {u.role}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            u.status === "active" ? "bg-green-50 text-green-800" : "bg-slate-50 text-slate-700"
                          }`}>
                            {u.status || "Active"}
                          </span>
                        </td>
                        <td className="p-2.5 text-[#74777e]">{u.lastLogin || "Recent"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "apis" && (
            <div className="bg-white border border-[#E7DED2] rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-xs text-[#001d36]">Ingestion Connectors</h3>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-green-50 text-green-800">
                  Worker: {workerHealth?.worker?.running ? "Active" : "Idle"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {workerHealth?.worker?.services ? (
                  Object.entries(workerHealth.worker.services).map(([key, svc]) => (
                    <div key={key} className="p-3.5 border border-[#E7DED2] rounded-lg bg-[#FAF7F2] space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-xs text-[#001d36]">{svc.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white border border-[#E7DED2] text-slate-700">
                          {svc.status || "IDLE"}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#74777e]">
                        Interval: {Math.round(svc.intervalMs / 60000)}m · Events: <b>{svc.eventsProcessed || 0}</b>
                      </p>
                      <div className="flex justify-between items-center text-[10px] text-[#74777e] pt-1.5 border-t border-slate-200">
                        <span>Success: {svc.successCount || 0} | Fail: {svc.failureCount || 0}</span>
                        <span>{svc.lastRun ? new Date(svc.lastRun).toLocaleTimeString() : "Pending"}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full p-4 text-center text-xs text-[#74777e]">
                    Loading connector status...
                  </div>
                )}

                {/* Open-Meteo Card */}
                <div className="p-3.5 border border-[#E7DED2] rounded-lg bg-[#FAF7F2] space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-xs text-[#001d36]">Open-Meteo Weather</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white border border-[#E7DED2] text-slate-700">
                      On-demand
                    </span>
                  </div>
                  <p className="text-[11px] text-[#74777e]">
                    Cache: 15m (Weather) / 60m (Flood)
                  </p>
                  <div className="flex justify-between items-center text-[10px] text-[#74777e] pt-1.5 border-t border-slate-200">
                    <span>Precision: ~1.1km grid</span>
                    <span>Active</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "audit" && (
            <div className="bg-white border border-[#E7DED2] rounded-lg p-5 space-y-3">
              <h3 className="font-semibold text-xs text-[#001d36]">Security Audit Log</h3>
              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div key={log.id || log.action} className="p-2.5 border border-[#E7DED2] rounded-lg bg-[#FAF7F2] flex flex-wrap items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-medium text-[#001d36]">{log.action}</span>
                      <span className="text-[#74777e]">{log.details || log.user}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[10px] text-[#74777e]">{log.ip || "Local"}</span>
                      <span className="bg-white border border-[#E7DED2] text-[#001d36] font-medium px-2 py-0.5 rounded text-[10px]">
                        {log.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Invite User Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 bg-[#001d36]/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E7DED2] rounded-xl max-w-md w-full p-5 space-y-3.5 shadow-xl">
            <div className="flex justify-between items-center border-b border-[#E7DED2] pb-2.5">
              <h3 className="font-semibold text-sm text-[#001d36]">
                Invite User
              </h3>
              <button onClick={() => setIsInviteOpen(false)} className="text-[#74777e] hover:text-[#001d36] text-lg font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#43474d] mb-1">
                  Full Name
                </label>
                <input 
                  type="text"
                  placeholder="Officer J. Miller"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full border border-[#E7DED2] rounded-lg p-2 text-xs text-[#001d36] focus:border-[#001d36] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#43474d] mb-1">
                  Email Address
                </label>
                <input 
                  type="email"
                  placeholder="j.miller@agency.gov"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full border border-[#E7DED2] rounded-lg p-2 text-xs text-[#001d36] focus:border-[#001d36] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#43474d] mb-1">
                  Assigned Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full border border-[#E7DED2] rounded-lg p-2 text-xs text-[#001d36] focus:border-[#001d36] focus:outline-none cursor-pointer"
                >
                  <option value="responder">Responder</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer (Read-only)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-3.5 py-1.5 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-4 py-1.5 bg-[#001d36] text-white rounded-lg text-xs font-semibold hover:bg-[#17324d] disabled:opacity-50"
                >
                  {inviting ? "Inviting..." : "Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
export default AdminControlCenter
