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
  const [selectedUrgency, setSelectedUrgency] = useState("Critical")

  const [dbIncidents, setDbIncidents] = useState([])
  const [loadingIncidents, setLoadingIncidents] = useState(true)

  // Incident Creation Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    disasterType: 'flood',
    severity: 'critical',
    status: 'active',
    address: 'Northern River Basin, Sector 4',
    source: 'Citizen Sensor & Satellite Ingestion',
    sourceUrl: ''
  })

  useEffect(() => {
    const unsubscribe = listenToIncidents((data) => {
      setDbIncidents(data)
      setLoadingIncidents(false)
    })
    return () => unsubscribe()
  }, [])

  // Map real Cloud Firestore incidents directly
  const displayIncidents = dbIncidents.map(inc => ({
    id: inc.id,
    title: inc.title,
    location: inc.location?.address || "Unknown Location",
    source: inc.source || "Sensor Array",
    urgency: inc.severity ? (inc.severity.charAt(0).toUpperCase() + inc.severity.slice(1)) : "Medium",
    confidence: inc.verified ? 99 : 85,
    time: inc.createdAt ? "Just now" : "Recently",
    badgeColor: inc.severity === 'critical' ? "bg-red-100 text-red-800 border-red-200"
      : inc.severity === 'high' ? "bg-orange-100 text-orange-800 border-orange-200"
      : "bg-amber-100 text-amber-800 border-amber-200"
  }))

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
          latitude: 34.0522,
          longitude: -118.2437,
          address: formData.address
        },
        source: formData.source,
        sourceUrl: formData.sourceUrl
      })
      alert("Incident successfully logged in Firestore!")
      setIsModalOpen(false)
      setFormData({
        title: '',
        description: '',
        disasterType: 'flood',
        severity: 'critical',
        status: 'active',
        address: 'Northern River Basin, Sector 4',
        source: 'Citizen Sensor & Satellite Ingestion',
        sourceUrl: ''
      })
    } catch (error) {
      console.error("Error creating incident:", error)
      alert("Failed to create incident: " + (error.message || "Permission denied"))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="bg-[#F7F3EC] text-[#1c1c18] font-sans flex h-screen overflow-hidden antialiased">
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-[260px] min-h-screen relative overflow-hidden">
        <Header title="Command Center" />

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Filter 1 */}
              <div className="flex items-center gap-2 bg-[#FFFDF9] border border-[#E7DED2] rounded-lg px-3 py-1.5 shadow-sm text-xs font-semibold text-[#1c1c18]">
                <span className="material-symbols-outlined text-[#74777e] text-sm">filter_list</span>
                <span>Disaster:</span>
                <select 
                  value={selectedDisaster} 
                  onChange={(e) => setSelectedDisaster(e.target.value)}
                  className="bg-transparent border-none font-bold text-[#001d36] focus:outline-none cursor-pointer"
                >
                  <option value="All">All Types</option>
                  <option value="Flood">Floods</option>
                  <option value="Earthquake">Earthquakes</option>
                  <option value="Wildfire">Wildfires</option>
                </select>
              </div>

              {/* Filter 2 */}
              <div className="flex items-center gap-2 bg-[#FFFDF9] border border-[#E7DED2] rounded-lg px-3 py-1.5 shadow-sm text-xs font-semibold text-[#1c1c18]">
                <span className="material-symbols-outlined text-[#74777e] text-sm">location_on</span>
                <span>Location:</span>
                <select 
                  value={selectedLocation} 
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="bg-transparent border-none font-bold text-[#001d36] focus:outline-none cursor-pointer"
                >
                  <option value="Global">Global View</option>
                  <option value="North America">North America</option>
                  <option value="Asia Pacific">Asia Pacific</option>
                  <option value="Europe">Europe</option>
                </select>
              </div>

              {/* Filter 3 */}
              <div className="flex items-center gap-2 bg-[#FFFDF9] border border-[#E7DED2] rounded-lg px-3 py-1.5 shadow-sm text-xs font-semibold text-[#1c1c18]">
                <span className="material-symbols-outlined text-[#74777e] text-sm">priority_high</span>
                <span>Urgency:</span>
                <select 
                  value={selectedUrgency} 
                  onChange={(e) => setSelectedUrgency(e.target.value)}
                  className="bg-transparent border-none font-bold text-[#001d36] focus:outline-none cursor-pointer"
                >
                  <option value="Critical">Critical & High</option>
                  <option value="All">All Levels</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {userRole !== "viewer" && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-[#001d36] text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#17324d] transition-colors shadow-sm flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">add_alert</span>
                New Incident Probe
              </button>
              )}
            </div>
          </div>

          {/* Metric KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center text-[#74777e] text-xs font-semibold uppercase tracking-wider">
                <span>Ingested Telemetry</span>
                <span className="material-symbols-outlined text-[#001d36]">sensors</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#001d36]">1,284,920</span>
                <span className="text-xs font-bold text-green-600 flex items-center">+18%</span>
              </div>
              <p className="text-[11px] text-[#74777e] mt-1">Multi-modal data points / hr</p>
            </div>

            <div className="bg-[#FFFDF9] border border-[#E7DED2] border-l-4 border-l-orange-500 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center text-[#74777e] text-xs font-semibold uppercase tracking-wider">
                <span>Active Clusters</span>
                <span className="material-symbols-outlined text-orange-500">warning</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#001d36]">{activeCount}</span>
                <span className="text-xs font-bold text-orange-600">Active</span>
              </div>
              <p className="text-[11px] text-[#74777e] mt-1">Real-time active incidents</p>
            </div>

            <div className="bg-[#FFFDF9] border border-[#E7DED2] border-l-4 border-l-green-500 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center text-[#74777e] text-xs font-semibold uppercase tracking-wider">
                <span>Verified Events</span>
                <span className="material-symbols-outlined text-green-600">verified</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#001d36]">{verifiedCount}</span>
                <span className="text-xs font-bold text-green-600">Confirmed</span>
              </div>
              <p className="text-[11px] text-[#74777e] mt-1">Firestore verified incidents</p>
            </div>

            <div className="bg-[#FFFDF9] border border-[#E7DED2] border-l-4 border-l-red-600 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center text-[#74777e] text-xs font-semibold uppercase tracking-wider">
                <span>High Priority Alerts</span>
                <span className="material-symbols-outlined text-red-600">campaign</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-red-600">{criticalCount}</span>
                <span className="text-xs font-bold text-red-600 animate-pulse">Urgent</span>
              </div>
              <p className="text-[11px] text-[#74777e] mt-1">Critical severity items</p>
            </div>
          </div>

          {/* Main Grid: Interactive Map + Intelligence Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px]">
            {/* Map Container */}
            <div className="lg:col-span-8 bg-[#FFFDF9] border border-[#E7DED2] rounded-xl flex flex-col overflow-hidden shadow-sm">
              <div className="px-5 py-3 border-b border-[#E7DED2] flex justify-between items-center bg-[#F1ECE4]">
                <h2 className="font-bold text-[#001d36] text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#D98B3A]">public</span>
                  Tactical GIS Threat Map
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-semibold bg-white border border-[#E7DED2] px-2 py-0.5 rounded text-[#001d36]">
                    LIVE TELEMETRY &bull; {dbIncidents.length} NODES
                  </span>
                </div>
              </div>

              <div className="flex-1 relative bg-[#121d27] p-2 flex flex-col justify-center">
                <DisasterMap
                  incidents={dbIncidents}
                  height="440px"
                  onSelectIncident={(inc) => navigate("/admin/incident", { state: { incidentId: inc.id } })}
                />
              </div>
            </div>

            {/* Live Intelligence Feed Sidebar */}
            <div className="lg:col-span-4 flex flex-col space-y-4">
              {/* AI Insight Card */}
              <div className="bg-[#FFFDF9] border border-[#D98B3A]/40 rounded-xl p-4 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-[#D98B3A] tracking-wider uppercase">
                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                    AI Executive Summary
                  </span>
                  <span className="text-[10px] font-mono text-[#74777e]">Live Stream</span>
                </div>
                <p className="text-xs text-[#1c1c18] leading-relaxed">
                  High-density social clusters combined with seismic telemetry indicate severe water rise near District 4. Emergency evacuation suggested.
                </p>
                <div className="mt-3 pt-2 border-t border-[#E7DED2] flex justify-between items-center text-[10px]">
                  <span className="text-[#74777e]">Verified by 14 Data Sources</span>
                  <button 
                    onClick={() => navigate("/admin/intelligence-feed")}
                    className="text-[#001d36] font-bold hover:underline"
                  >
                    View Stream →
                  </button>
                </div>
              </div>

              {/* Incidents Feed */}
              <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-4 flex-1 flex flex-col shadow-sm">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E7DED2]">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#001d36]">Real-time Incident Feed</h3>
                  <button 
                    onClick={() => navigate("/admin/intelligence-feed")}
                    className="text-[11px] font-semibold text-[#D98B3A] hover:underline"
                  >
                    Full Stream
                  </button>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px]">
                  {displayIncidents.map((inc) => (
                    <div 
                      key={inc.id}
                      onClick={() => navigate("/admin/incident")}
                      className="p-3 border border-[#E7DED2] rounded-lg hover:border-[#D98B3A] transition-all cursor-pointer bg-white hover:shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${inc.badgeColor}`}>
                          {inc.urgency}
                        </span>
                        <span className="text-[10px] text-[#74777e] font-mono">{inc.time}</span>
                      </div>
                      <h4 className="font-bold text-xs text-[#001d36]">{inc.title}</h4>
                      <p className="text-[11px] text-[#74777e] mt-0.5">{inc.location}</p>
                      
                      <div className="mt-2 flex items-center justify-between text-[10px] text-[#74777e] pt-2 border-t border-slate-100">
                        <span>{inc.source}</span>
                        <span className="font-mono font-bold text-green-700">{inc.confidence}% Conf.</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* New Incident Probe Modal */}
      {userRole !== "viewer" && isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#001d36]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E7DED2] rounded-2xl shadow-2xl w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#E7DED2] pb-3">
              <h3 className="text-lg font-bold text-[#001d36] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#D98B3A]">add_alert</span>
                Report / Ingest New Disaster Incident
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-[#74777e] hover:text-[#001d36] text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-[#001d36] mb-1">Incident Title *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Flash Flood & Levee Breach"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E7DED2] rounded-lg text-xs font-medium focus:outline-none focus:border-[#D98B3A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#001d36] mb-1">Description</label>
                <textarea 
                  rows="3"
                  placeholder="Provide incident details, casualty reports, or infrastructure impact..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E7DED2] rounded-lg text-xs font-medium focus:outline-none focus:border-[#D98B3A]"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#001d36] mb-1">Disaster Type</label>
                  <select 
                    value={formData.disasterType}
                    onChange={(e) => setFormData({ ...formData, disasterType: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E7DED2] rounded-lg text-xs font-semibold focus:outline-none focus:border-[#D98B3A]"
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
                  <label className="block text-xs font-bold uppercase text-[#001d36] mb-1">Severity Level</label>
                  <select 
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E7DED2] rounded-lg text-xs font-semibold focus:outline-none focus:border-[#D98B3A]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#001d36] mb-1">Status</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E7DED2] rounded-lg text-xs font-semibold focus:outline-none focus:border-[#D98B3A]"
                  >
                    <option value="reported">Reported</option>
                    <option value="investigating">Investigating</option>
                    <option value="verified">Verified</option>
                    <option value="active">Active</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[#001d36] mb-1">Source / Agency</label>
                  <input 
                    type="text"
                    placeholder="e.g. Hydro Sensor Array"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E7DED2] rounded-lg text-xs font-medium focus:outline-none focus:border-[#D98B3A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#001d36] mb-1">Location Address</label>
                <input 
                  type="text"
                  placeholder="e.g. Northern River Basin, Sector 4"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E7DED2] rounded-lg text-xs font-medium focus:outline-none focus:border-[#D98B3A]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#E7DED2]">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-[#74777e] hover:bg-[#F7F3EC] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={creating}
                  className="bg-[#001d36] text-white px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#17324d] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {creating ? "Ingesting..." : "Submit to Firestore"}
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
