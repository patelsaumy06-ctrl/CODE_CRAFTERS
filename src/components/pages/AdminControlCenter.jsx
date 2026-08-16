import React, { useState } from 'react'
import { Sidebar } from '../common/Sidebar'
import { Header } from '../common/Header'

export const AdminControlCenter = () => {
  const [activeTab, setActiveTab] = useState("roles")

  const users = [
    { name: "Sarah Connor", email: "s.connor@agency.gov", role: "Commander", status: "Active", lastLogin: "10m ago" },
    { name: "Marcus Wright", email: "m.wright@agency.gov", role: "First Responder", status: "Active", lastLogin: "1h ago" },
    { name: "Elena Rostova", email: "e.rostova@agency.gov", role: "System Admin", status: "Active", lastLogin: "Just now" },
    { name: "David Kim", email: "d.kim@agency.gov", role: "Data Analyst", status: "Inactive", lastLogin: "2 days ago" },
  ]

  const apiServices = [
    { service: "USGS Seismic Stream", endpoint: "api.usgs.gov/v1/earthquakes", status: "Healthy", latency: "42ms" },
    { service: "NOAA Weather Radar", endpoint: "api.weather.gov/alerts", status: "Healthy", latency: "88ms" },
    { service: "X/Twitter Crisis Stream", endpoint: "api.x.com/2/tweets/search/stream", status: "Degraded", latency: "310ms" },
    { service: "Copernicus Satellite SAR", endpoint: "sentinel.copernicus.eu/api", status: "Healthy", latency: "120ms" },
  ]

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
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
                activeTab === "roles"
                  ? "border-[#D98B3A] text-[#001d36]"
                  : "border-transparent text-[#74777e] hover:text-[#001d36]"
              }`}
            >
              User Roles & Access Control
            </button>
            <button
              onClick={() => setActiveTab("apis")}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
                activeTab === "apis"
                  ? "border-[#D98B3A] text-[#001d36]"
                  : "border-transparent text-[#74777e] hover:text-[#001d36]"
              }`}
            >
              API & Ingestion Pipeline
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
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
                <h3 className="font-bold text-sm text-[#001d36]">Active Agency Accounts</h3>
                <button className="bg-[#001d36] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#17324d] transition-colors flex items-center gap-1.5">
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
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7DED2]">
                    {users.map((u, i) => (
                      <tr key={i} className="hover:bg-[#F7F3EC]/50 transition-colors">
                        <td className="p-3 font-bold text-[#001d36]">{u.name}</td>
                        <td className="p-3 text-[#74777e] font-mono">{u.email}</td>
                        <td className="p-3">
                          <span className="bg-[#001d36]/10 text-[#001d36] px-2 py-0.5 rounded font-bold">
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="p-3 text-[#74777e]">{u.lastLogin}</td>
                        <td className="p-3 text-right">
                          <button className="text-[#D98B3A] font-bold hover:underline">Edit Permissions</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "apis" && (
            <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-[#001d36]">Ingestion Data Sources</h3>
                <button className="bg-[#D98B3A] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-opacity-90 transition-opacity">
                  + Add Data Connector
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {apiServices.map((api, idx) => (
                  <div key={idx} className="p-4 border border-[#E7DED2] rounded-lg bg-white flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-sm text-[#001d36]">{api.service}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          api.status === "Healthy" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {api.status}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-[#74777e]">{api.endpoint}</p>
                    </div>
                    <div className="mt-4 pt-2 border-t border-slate-100 flex justify-between items-center text-xs text-[#74777e]">
                      <span>Latency: <strong className="text-[#001d36] font-mono">{api.latency}</strong></span>
                      <button className="text-[#001d36] font-bold hover:underline">Configure Key</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "audit" && (
            <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-6 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-[#001d36]">System Event Log</h3>
              <div className="font-mono text-xs space-y-2 bg-[#121d27] text-slate-200 p-4 rounded-lg">
                <div>[2026-08-15 22:50:12] AUTH_SUCCESS: User s.connor@agency.gov logged in from IP 192.168.1.45</div>
                <div>[2026-08-15 22:48:00] PIPELINE_INGEST: Processed 42,000 tweets from X API stream</div>
                <div>[2026-08-15 22:42:15] CLUSTER_TRIGGER: AI Model updated incident INC-9042 confidence to 94%</div>
                <div>[2026-08-15 22:30:00] SYSTEM_CHECK: Automated health check passed across all 12 microservices</div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
export default AdminControlCenter
