import React, { useState, useEffect } from 'react'
import { Sidebar } from '../common/Sidebar'
import { Header } from '../common/Header'
import { listenToUsers, inviteAgencyUser, listenToAuditLogs, API_SERVICES_MONITOR } from '../../services/adminService'

export const AdminControlCenter = () => {
  const [activeTab, setActiveTab] = useState("roles")
  const [users, setUsers] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)

  // Invite modal state
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteName, setInviteName] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("responder")
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    const unsubUsers = listenToUsers((u) => setUsers(u))
    const unsubAudit = listenToAuditLogs((a) => {
      setAuditLogs(a)
      setLoading(false)
    })
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
      alert(`User ${inviteEmail} invited as ${inviteRole} and registered in Firestore!`)
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
        <Header title="Admin Control Center" />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Banner */}
          <div className="bg-[#001d36] text-white p-6 rounded-xl shadow-md flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[#D98B3A]">admin_panel_settings</span>
                System Administration & Governance
              </h2>
              <p className="text-xs text-white/70 mt-1 max-w-2xl">
                Manage user permissions, configure API data ingestion pipelines, inspect system security audit logs, and monitor cloud infrastructure health.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="bg-green-500/20 text-green-300 border border-green-400/40 text-xs px-3 py-1 rounded-full font-mono font-semibold">
                SYSTEM: ALL SYSTEMS NORMAL
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-[#E7DED2] gap-6">
            <button
              onClick={() => setActiveTab("roles")}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
                activeTab === "roles"
                  ? "border-[#D98B3A] text-[#001d36]"
                  : "border-transparent text-[#74777e] hover:text-[#001d36]"
              }`}
            >
              User Roles & Access Control
            </button>
            <button
              onClick={() => setActiveTab("apis")}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
                activeTab === "apis"
                  ? "border-[#D98B3A] text-[#001d36]"
                  : "border-transparent text-[#74777e] hover:text-[#001d36]"
              }`}
            >
              API & Ingestion Pipeline
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
                activeTab === "audit"
                  ? "border-[#D98B3A] text-[#001d36]"
                  : "border-transparent text-[#74777e] hover:text-[#001d36]"
              }`}
            >
              Security Audit Logs
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "roles" && (
            <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-[#001d36]">Active Agency Accounts (Firestore Stream)</h3>
                <button 
                  onClick={() => setIsInviteOpen(true)}
                  className="bg-[#001d36] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#17324d] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">person_add</span>
                  Invite Agency User
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F3EC] border-b border-[#E7DED2] text-[#74777e] uppercase font-mono">
                    <tr>
                      <th className="p-3">User Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Last Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7DED2]">
                    {users.map((u) => (
                      <tr key={u.id || u.email} className="hover:bg-[#F7F3EC]/50">
                        <td className="p-3 font-bold text-[#001d36]">{u.name || "Agency User"}</td>
                        <td className="p-3 font-mono text-[#74777e]">{u.email}</td>
                        <td className="p-3">
                          <span className="bg-[#001d36] text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}>
                            {u.status || "Active"}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[#74777e]">{u.lastLogin || "Recently"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "apis" && (
            <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-[#001d36]">Ingestion Connectors & External API Stream Latencies</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {API_SERVICES_MONITOR.map((api, idx) => (
                  <div key={idx} className="p-4 border border-[#E7DED2] rounded-lg bg-white space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm text-[#001d36]">{api.service}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        api.status === "Healthy" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {api.status}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-[#74777e]">{api.endpoint}</p>
                    <div className="flex justify-between items-center text-xs pt-1">
                      <span className="text-[#74777e]">Stream Latency</span>
                      <span className="font-mono font-bold text-green-700">{api.latency}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "audit" && (
            <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-[#001d36]">Immutable Security Audit Logs (Cloud Firestore)</h3>
              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div key={log.id || log.action} className="p-3 border border-[#E7DED2] rounded-lg bg-white flex flex-wrap items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-[#D98B3A]">{log.action}</span>
                      <span className="text-[#74777e]">{log.details || log.user}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] text-[#74777e]">{log.ip || "192.168.1.1"}</span>
                      <span className="bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded text-[10px]">
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
        <div className="fixed inset-0 z-50 bg-[#001d36]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E7DED2] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#E7DED2] pb-3">
              <h3 className="font-bold text-base text-[#001d36] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#D98B3A]">person_add</span>
                Invite Agency Officer
              </h3>
              <button onClick={() => setIsInviteOpen(false)} className="text-[#74777e] hover:text-[#001d36]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-[#74777e] mb-1">
                  Full Name
                </label>
                <input 
                  type="text"
                  placeholder="Officer J. Miller"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full border border-[#E7DED2] rounded-lg p-2 text-xs text-[#001d36] focus:border-[#D98B3A]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#74777e] mb-1">
                  Official Email Address
                </label>
                <input 
                  type="email"
                  placeholder="j.miller@agency.gov"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full border border-[#E7DED2] rounded-lg p-2 text-xs text-[#001d36] focus:border-[#D98B3A]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#74777e] mb-1">
                  Assigned Agency Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full border border-[#E7DED2] rounded-lg p-2 text-xs text-[#001d36] focus:border-[#D98B3A] cursor-pointer"
                >
                  <option value="responder">First Responder</option>
                  <option value="commander">Commander / Admin</option>
                  <option value="user">Public / Citizen</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-4 py-2 bg-[#001d36] text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#17324d] disabled:opacity-50"
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
