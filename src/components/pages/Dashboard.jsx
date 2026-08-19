import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidebar } from '../common/Sidebar'
import { Header } from '../common/Header'
import { DisasterMap } from '../common/DisasterMap'
import { listenToIncidents, createIncident } from '../../services/incidentService'
import { useAuth } from '../../context/AuthContext'

export const Dashboard = () => {
  const navigate = useNavigate()
  const { userRole } = useAuth()
  const [selectedDisaster, setSelectedDisaster] = useState("All")
  const [selectedLocation, setSelectedLocation] = useState("Global")
  const [selectedUrgency, setSelectedUrgency] = useState("All")

  const [dbIncidents, setDbIncidents] = useState([])
  const [loadingIncidents, setLoadingIncidents] = useState(true)

  // Incident Creation Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    disasterType: 'flood',
    severity: 'high',
    status: 'active',
    address: 'Sector 4, River Basin',
    source: 'Sensor Alert',
    sourceUrl: ''
  })

  useEffect(() => {
    const unsubscribe = listenToIncidents((data) => {
      setDbIncidents(data || [])
      setLoadingIncidents(false)
    })
    return () => unsubscribe()
  }, [])

  // Filtered incidents based on controls
  const filteredIncidents = dbIncidents.filter(inc => {
    if (selectedDisaster !== "All" && (inc.disasterType || "").toLowerCase() !== selectedDisaster.toLowerCase()) {
      return false
    }
    if (selectedUrgency === "Critical" && (inc.severity || "").toLowerCase() !== "critical" && (inc.severity || "").toLowerCase() !== "high") {
      return false
    }
    return true
  })

  const displayIncidents = filteredIncidents.map(inc => ({
    id: inc.id,
    title: inc.title || "Incident Report",
    location: inc.location?.address || `${Number(inc.location?.latitude ?? 0).toFixed(2)}°, ${Number(inc.location?.longitude ?? 0).toFixed(2)}°`,
    source: inc.source || "Sensor Feed",
    severity: inc.severity ? (inc.severity.charAt(0).toUpperCase() + inc.severity.slice(1)) : "Medium",
    verified: inc.verified || inc.verificationStatus === 'verified',
    confidence: Math.round((Number(inc.confidence) <= 1 ? Number(inc.confidence) * 100 : Number(inc.confidence)) || 85),
    time: inc.createdAt ? "Recent" : "Logged",
    badgeColor: inc.severity === 'critical' 
      ? "bg-red-50 text-red-700 border-red-200"
      : inc.severity === 'high' 
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-slate-50 text-slate-700 border-slate-200"
  }))

  const totalCount = dbIncidents.length
  const activeCount = dbIncidents.filter(i => i.status === 'active' || i.status === 'reported' || i.status === 'investigating').length
  const verifiedCount = dbIncidents.filter(i => i.verified || i.status === 'verified').length
  const criticalCount = dbIncidents.filter(i => i.severity === 'critical').length

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      await createIncident({
        title: formData.title,
        description: formData.description,
        disasterType: formData.disasterType,
        severity: formData.severity,
        status: formData.status,
        location: {
          latitude: 19.076,
          longitude: 72.8777,
          address: formData.address
        },
        source: formData.source,
        sourceUrl: formData.sourceUrl
      })
      alert("Incident logged successfully.")
      setIsModalOpen(false)
      setFormData({
        title: '',
        description: '',
        disasterType: 'flood',
        severity: 'high',
        status: 'active',
        address: 'Sector 4, River Basin',
        source: 'Sensor Alert',
        sourceUrl: ''
      })
    } catch (error) {
      console.error("Error creating incident:", error)
      alert("Failed to log incident: " + (error.message || "Permission denied"))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="bg-[#F7F3EC] text-[#1c1c18] font-sans flex h-screen overflow-hidden antialiased">
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-[260px] min-h-screen relative overflow-hidden">
        <Header title="Dashboard" />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">

          {/* Filters and Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-[#E7DED2]">
            <div className="flex flex-wrap items-center gap-3">
              {/* Disaster Type Filter */}
              <div className="flex items-center gap-1.5 text-xs text-[#43474d]">
                <span className="material-symbols-outlined text-[#74777e] text-base">filter_list</span>
                <span className="font-medium">Type:</span>
                <select 
                  value={selectedDisaster} 
                  onChange={(e) => setSelectedDisaster(e.target.value)}
                  className="bg-[#F7F3EC] border border-[#E7DED2] rounded px-2 py-1 font-medium text-[#001d36] focus:outline-none cursor-pointer"
                >
                  <option value="All">All Types</option>
                  <option value="flood">Floods</option>
                  <option value="earthquake">Earthquakes</option>
                  <option value="wildfire">Wildfires</option>
                  <option value="cyclone">Cyclones</option>
                  <option value="storm">Storms</option>
                  <option value="drought">Drought</option>
                </select>
              </div>

              {/* Location View Filter */}
              <div className="flex items-center gap-1.5 text-xs text-[#43474d]">
                <span className="material-symbols-outlined text-[#74777e] text-base">location_on</span>
                <span className="font-medium">Region:</span>
                <select 
                  value={selectedLocation} 
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="bg-[#F7F3EC] border border-[#E7DED2] rounded px-2 py-1 font-medium text-[#001d36] focus:outline-none cursor-pointer"
                >
                  <option value="Global">All Regions</option>
                  <option value="Asia">Asia Pacific</option>
                  <option value="Europe">Europe</option>
                  <option value="Americas">Americas</option>
                </select>
              </div>

              {/* Urgency Filter */}
              <div className="flex items-center gap-1.5 text-xs text-[#43474d]">
                <span className="material-symbols-outlined text-[#74777e] text-base">priority_high</span>
                <span className="font-medium">Severity:</span>
                <select 
                  value={selectedUrgency} 
                  onChange={(e) => setSelectedUrgency(e.target.value)}
                  className="bg-[#F7F3EC] border border-[#E7DED2] rounded px-2 py-1 font-medium text-[#001d36] focus:outline-none cursor-pointer"
                >
                  <option value="All">All Levels</option>
                  <option value="Critical">Critical & High</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {userRole !== "viewer" && (
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-[#001d36] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#17324d] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  Report Incident
                </button>
              )}
            </div>
          </div>

          {/* Metric KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-white border border-[#E7DED2] rounded-lg p-4">
              <div className="text-xs font-medium text-[#74777e]">Total Incidents</div>
              <div className="mt-1 text-2xl font-bold text-[#001d36]">{loadingIncidents ? "—" : totalCount}</div>
              <p className="text-[11px] text-[#74777e] mt-0.5">Recorded in database</p>
            </div>

            <div className="bg-white border border-[#E7DED2] rounded-lg p-4">
              <div className="text-xs font-medium text-[#74777e]">Active Incidents</div>
              <div className="mt-1 text-2xl font-bold text-[#001d36]">{loadingIncidents ? "—" : activeCount}</div>
              <p className="text-[11px] text-[#74777e] mt-0.5">Under response or review</p>
            </div>

            <div className="bg-white border border-[#E7DED2] rounded-lg p-4">
              <div className="text-xs font-medium text-[#74777e]">Verified Incidents</div>
              <div className="mt-1 text-2xl font-bold text-green-700">{loadingIncidents ? "—" : verifiedCount}</div>
              <p className="text-[11px] text-[#74777e] mt-0.5">Confirmed by multiple sources</p>
            </div>

            <div className="bg-white border border-[#E7DED2] rounded-lg p-4">
              <div className="text-xs font-medium text-[#74777e]">Critical Severity</div>
              <div className="mt-1 text-2xl font-bold text-red-600">{loadingIncidents ? "—" : criticalCount}</div>
              <p className="text-[11px] text-[#74777e] mt-0.5">Requiring immediate attention</p>
            </div>
          </div>

          {/* Main Grid: Incident Map + Recent Incidents List */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[540px]">
            {/* Map Container */}
            <div className="lg:col-span-8 bg-white border border-[#E7DED2] rounded-lg flex flex-col overflow-hidden">
              <div className="px-4 py-2.5 border-b border-[#E7DED2] flex justify-between items-center bg-[#FAF7F2]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#001d36] text-lg">map</span>
                  <h2 className="font-semibold text-[#001d36] text-xs">Incident Map</h2>
                </div>
                <span className="text-[11px] font-mono text-[#74777e]">
                  {filteredIncidents.length} incidents displayed
                </span>
              </div>

              <div className="flex-1 relative bg-[#e2e8f0] p-1 flex flex-col justify-center">
                <DisasterMap
                  incidents={filteredIncidents}
                  height="450px"
                  onSelectIncident={(inc) => navigate("/admin/incident", { state: { incidentId: inc.id } })}
                />
              </div>
            </div>

            {/* Incidents List Panel */}
            <div className="lg:col-span-4 flex flex-col space-y-4">
              {/* Status Summary Banner */}
              <div className="bg-white border border-[#E7DED2] rounded-lg p-3.5 text-xs text-[#43474d] space-y-1">
                <div className="font-semibold text-[#001d36]">Status Summary</div>
                <p className="text-[11px] text-[#74777e] leading-relaxed">
                  {loadingIncidents
                    ? "Loading incident status..."
                    : `${activeCount} active incidents · ${verifiedCount} verified · ${criticalCount} critical`}
                </p>
              </div>

              {/* Incidents List */}
              <div className="bg-white border border-[#E7DED2] rounded-lg p-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E7DED2]">
                  <h3 className="font-semibold text-xs text-[#001d36]">Recent Incidents</h3>
                  <button 
                    onClick={() => navigate("/admin/incident")}
                    className="text-[11px] font-medium text-[#001d36] hover:underline"
                  >
                    View all
                  </button>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[380px]">
                  {displayIncidents.length === 0 ? (
                    <div className="text-center py-8 text-xs text-[#74777e]">
                      No incidents match current filter.
                    </div>
                  ) : (
                    displayIncidents.map((inc) => (
                      <div 
                        key={inc.id}
                        onClick={() => navigate("/admin/incident", { state: { incidentId: inc.id } })}
                        className="p-3 border border-[#E7DED2] rounded-lg hover:border-[#74777e] transition-colors cursor-pointer bg-white"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${inc.badgeColor}`}>
                            {inc.severity}
                          </span>
                          <span className="text-[10px] text-[#74777e]">
                            {inc.verified ? "Verified" : "Unverified"}
                          </span>
                        </div>
                        <h4 className="font-semibold text-xs text-[#001d36] truncate">{inc.title}</h4>
                        <p className="text-[11px] text-[#74777e] mt-0.5 truncate">{inc.location}</p>
                        
                        <div className="mt-2 flex items-center justify-between text-[10px] text-[#74777e] pt-1.5 border-t border-slate-100">
                          <span>{inc.source}</span>
                          <span className="font-medium text-slate-700">{inc.confidence}% confidence</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Report Incident Modal */}
      {userRole !== "viewer" && isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#001d36]/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E7DED2] rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#E7DED2] pb-3">
              <h3 className="text-base font-semibold text-[#001d36]">
                Report Incident
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-[#74777e] hover:text-[#001d36] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#43474d] mb-1">Incident Title *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Flash flood near River Bridge"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E7DED2] rounded-lg text-xs font-medium focus:outline-none focus:border-[#001d36]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#43474d] mb-1">Description</label>
                <textarea 
                  rows="3"
                  placeholder="Describe observed conditions, damage, or urgent needs..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E7DED2] rounded-lg text-xs font-medium focus:outline-none focus:border-[#001d36]"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#43474d] mb-1">Disaster Type</label>
                  <select 
                    value={formData.disasterType}
                    onChange={(e) => setFormData({ ...formData, disasterType: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E7DED2] rounded-lg text-xs font-medium focus:outline-none focus:border-[#001d36]"
                  >
                    <option value="earthquake">Earthquake</option>
                    <option value="flood">Flood</option>
                    <option value="cyclone">Cyclone</option>
                    <option value="landslide">Landslide</option>
                    <option value="wildfire">Wildfire</option>
                    <option value="storm">Storm</option>
                    <option value="drought">Drought</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#43474d] mb-1">Severity Level</label>
                  <select 
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E7DED2] rounded-lg text-xs font-medium focus:outline-none focus:border-[#001d36]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#43474d] mb-1">Status</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E7DED2] rounded-lg text-xs font-medium focus:outline-none focus:border-[#001d36]"
                  >
                    <option value="reported">Reported</option>
                    <option value="investigating">Investigating</option>
                    <option value="verified">Verified</option>
                    <option value="active">Active</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#43474d] mb-1">Source</label>
                  <input 
                    type="text"
                    placeholder="e.g. Field Observer, Sensor"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E7DED2] rounded-lg text-xs font-medium focus:outline-none focus:border-[#001d36]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#43474d] mb-1">Location / Address</label>
                <input 
                  type="text"
                  placeholder="e.g. Sector 4, River Basin"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E7DED2] rounded-lg text-xs font-medium focus:outline-none focus:border-[#001d36]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E7DED2]">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-[#74777e] hover:bg-[#F7F3EC] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={creating}
                  className="bg-[#001d36] text-white px-5 py-2 rounded-lg text-xs font-semibold hover:bg-[#17324d] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {creating ? "Submitting..." : "Submit Incident"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
export default Dashboard
