import React from 'react'
import { useNavigate } from 'react-router-dom'

export const Dashboard = () => {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("role")
    navigate("/login")
  }

  return (
    <div className="bg-surface-container-low text-on-surface font-body-md antialiased flex h-screen overflow-hidden">
      {/* Side Navigation Bar */}
      <aside className="fixed left-0 top-0 h-screen w-[250px] bg-[#17324D] text-on-primary-container shadow-sm border-r border-outline-variant flex flex-col py-[24px] z-30 hidden md:flex">
        {/* Header */}
        <div className="px-[24px] mb-8 flex items-center gap-3">
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-on-primary leading-none cursor-pointer truncate" onClick={() => navigate("/")}>DisasterLens AI</h1>
            <p className="font-data-label text-[11px] tracking-[0.05em] font-semibold text-on-primary-container opacity-80 truncate">Disaster Intelligence Platform</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 flex flex-col gap-2 overflow-y-auto mt-4 px-2">
          {/* ACTIVE TAB */}
          <a className="flex items-center gap-3 bg-[#D98B3A] text-white rounded-lg px-4 py-2 mx-2 transition-transform cursor-pointer">
            <span className="material-symbols-outlined shrink-0">dashboard</span>
            <span className="font-data-label text-[11px] tracking-[0.05em] font-bold uppercase">Command Center</span>
          </a>
          <a onClick={() => navigate("/admin/incident")} className="flex items-center gap-3 text-white/70 hover:text-on-primary px-4 py-2 mx-2 rounded-lg hover:bg-primary transition-colors duration-200 cursor-pointer">
            <span className="material-symbols-outlined shrink-0">emergency</span>
            <span className="font-data-label text-[11px] tracking-[0.05em] font-semibold uppercase">Live Incidents</span>
          </a>
          <a onClick={() => navigate("/admin/analytics")} className="flex items-center gap-3 text-white/70 hover:text-on-primary px-4 py-2 mx-2 rounded-lg hover:bg-primary transition-colors duration-200 cursor-pointer">
            <span className="material-symbols-outlined shrink-0">analytics</span>
            <span className="font-data-label text-[11px] tracking-[0.05em] font-semibold uppercase">Analytics &amp; Reports</span>
          </a>
        </nav>

        {/* CTA & Footer */}
        <div className="mt-auto px-[24px] pt-6 border-t border-outline-variant/20">
          <button className="w-full bg-[#D98B3A] text-white rounded-lg py-2 px-4 font-data-label text-[11px] tracking-[0.05em] font-bold uppercase hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Report
          </button>
          <nav className="flex flex-col gap-2 -mx-2">
            <a className="flex items-center gap-3 text-white/70 hover:text-on-primary px-4 py-2 mx-2 rounded-lg hover:bg-primary transition-colors duration-200 cursor-pointer">
              <span className="material-symbols-outlined shrink-0 text-[20px]">settings</span>
              <span className="font-data-label text-[11px] tracking-[0.05em] font-semibold uppercase">Settings</span>
            </a>
            <button onClick={handleLogout} className="flex items-center gap-3 text-white/70 hover:text-on-primary px-4 py-2 mx-2 rounded-lg hover:bg-primary transition-colors duration-200 w-full cursor-pointer">
              <span className="material-symbols-outlined shrink-0 text-[20px]">logout</span>
              <span className="font-data-label text-[11px] tracking-[0.05em] font-semibold uppercase">Logout</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col ml-0 md:ml-[250px] min-h-screen relative overflow-y-auto">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-10 w-full h-16 bg-surface border-b border-outline-variant flex justify-between items-center px-[24px]">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-primary hover:opacity-80 transition-opacity">
              <span className="material-symbols-outlined text-headline-md">menu</span>
            </button>
            <div className="font-headline-md text-[18px] leading-[24px] font-semibold text-primary hidden sm:block">Command Center</div>
          </div>
          <nav className="hidden lg:flex items-center h-full gap-8">
            <a className="text-secondary font-bold border-b-2 border-secondary font-body-md text-body-md h-full flex items-center cursor-pointer">Dashboard</a>
            <a onClick={() => navigate("/admin/incident")} className="text-on-surface-variant font-body-md text-body-md hover:text-primary transition-colors h-full flex items-center border-b-2 border-transparent cursor-pointer">Incidents</a>
            <a onClick={() => navigate("/admin/analytics")} className="text-on-surface-variant font-body-md text-body-md hover:text-primary transition-colors h-full flex items-center border-b-2 border-transparent cursor-pointer">Reports</a>
          </nav>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center bg-surface-container px-3 py-1.5 rounded-full border border-outline-variant/50">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
              <span className="font-data-label text-[11px] tracking-[0.05em] font-semibold text-on-surface-variant">System Status</span>
            </div>
            <div className="flex items-center gap-2 text-primary">
              <button className="w-10 h-10 flex items-center justify-center hover:bg-surface-container rounded-full transition-colors opacity-80 hover:opacity-100">
                <span className="material-symbols-outlined">search</span>
              </button>
              <button className="w-10 h-10 flex items-center justify-center hover:bg-surface-container rounded-full transition-colors opacity-80 hover:opacity-100 relative">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
              </button>
            </div>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
              <img
                alt="User Profile Avatar"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDJxN7ku9iMWTp9tMRTcipcDDpLR_boJz5XU-_IUmj51y21uSoTTRJMiyaCHuHgo5jvyJUSh5aYujhcTJdnMKzMRkyZtIj_8OsxjCwG_je-A2H9ZuUbdytFXT34o7XYYqn49Nik71EQclEoBnflii84-1MVc63itLm5ltOaSDB6FkQiWR-PHKTf-ddQU4G7WGb9V-BcEbzgi6MIx9juf4Sm3kbGzeQIJDc0OejZigbBeO0H2uuatZwO"
              />
            </div>
          </div>
        </header>

        {/* Scrollable Canvas */}
        <div className="flex-1 overflow-y-auto p-[24px] pb-8">
          {/* Filters Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-gutter">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-[#FFFDF9] border border-[#E7DED2] rounded px-3 py-1.5">
                <span className="material-symbols-outlined text-outline text-sm">filter_list</span>
                <span className="font-data-label text-[11px] tracking-[0.05em] font-semibold text-on-surface">Disaster Type: All</span>
                <span className="material-symbols-outlined text-outline text-sm ml-2">expand_more</span>
              </div>
              <div className="flex items-center gap-2 bg-[#FFFDF9] border border-[#E7DED2] rounded px-3 py-1.5">
                <span className="material-symbols-outlined text-outline text-sm">location_on</span>
                <span className="font-data-label text-[11px] tracking-[0.05em] font-semibold text-on-surface">Location: Global</span>
                <span className="material-symbols-outlined text-outline text-sm ml-2">expand_more</span>
              </div>
              <div className="flex items-center gap-2 bg-[#FFFDF9] border border-[#E7DED2] rounded px-3 py-1.5">
                <span className="material-symbols-outlined text-outline text-sm">priority_high</span>
                <span className="font-data-label text-[11px] tracking-[0.05em] font-semibold text-on-surface">Urgency: Critical</span>
                <span className="material-symbols-outlined text-outline text-sm ml-2">expand_more</span>
              </div>
            </div>
            <div className="font-body-md text-sm text-outline flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Live Updates Active
            </div>
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-gutter">
            {/* KPI 1 */}
            <div className="card-base rounded-lg p-4 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="font-data-label text-[11px] tracking-[0.05em] font-semibold text-on-surface-variant">Total Reports</span>
                <span className="material-symbols-outlined text-primary opacity-60">bar_chart</span>
              </div>
              <div className="flex items-end gap-3 mt-2">
                <span className="font-headline-md text-headline-md text-primary">12,482</span>
                <span className="font-data-value text-data-value text-green-600 flex items-center pb-1">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span> +15%
                </span>
              </div>
            </div>
            {/* KPI 2 */}
            <div className="card-base rounded-lg p-4 flex flex-col justify-between border-l-4 border-l-orange-500">
              <div className="flex justify-between items-start mb-2">
                <span className="font-data-label text-[11px] tracking-[0.05em] font-semibold text-on-surface-variant">Active Incidents</span>
                <span className="material-symbols-outlined text-orange-500">warning</span>
              </div>
              <div className="flex items-end gap-3 mt-2">
                <span className="font-headline-md text-headline-md text-primary">42</span>
              </div>
            </div>
            {/* KPI 3 */}
            <div className="card-base rounded-lg p-4 flex flex-col justify-between border-l-4 border-l-green-500">
              <div className="flex justify-between items-start mb-2">
                <span className="font-data-label text-[11px] tracking-[0.05em] font-semibold text-on-surface-variant">Verified Incidents</span>
                <span className="material-symbols-outlined text-green-500">check_circle</span>
              </div>
              <div className="flex items-end gap-3 mt-2">
                <span className="font-headline-md text-headline-md text-primary">18</span>
              </div>
            </div>
            {/* KPI 4 */}
            <div className="card-base rounded-lg p-4 flex flex-col justify-between border-l-4 border-l-red-600">
              <div className="flex justify-between items-start mb-2">
                <span className="font-data-label text-[11px] tracking-[0.05em] font-semibold text-on-surface-variant">Critical Alerts</span>
                <span className="material-symbols-outlined text-red-600">error</span>
              </div>
              <div className="flex items-end gap-3 mt-2">
                <span className="font-headline-md text-headline-md text-red-600">5</span>
              </div>
            </div>
          </div>

          {/* Main Content Area: Map & Intelligence Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter h-[calc(100vh-280px)] min-h-[600px]">
            {/* LEFT: Interactive Map (8 columns) */}
            <div className="lg:col-span-8 card-base rounded-lg flex flex-col overflow-hidden relative group">
              <div className="px-4 py-3 border-b border-[#F1ECE4] flex justify-between items-center bg-[#FFFDF9] z-10">
                <h3 className="font-headline-md text-[18px] leading-[24px] font-semibold text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#D98B3A]">public</span>
                  Global Threat Map
                </h3>
                {/* Map Controls */}
                <div className="flex items-center gap-2 bg-[#F1ECE4] rounded border border-[#E7DED2] p-1">
                  <button className="p-1 rounded hover:bg-[#F7F3EC] text-on-surface-variant transition-colors" title="Zoom In"><span className="material-symbols-outlined text-sm">add</span></button>
                  <button className="p-1 rounded hover:bg-[#F7F3EC] text-on-surface-variant transition-colors" title="Zoom Out"><span className="material-symbols-outlined text-sm">remove</span></button>
                  <div className="w-px h-4 bg-[#E7DED2] mx-1"></div>
                  <button className="p-1 rounded hover:bg-[#F7F3EC] text-on-surface-variant transition-colors" title="Layers"><span className="material-symbols-outlined text-sm">layers</span></button>
                  <button className="p-1 rounded hover:bg-[#F7F3EC] text-on-surface-variant transition-colors" title="My Location"><span className="material-symbols-outlined text-sm">my_location</span></button>
                  <div className="w-px h-4 bg-[#E7DED2] mx-1"></div>
                  <div className="flex items-center gap-1 px-2">
                    <span className="font-data-label text-[11px] tracking-[0.05em] text-primary cursor-pointer hover:text-[#D98B3A]">MAP</span>
                    <span className="text-outline text-xs">/</span>
                    <span className="font-data-label text-[11px] tracking-[0.05em] text-outline cursor-pointer hover:text-primary">SAT</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 relative bg-[#EFEBE4] overflow-hidden">
                {/* Simulated Map Image Layer */}
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-80 mix-blend-multiply"
                  style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDDQKGsJoR21aAPcrn1OwSXcUKE9I6r9gv1ozQ_bkql2D8BZ8WqrjNcVFJcHMnenPwxD-exF1lgDwvbQ63D_2060Elg3DfioC42RIvuAB7PbuwGzLFjh1ONYGTHImTyy1h0bpJWXoBko62teyQMunA2uybTUU-NThETuIuC8NMHrIw8x4Oz1NoXQfvycdbMigafv0lqXPK5raPq2mY30YyB2zUwLs87g0JrSJHEjIBtB0Lh-ZSNO5Q9-w')" }}
                ></div>
                {/* Map Overlay Content (Simulated Markers) */}
                <div className="absolute inset-0 p-8 pointer-events-none">
                  {/* Example Marker: Critical */}
                  <div className="absolute top-1/4 left-1/3 flex flex-col items-center pointer-events-auto cursor-pointer">
                    <div className="relative w-8 h-8">
                      <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
                      <div className="absolute inset-1.5 bg-red-600 rounded-full border-2 border-white shadow-sm flex items-center justify-center"></div>
                    </div>
                    <div className="mt-2 bg-[#FFFDF9]/90 backdrop-blur-sm border border-red-200 px-2 py-1 rounded shadow-sm flex flex-col items-center">
                      <span className="font-data-label text-[9px] text-red-600 font-bold">CRITICAL</span>
                      <span className="font-data-value text-[10px] text-on-surface">Flash Flood</span>
                    </div>
                  </div>
                  {/* Example Marker: Moderate */}
                  <div className="absolute top-1/2 left-2/3 flex flex-col items-center pointer-events-auto cursor-pointer">
                    <div className="w-6 h-6 bg-orange-500 rounded-full border-2 border-white shadow-sm opacity-90 flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-[12px]">warning</span>
                    </div>
                  </div>
                  {/* Example Marker: Resolved/Verified */}
                  <div className="absolute bottom-1/3 left-1/4 flex flex-col items-center pointer-events-auto cursor-pointer">
                    <div className="w-5 h-5 bg-green-500 rounded-sm rotate-45 border border-white shadow-sm opacity-80"></div>
                  </div>
                </div>
                {/* Map Legend (Bottom Right) */}
                <div className="absolute bottom-4 right-4 bg-[#FFFDF9]/90 backdrop-blur-sm border border-[#E7DED2] p-3 rounded shadow-sm">
                  <h4 className="font-data-label text-[10px] text-on-surface-variant mb-2">STATUS LEGEND</h4>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                      <span className="font-data-value text-[11px] text-on-surface">Critical Incident</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="font-data-value text-[11px] text-on-surface">Active Alert</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-sm rotate-45"></div>
                      <span className="font-data-value text-[11px] text-on-surface">Verified / Resolved</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Live Intelligence Feed (4 columns) */}
            <div className="lg:col-span-4 flex flex-col gap-4 overflow-hidden">
              {/* Critical Alert Card (Top of feed) */}
              <div className="bg-[#FFF8F8] border border-red-200 rounded-lg p-4 shadow-sm shrink-0">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-600 animate-pulse">campaign</span>
                    <span className="font-data-label text-[11px] tracking-[0.05em] text-red-700 font-bold">CRITICAL ALERT</span>
                  </div>
                  <span className="font-data-value text-[10px] text-red-500">Just Now</span>
                </div>
                <h4 className="font-headline-md text-[16px] font-semibold text-primary mb-1">Extreme Flood Risk - Zone A</h4>
                <p className="font-body-md text-sm text-on-surface-variant mb-3">Water levels exceeding safe thresholds. Immediate evacuation recommended for lower basin areas.</p>
                <button className="w-full bg-red-600 hover:bg-red-700 text-white font-data-label text-[12px] py-1.5 rounded transition-colors">View Evacuation Protocol</button>
              </div>

              {/* AI Situation Summary Card */}
              <div className="border border-dashed border-[#E8B66A] bg-[#FFFCF5] rounded-lg p-4 shadow-sm shrink-0 relative overflow-hidden">
                {/* AI visual motif */}
                <div className="absolute -right-4 -top-4 opacity-5 text-[#D98B3A]">
                  <span className="material-symbols-outlined text-6xl">auto_awesome</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-[#D98B3A] text-sm">memory</span>
                  <span className="font-data-label text-[10px] text-[#D98B3A] font-bold tracking-wider">AI SITUATION SUMMARY</span>
                </div>
                <p className="font-body-md text-sm text-on-surface leading-relaxed relative z-10">
                  Flood activity is increasing across the northern zone. 18 independent reports have been clustered into 4 active incidents.
                </p>
                <div className="mt-3 pt-2 border-t border-[#E7DED2]/50 flex justify-between items-center">
                  <span className="font-data-value text-[10px] text-outline italic">Generated by DisasterLens AI</span>
                  <span className="font-data-value text-[10px] text-green-600 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">verified</span> High Confidence</span>
                </div>
              </div>

              {/* Scrolling Feed Header */}
              <div className="flex justify-between items-center px-1 shrink-0 mt-2">
                <h3 className="font-data-label text-[11px] tracking-[0.05em] font-semibold text-primary">LIVE INTELLIGENCE FEED</h3>
                <span className="font-data-value text-[10px] text-outline">Auto-updating</span>
              </div>

              {/* Scrollable Incident Cards */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-3 pb-4">
                {/* Feed Card 1 */}
                <div className="card-base p-3 rounded hover:border-[#D98B3A] cursor-pointer transition-colors group">
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="bg-orange-100 text-orange-800 font-data-label text-[9px] px-1.5 py-0.5 rounded">Moderate</span>
                    <span className="font-data-value text-[10px] text-outline">2m ago</span>
                  </div>
                  <h5 className="font-headline-md text-[14px] leading-tight text-primary mb-1 group-hover:text-[#D98B3A] transition-colors">Structural Damage Report</h5>
                  <div className="flex items-center gap-4 font-data-value text-[11px] text-on-surface-variant mb-2">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">location_on</span> Northern Zone</span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">share</span> Twitter/X</span>
                  </div>
                  <div className="w-full bg-surface-variant h-1 rounded-full overflow-hidden">
                    <div className="bg-[#D98B3A] h-full w-[85%]"></div>
                  </div>
                  <div className="text-right mt-1">
                    <span className="font-data-value text-[9px] text-outline">AI Confidence: 85%</span>
                  </div>
                </div>

                {/* Feed Card 2 */}
                <div className="card-base p-3 rounded hover:border-[#D98B3A] cursor-pointer transition-colors group">
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="bg-red-100 text-red-800 font-data-label text-[9px] px-1.5 py-0.5 rounded">Critical</span>
                    <span className="font-data-value text-[10px] text-outline">12m ago</span>
                  </div>
                  <h5 className="font-headline-md text-[14px] leading-tight text-primary mb-1 group-hover:text-[#D98B3A] transition-colors">Flash Flood Warning</h5>
                  <div className="flex items-center gap-4 font-data-value text-[11px] text-on-surface-variant mb-2">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">location_on</span> River Basin</span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">sensors</span> Sensor Data</span>
                  </div>
                  <div className="w-full bg-surface-variant h-1 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full w-[94%]"></div>
                  </div>
                  <div className="text-right mt-1">
                    <span className="font-data-value text-[9px] text-outline">AI Confidence: 94%</span>
                  </div>
                </div>

                {/* Feed Card 3 */}
                <div className="card-base p-3 rounded hover:border-[#D98B3A] cursor-pointer transition-colors group">
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="bg-gray-100 text-gray-700 font-data-label text-[9px] px-1.5 py-0.5 rounded">Monitoring</span>
                    <span className="font-data-value text-[10px] text-outline">28m ago</span>
                  </div>
                  <h5 className="font-headline-md text-[14px] leading-tight text-primary mb-1 group-hover:text-[#D98B3A] transition-colors">Power Grid Fluctuation</h5>
                  <div className="flex items-center gap-4 font-data-value text-[11px] text-on-surface-variant mb-2">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">location_on</span> Eastern Sector</span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">public</span> Utility API</span>
                  </div>
                  <div className="w-full bg-surface-variant h-1 rounded-full overflow-hidden">
                    <div className="bg-gray-400 h-full w-[60%]"></div>
                  </div>
                  <div className="text-right mt-1">
                    <span className="font-data-value text-[9px] text-outline">AI Confidence: 60%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
