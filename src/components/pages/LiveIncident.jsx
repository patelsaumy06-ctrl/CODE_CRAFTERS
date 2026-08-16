import React from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../../firebase/firebase'

export const LiveIncident = () => {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("role")
    navigate("/login")
  }

  const addIncident = async () => {
    try {
      const docRef = await addDoc(collection(db, "incidents"), {
        title: "Bridge Collapse",
        location: "Gandhinagar",
        severity: "High",
        status: "Active",
        createdAt: new Date().toISOString(),
      })
      alert(`Added Incident with ID: ${docRef.id}`)
      console.log("Added:", docRef.id)
    } catch (error) {
      console.error("Firebase error:", error)
      alert(`Firebase error: ${error.message}`)
    }
  }

  return (
    <div className="bg-surface-container-low text-on-surface font-body-md antialiased flex h-screen overflow-hidden">
      {/* Side Navigation Bar */}
      <aside className="fixed left-0 top-0 h-screen w-[250px] bg-primary-container text-on-primary-container shadow-sm border-r border-outline-variant flex flex-col py-[24px] z-30 hidden md:flex">
        {/* Header */}
        <div className="px-4 mb-[32px]">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-headline-md text-headline-md font-bold text-on-primary leading-none cursor-pointer" onClick={() => navigate("/")}>DisasterLens AI</h1>
          </div>
          <p className="font-data-label text-[11px] tracking-[0.05em] font-semibold text-on-primary-container opacity-80">Disaster Intelligence Platform</p>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 space-y-1">
          <a onClick={() => navigate("/admin")} className="flex items-center gap-3 text-on-primary-container hover:text-on-primary px-4 py-2 mx-2 hover:bg-primary transition-colors duration-200 rounded-lg cursor-pointer">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-data-label text-[11px] tracking-[0.05em] font-semibold">Command Center</span>
          </a>
          {/* ACTIVE TAB */}
          <a className="flex items-center gap-3 rounded-lg px-4 py-2 mx-2 scale-95 transition-transform shadow-sm cursor-pointer" style={{ backgroundColor: 'rgb(217, 139, 58)', color: 'rgb(255, 255, 255)' }}>
            <span className="material-symbols-outlined">emergency</span>
            <span className="font-data-label text-[11px] tracking-[0.05em] font-bold">Live Incidents</span>
          </a>
          <a onClick={() => navigate("/admin/analytics")} className="flex items-center gap-3 text-on-primary-container hover:text-on-primary px-4 py-2 mx-2 hover:bg-primary transition-colors duration-200 rounded-lg cursor-pointer">
            <span className="material-symbols-outlined">analytics</span>
            <span className="font-data-label text-[11px] tracking-[0.05em] font-semibold">Analytics &amp; Reports</span>
          </a>

        </nav>

        {/* CTA & Footer */}
        <div className="mt-auto px-4 space-y-4">
          <button className="w-full font-data-label text-[11px] tracking-[0.05em] font-bold py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2" style={{ backgroundColor: 'rgb(217, 139, 58)', color: 'rgb(255, 255, 255)' }}>
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Report
          </button>
          <div className="pt-4 border-t border-tertiary-container space-y-1">
            <a className="flex items-center gap-3 text-on-primary-container hover:text-on-primary px-4 py-2 mx-2 hover:bg-primary transition-colors duration-200 rounded-lg cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">settings</span>
              <span className="font-data-label text-[11px] tracking-[0.05em] font-semibold">Settings</span>
            </a>
            <button onClick={handleLogout} className="flex items-center gap-3 text-on-primary-container hover:text-on-primary px-4 py-2 mx-2 hover:bg-primary transition-colors duration-200 rounded-lg w-full cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">logout</span>
              <span className="font-data-label text-[11px] tracking-[0.05em] font-semibold">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Top Navigation Bar */}
      <nav className="fixed top-0 right-0 w-[calc(100%-250px)] h-16 bg-surface border-b border-outline-variant flex justify-between items-center px-[24px] z-20">
        <div className="flex items-center gap-6">
          <span className="font-headline-md text-[18px] leading-[24px] font-semibold text-primary">Command Center</span>
          <div className="flex gap-4">
            <a className="text-on-surface-variant hover:text-primary transition-colors font-body-md text-body-md cursor-pointer" onClick={() => navigate("/admin")}>Dashboard</a>
            <a className="text-secondary font-bold border-b-2 border-secondary font-body-md text-body-md cursor-pointer">Incidents</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors font-body-md text-body-md cursor-pointer">Resources</a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:opacity-80 transition-opacity">search</span>
          <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:opacity-80 transition-opacity">notifications</span>
          <button className="bg-primary text-on-primary px-4 py-2 rounded font-data-label text-[11px] tracking-[0.05em] font-semibold hover:bg-primary-container transition-colors">System Status</button>
          <img
            alt="User Profile Avatar"
            className="w-8 h-8 rounded-full border border-outline-variant cursor-pointer"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCX28dV9nHN3t4wOSGUTRw343dcFaFv2VGkbEqRw85ZB8eE12sBouJleo73wVUxDu8f0d1JEC5e4ul8qr7jIvvXEAJdpS7K2QWw0jfrxoIHFP26zxTu77HNP1Ws_9rJCD4HWD3FejV_Dy9-BzEgnGWLPy-5kKy4M8clEjQO5MCdB9kRZPSiHFz0QYCGm5W-GGKlpW3SdbWdcog67FDEXD8nMjGYaNsQD749EmResx3HUpSDhmX5PHY1"
          />
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-[250px] mt-16 p-[24px] h-[calc(100vh-64px)] overflow-hidden flex flex-col relative">
        {/* Header Section */}
        <header className="mb-[16px] flex-shrink-0">
          <h2 className="text-[36px] leading-[44px] tracking-[-0.02em] font-bold text-primary font-headline-md mb-1">Live Intelligence Feed</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-3">Real-time stream of classified disaster information.</p>
          <div className="flex items-center gap-4 bg-surface-container px-4 py-2 rounded-lg inline-flex shadow-[0_2px_4px_rgba(23,50,77,0.05)]" style={{ border: '1px solid #E7DED2' }}>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[#3D8B63]" style={{ animation: 'pulse-green 2s infinite' }}></span>
              <span className="font-data-label text-[11px] tracking-[0.05em] font-bold text-[#3D8B63]">LIVE</span>
            </div>
            <div className="w-px h-4 bg-outline-variant"></div>
            <span className="font-data-value text-data-value text-on-surface">Items Processed: 142,892</span>
            <div className="w-px h-4 bg-outline-variant"></div>
            <span className="font-data-value text-data-value text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">schedule</span> 12s ago
            </span>
          </div>
        </header>

        {/* Filter Bar */}
        <section className="mb-[16px] flex-shrink-0 bg-surface rounded-lg p-2 shadow-[0_2px_4px_rgba(23,50,77,0.05)] flex flex-wrap gap-2 items-center" style={{ border: '1px solid #E7DED2' }}>
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
            <input
              className="w-full pl-9 pr-3 py-2 bg-surface-container-low rounded text-body-md outline-none placeholder-outline transition-colors focus:ring-1 focus:ring-secondary"
              style={{ border: '1px solid #E7DED2' }}
              placeholder="Search Intelligence..."
              type="text"
            />
          </div>
          {/* Dropdowns */}
          <select className="bg-surface-container-low rounded py-2 px-3 font-data-value text-data-value text-on-surface outline-none cursor-pointer focus:ring-1 focus:ring-secondary" style={{ border: '1px solid #E7DED2' }}>
            <option>All Sources</option>
            <option>Twitter/X</option>
            <option>NewsAPI</option>
            <option>Reddit</option>
            <option>GDACS</option>
            <option>IoT Sensors</option>
          </select>
          <select className="bg-surface-container-low rounded py-2 px-3 font-data-value text-data-value text-on-surface outline-none cursor-pointer focus:ring-1 focus:ring-secondary" style={{ border: '1px solid #E7DED2' }}>
            <option>All Types</option>
            <option>Flood</option>
            <option>Wildfire</option>
            <option>Earthquake</option>
            <option>Hurricane</option>
          </select>
          <select className="bg-surface-container-low rounded py-2 px-3 font-data-value text-data-value text-on-surface outline-none cursor-pointer focus:ring-1 focus:ring-secondary" style={{ border: '1px solid #E7DED2' }}>
            <option>All Severities</option>
            <option>Critical</option>
            <option>Warning</option>
            <option>Moderate</option>
          </select>
          <button className="bg-surface-container hover:bg-surface-container-high text-on-surface px-3 py-2 rounded flex items-center gap-2 font-data-value text-data-value transition-colors" style={{ border: '1px solid #E7DED2' }}>
            <span className="material-symbols-outlined text-[18px]">calendar_month</span> Date
          </button>
          <button className="bg-surface-container hover:bg-surface-container-high text-on-surface px-3 py-2 rounded flex items-center gap-2 font-data-value text-data-value transition-colors" style={{ border: '1px solid #E7DED2' }}>
            <span className="material-symbols-outlined text-[18px]">location_on</span> Location
          </button>
          <button
            onClick={addIncident}
            className="bg-[#D98B3A] text-white px-3 py-2 rounded flex items-center gap-2 font-data-value text-data-value transition-colors hover:opacity-90 cursor-pointer ml-auto font-bold"
          >
            <span className="material-symbols-outlined text-[18px]">add</span> Add Incident
          </button>
        </section>

        {/* Intelligence Feed (Scrollable) */}
        <div className="flex-1 overflow-y-auto pr-2 pb-8 flex flex-col gap-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#dddad3 transparent' }}>
          {/* Feed Item 1 (Critical) */}
          <article className="bg-[#FFFDF9] rounded-[16px] p-4 shadow-[0_2px_4px_rgba(23,50,77,0.05)] hover:border-secondary transition-colors group relative" style={{ border: '1px solid #E7DED2' }}>
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D64545] rounded-l-[16px]"></div>
            <div className="pl-2">
              <header className="flex justify-between items-start mb-2 pb-2" style={{ borderBottom: '1px solid #E7DED2' }}>
                <div className="flex items-center gap-2">
                  <span className="bg-[#D64545]/10 text-[#D64545] border border-[#D64545]/20 px-2 py-1 rounded-full font-data-label text-[11px] tracking-[0.05em] font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">water_drop</span> Flash Flood
                  </span>
                  <span className="bg-[#D64545] text-white px-2 py-1 rounded-full font-data-label text-[10px] tracking-wider uppercase font-bold">Critical</span>
                </div>
                <span className="text-on-surface-variant font-data-value text-data-value flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">schedule</span> 1m ago
                </span>
              </header>
              <p className="font-body-md text-body-md text-on-surface mb-3 leading-relaxed">
                Sensor array detected rapid water level rise exceeding 3m/hr. Evacuation protocols recommended for low-lying residential areas. Structural integrity of primary levee compromised.
              </p>
              <footer className="flex items-center justify-between mt-auto pt-2">
                <div className="flex items-center gap-3">
                  <span className="bg-surface-container-highest px-2 py-1 rounded font-data-value text-[11px] text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">sensors</span> IoT Sensors
                  </span>
                  <span className="text-on-surface-variant font-data-value text-[12px] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">pin_drop</span> River Basin, Zone 4
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 border-r border-dashed border-[#E8B66A] pr-4">
                    <span className="material-symbols-outlined text-secondary text-[16px]">lens_blur</span>
                    <span className="font-data-value text-data-value text-secondary font-semibold">AI Conf: 94%</span>
                    <span className="bg-secondary/10 text-secondary px-2 py-0.5 rounded font-data-label text-[10px]">High Rel</span>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-primary hover:text-secondary" title="Investigate"><span className="material-symbols-outlined text-[20px]">troubleshoot</span></button>
                    <button className="text-primary hover:text-secondary" title="Share"><span className="material-symbols-outlined text-[20px]">share</span></button>
                  </div>
                </div>
              </footer>
            </div>
          </article>

          {/* Feed Item 2 (Warning) */}
          <article className="bg-[#FFFDF9] rounded-[16px] p-4 shadow-[0_2px_4px_rgba(23,50,77,0.05)] hover:border-secondary transition-colors group relative" style={{ border: '1px solid #E7DED2' }}>
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D98B3A] rounded-l-[16px]"></div>
            <div className="pl-2">
              <header className="flex justify-between items-start mb-2 pb-2" style={{ borderBottom: '1px solid #E7DED2' }}>
                <div className="flex items-center gap-2">
                  <span className="bg-[#D98B3A]/10 text-[#D98B3A] border border-[#D98B3A]/20 px-2 py-1 rounded-full font-data-label text-[11px] tracking-[0.05em] font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">local_fire_department</span> Wildfire Risk
                  </span>
                  <span className="bg-[#D98B3A] text-white px-2 py-1 rounded-full font-data-label text-[10px] tracking-wider uppercase font-bold">Warning</span>
                </div>
                <span className="text-on-surface-variant font-data-value text-data-value flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">schedule</span> 14m ago
                </span>
              </header>
              <p className="font-body-md text-body-md text-on-surface mb-3 leading-relaxed">
                Satellite imagery indicates thermal anomalies aligning with high-velocity wind vectors. Dry vegetation index at critical levels. Risk of rapid spread toward eastern suburbs.
              </p>
              <footer className="flex items-center justify-between mt-auto pt-2">
                <div className="flex items-center gap-3">
                  <span className="bg-surface-container-highest px-2 py-1 rounded font-data-value text-[11px] text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">satellite_alt</span> GDACS
                  </span>
                  <span className="text-on-surface-variant font-data-value text-[12px] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">pin_drop</span> Eastern Ridge Sector
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 border-r border-dashed border-[#E8B66A] pr-4">
                    <span className="material-symbols-outlined text-secondary text-[16px]">lens_blur</span>
                    <span className="font-data-value text-data-value text-secondary font-semibold">AI Conf: 88%</span>
                    <span className="bg-secondary/10 text-secondary px-2 py-0.5 rounded font-data-label text-[10px]">Med Rel</span>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-primary hover:text-secondary" title="Investigate"><span className="material-symbols-outlined text-[20px]">troubleshoot</span></button>
                    <button className="text-primary hover:text-secondary" title="Share"><span className="material-symbols-outlined text-[20px]">share</span></button>
                  </div>
                </div>
              </footer>
            </div>
          </article>

          {/* Feed Item 3 (Moderate) */}
          <article className="bg-[#FFFDF9] rounded-[16px] p-4 shadow-[0_2px_4px_rgba(23,50,77,0.05)] hover:border-secondary transition-colors group relative" style={{ border: '1px solid #E7DED2' }}>
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#3D8B63] rounded-l-[16px]"></div>
            <div className="pl-2">
              <header className="flex justify-between items-start mb-2 pb-2" style={{ borderBottom: '1px solid #E7DED2' }}>
                <div className="flex items-center gap-2">
                  <span className="bg-[#3D8B63]/10 text-[#3D8B63] border border-[#3D8B63]/20 px-2 py-1 rounded-full font-data-label text-[11px] tracking-[0.05em] font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">tab_duplicate</span> Seismic Activity
                  </span>
                  <span className="bg-surface-container-high text-on-surface-variant px-2 py-1 rounded-full font-data-label text-[10px] tracking-wider uppercase font-bold">Moderate</span>
                </div>
                <span className="text-on-surface-variant font-data-value text-data-value flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">schedule</span> 32m ago
                </span>
              </header>
              <p className="font-body-md text-body-md text-on-surface mb-3 leading-relaxed">
                Multiple social media reports of minor tremors. Verified by local geological survey preliminary data. Magnitude estimated at 3.2. No structural damage reported initially.
              </p>
              <footer className="flex items-center justify-between mt-auto pt-2">
                <div className="flex items-center gap-3">
                  <span className="bg-[#1DA1F2]/10 text-[#1DA1F2] px-2 py-1 rounded font-data-value text-[11px] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">public</span> Twitter/X
                  </span>
                  <span className="text-on-surface-variant font-data-value text-[12px] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">pin_drop</span> City Center Grid
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 border-r border-dashed border-[#E8B66A] pr-4">
                    <span className="material-symbols-outlined text-secondary text-[16px]">lens_blur</span>
                    <span className="font-data-value text-data-value text-secondary font-semibold">AI Conf: 76%</span>
                    <span className="bg-secondary/10 text-secondary px-2 py-0.5 rounded font-data-label text-[10px]">Low Rel</span>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-primary hover:text-secondary" title="Investigate"><span className="material-symbols-outlined text-[20px]">troubleshoot</span></button>
                    <button className="text-primary hover:text-secondary" title="Share"><span className="material-symbols-outlined text-[20px]">share</span></button>
                  </div>
                </div>
              </footer>
            </div>
          </article>

          {/* Load More Indicator */}
          <div className="text-center py-4">
            <button className="text-secondary font-data-label text-[11px] tracking-[0.05em] font-bold hover:underline">Load More Intelligence...</button>
          </div>
        </div>
      </main>

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes pulse-green {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(61, 139, 99, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(61, 139, 99, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(61, 139, 99, 0); }
        }
      `}</style>
    </div>
  )
}
