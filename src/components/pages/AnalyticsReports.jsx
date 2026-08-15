import React from 'react'
import { useNavigate } from 'react-router-dom'

export const AnalyticsReports = () => {
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
          <a onClick={() => navigate("/admin")} className="flex items-center gap-3 text-white/70 hover:text-on-primary px-4 py-2 mx-2 rounded-lg hover:bg-primary transition-colors duration-200 cursor-pointer">
            <span className="material-symbols-outlined shrink-0">dashboard</span>
            <span className="font-data-label text-[11px] tracking-[0.05em] font-semibold uppercase">Command Center</span>
          </a>
          <a onClick={() => navigate("/admin/incident")} className="flex items-center gap-3 text-white/70 hover:text-on-primary px-4 py-2 mx-2 rounded-lg hover:bg-primary transition-colors duration-200 cursor-pointer">
            <span className="material-symbols-outlined shrink-0">emergency</span>
            <span className="font-data-label text-[11px] tracking-[0.05em] font-semibold uppercase">Live Incidents</span>
          </a>
          {/* ACTIVE TAB */}
          <a className="flex items-center gap-3 bg-[#D98B3A] text-white rounded-lg px-4 py-2 mx-2 transition-transform cursor-pointer">
            <span className="material-symbols-outlined shrink-0">analytics</span>
            <span className="font-data-label text-[11px] tracking-[0.05em] font-bold uppercase">Analytics &amp; Reports</span>
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

      {/* Main Content Canvas */}
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
            <a onClick={() => navigate("/admin")} className="text-on-surface-variant font-body-md text-body-md hover:text-primary transition-colors h-full flex items-center border-b-2 border-transparent cursor-pointer">Dashboard</a>
            <a onClick={() => navigate("/admin/incident")} className="text-on-surface-variant font-body-md text-body-md hover:text-primary transition-colors h-full flex items-center border-b-2 border-transparent cursor-pointer">Incidents</a>
            <a className="text-secondary font-bold border-b-2 border-secondary font-body-md text-body-md h-full flex items-center cursor-pointer">Reports</a>
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
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBFL5oRm2M-3wMhP0dPfmNJSxg83y5_JytTxpyjZZ47ZXU33dwxt999ulSJpzM1vNfcpZDngTHG59-Y5fXOIQnT7LGPfgsjDwYVe0f5euAAkaafiCGHppmzmHF0TnBxLEf6DKcDkS0Eqx7MZc10tNAqH49m2qav8AN_uN67qTlFNiGUN_hnlB64Nyy08tbI8HrdyztrIrNsmFGuAZDCIyFWfWVofZuh7fkNA1baw0I5Z_lySq-QOBYq"
              />
            </div>
          </div>
        </header>

        {/* Canvas Content */}
        <div className="p-[24px] flex-1 max-w-[1600px] mx-auto w-full flex flex-col gap-[32px]">
          {/* Page Header & Controls */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-[36px] leading-[44px] tracking-[-0.02em] font-bold text-primary font-headline-md">Analytics &amp; Reports</h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">Historical intelligence and disaster trends.</p>
            </div>
            {/* Time Range Pills */}
            <div className="flex flex-wrap items-center gap-2 bg-surface-container-high p-1 rounded-lg border border-outline-variant/30">
              <button className="px-4 py-1.5 rounded-md font-data-label text-[11px] tracking-[0.05em] font-semibold text-on-surface-variant hover:bg-surface transition-colors">Today</button>
              <button className="px-4 py-1.5 rounded-md font-data-label text-[11px] tracking-[0.05em] font-bold bg-surface text-primary border border-outline-variant/50 shadow-[0_2px_4px_rgba(23,50,77,0.05)]">7 Days</button>
              <button className="px-4 py-1.5 rounded-md font-data-label text-[11px] tracking-[0.05em] font-semibold text-on-surface-variant hover:bg-surface transition-colors">30 Days</button>
              <button className="px-4 py-1.5 rounded-md font-data-label text-[11px] tracking-[0.05em] font-semibold text-on-surface-variant hover:bg-surface transition-colors">90 Days</button>
              <button className="px-4 py-1.5 rounded-md font-data-label text-[11px] tracking-[0.05em] font-semibold text-on-surface-variant hover:bg-surface transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                Custom
              </button>
            </div>
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-[16px]">
            {/* Card 1 */}
            <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-lg p-[16px] shadow-[0_2px_4px_rgba(23,50,77,0.05)] flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <span className="font-data-label text-[11px] tracking-[0.05em] font-semibold text-on-surface-variant uppercase tracking-wider">Total Incidents</span>
                <span className="material-symbols-outlined text-outline text-[20px]">warning</span>
              </div>
              <div className="text-[32px] font-bold text-primary font-headline-md mb-1">1,428</div>
              <div className="flex items-center gap-1 font-data-value text-data-value text-error">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                <span>+12.4%</span>
                <span className="text-on-surface-variant text-[11px] font-normal ml-1">vs last 7d</span>
              </div>
            </div>
            {/* Card 2 */}
            <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-lg p-[16px] shadow-[0_2px_4px_rgba(23,50,77,0.05)] flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <span className="font-data-label text-[11px] tracking-[0.05em] font-semibold text-on-surface-variant uppercase tracking-wider">Verified Incidents</span>
                <span className="material-symbols-outlined text-outline text-[20px]">verified</span>
              </div>
              <div className="text-[32px] font-bold text-primary font-headline-md mb-1">984</div>
              <div className="flex items-center gap-1 font-data-value text-data-value text-green-600">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                <span>+5.2%</span>
              </div>
            </div>
            {/* Card 3 */}
            <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-lg p-[16px] shadow-[0_2px_4px_rgba(23,50,77,0.05)] flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <span className="font-data-label text-[11px] tracking-[0.05em] font-semibold text-on-surface-variant uppercase tracking-wider">Avg Detection Time</span>
                <span className="material-symbols-outlined text-outline text-[20px]">timer</span>
              </div>
              <div className="text-[32px] font-bold text-primary font-headline-md mb-1">4.2m</div>
              <div className="flex items-center gap-1 font-data-value text-data-value text-green-600">
                <span className="material-symbols-outlined text-[14px]">trending_down</span>
                <span>-1.8m</span>
              </div>
            </div>
            {/* Card 4 */}
            <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-lg p-[16px] shadow-[0_2px_4px_rgba(23,50,77,0.05)] flex flex-col relative overflow-hidden group">
              <div className="absolute inset-0 border border-secondary-container/30 border-dashed rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex justify-between items-start mb-2 relative z-10">
                <span className="font-data-label text-[11px] tracking-[0.05em] font-semibold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-secondary-container">lens_blur</span>
                  AI Confidence
                </span>
                <span className="material-symbols-outlined text-outline text-[20px]">psychology</span>
              </div>
              <div className="text-[32px] font-bold text-primary font-headline-md mb-1 relative z-10">94.8%</div>
              <div className="flex items-center gap-1 font-data-value text-data-value text-on-surface-variant relative z-10">
                <span className="material-symbols-outlined text-[14px]">horizontal_rule</span>
                <span>Stable</span>
              </div>
            </div>
            {/* Card 5 */}
            <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-lg p-[16px] shadow-[0_2px_4px_rgba(23,50,77,0.05)] flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <span className="font-data-label text-[11px] tracking-[0.05em] font-semibold text-on-surface-variant uppercase tracking-wider">Resolution Rate</span>
                <span className="material-symbols-outlined text-outline text-[20px]">task_alt</span>
              </div>
              <div className="text-[32px] font-bold text-primary font-headline-md mb-1">82%</div>
              <div className="flex items-center gap-1 font-data-value text-data-value text-green-600">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                <span>+2.1%</span>
              </div>
            </div>
          </div>

          {/* Visualization Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[16px]">
            {/* Chart 1: Trends */}
            <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-lg shadow-[0_2px_4px_rgba(23,50,77,0.05)] flex flex-col h-[350px]">
              <div className="p-[16px] border-b border-surface-container-high flex justify-between items-center">
                <h3 className="font-headline-md text-[18px] leading-[24px] font-semibold text-primary">Disaster Trends Over Time</h3>
                <button className="text-outline hover:text-primary"><span className="material-symbols-outlined">more_horiz</span></button>
              </div>
              <div className="flex-1 p-[16px] relative flex items-end overflow-hidden" style={{ backgroundImage: 'linear-gradient(to right, #E7DED2 1px, transparent 1px), linear-gradient(to bottom, #E7DED2 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 1 }}>
                <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to right, #E7DED2 1px, transparent 1px), linear-gradient(to bottom, #E7DED2 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.3 }}></div>
                {/* Abstract Line Chart Representation */}
                <div className="absolute bottom-4 left-4 right-4 h-full flex items-end justify-between px-2 opacity-80">
                  <div className="w-1 bg-[#D64545] h-[20%] rounded-t"></div>
                  <div className="w-1 bg-[#D98B3A] h-[35%] rounded-t"></div>
                  <div className="w-1 bg-[#477A9E] h-[25%] rounded-t"></div>
                  <div className="w-1 bg-[#3D8B63] h-[50%] rounded-t"></div>
                  <div className="w-1 bg-[#D64545] h-[80%] rounded-t"></div>
                  <div className="w-1 bg-[#D98B3A] h-[45%] rounded-t"></div>
                  <div className="w-1 bg-[#477A9E] h-[60%] rounded-t"></div>
                  <div className="w-1 bg-[#D64545] h-[90%] rounded-t"></div>
                  <div className="w-1 bg-[#3D8B63] h-[30%] rounded-t"></div>
                  <div className="w-1 bg-[#D98B3A] h-[55%] rounded-t"></div>
                </div>
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="lineGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                      <stop offset="0%" stopColor="#001d36"></stop>
                      <stop offset="100%" stopColor="transparent"></stop>
                    </linearGradient>
                  </defs>
                  <path d="M0,80 Q10,70 20,60 T40,50 T60,20 T80,40 T100,10" fill="none" stroke="#001d36" strokeWidth="0.5" vectorEffect="non-scaling-stroke"></path>
                  <path d="M0,100 L0,80 Q10,70 20,60 T40,50 T60,20 T80,40 T100,10 L100,100 Z" fill="url(#lineGradient)" opacity="0.1"></path>
                </svg>
              </div>
            </div>

            {/* Chart 2: Category */}
            <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-lg shadow-[0_2px_4px_rgba(23,50,77,0.05)] flex flex-col h-[350px]">
              <div className="p-[16px] border-b border-surface-container-high flex justify-between items-center">
                <h3 className="font-headline-md text-[18px] leading-[24px] font-semibold text-primary">Category Breakdown</h3>
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-high font-data-label text-[11px] tracking-[0.05em] font-semibold text-on-surface-variant">Top 5</span>
                </div>
              </div>
              <div className="flex-1 p-[16px] flex items-center justify-center gap-8">
                {/* Abstract Donut */}
                <div className="relative w-48 h-48 rounded-full border-[24px] border-[#D64545] border-r-[#D98B3A] border-b-[#477A9E] border-l-[#3D8B63] transform rotate-45 shadow-inner">
                  <div className="absolute inset-0 flex items-center justify-center -rotate-45">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary font-headline-md">1.4k</div>
                      <div className="font-data-label text-[10px] tracking-[0.05em] font-semibold text-on-surface-variant">TOTAL</div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3 font-data-value text-sm">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#D64545]"></div><span className="w-16">Fire</span><span className="font-bold">42%</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#D98B3A]"></div><span className="w-16">Flood</span><span className="font-bold">28%</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#477A9E]"></div><span className="w-16">Storm</span><span className="font-bold">18%</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#3D8B63]"></div><span className="w-16">Seismic</span><span className="font-bold">12%</span></div>
                </div>
              </div>
            </div>

            {/* Chart 3: Map */}
            <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-lg shadow-[0_2px_4px_rgba(23,50,77,0.05)] flex flex-col h-[350px]">
              <div className="p-[16px] border-b border-surface-container-high flex justify-between items-center">
                <h3 className="font-headline-md text-[18px] leading-[24px] font-semibold text-primary">Regional Incident Heatmap</h3>
                <span className="material-symbols-outlined text-outline text-[20px]">map</span>
              </div>
              <div className="flex-1 bg-surface-container-high relative overflow-hidden">
                <div className="absolute inset-0 bg-cover bg-center opacity-60 mix-blend-multiply" style={{ backgroundImage: "url('https://www.gstatic.com/labs-code/stitch/stitch-placeholder-300x300.svg')" }}></div>
                {/* UI Overlays on map */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <div className="bg-surface/90 backdrop-blur px-2 py-1 rounded border border-outline-variant/50 font-data-label text-[11px] tracking-[0.05em] font-semibold flex items-center gap-1 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-[#D64545]"></div> High Density
                  </div>
                </div>
              </div>
            </div>

            {/* Chart 4: Severity */}
            <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-lg shadow-[0_2px_4px_rgba(23,50,77,0.05)] flex flex-col h-[350px]">
              <div className="p-[16px] border-b border-surface-container-high flex justify-between items-center">
                <h3 className="font-headline-md text-[18px] leading-[24px] font-semibold text-primary">Severity Distribution</h3>
              </div>
              <div className="flex-1 p-[16px] flex flex-col justify-center gap-4">
                {/* Critical */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between font-data-label text-xs">
                    <span className="text-on-surface flex items-center gap-1"><div className="w-2 h-2 bg-[#D64545] rounded-full"></div> Critical</span>
                    <span className="font-bold">345 (24%)</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div className="bg-[#D64545] h-full rounded-full" style={{ width: '24%' }}></div>
                  </div>
                </div>
                {/* Warning */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between font-data-label text-xs">
                    <span className="text-on-surface flex items-center gap-1"><div className="w-2 h-2 bg-[#D98B3A] rounded-full"></div> Warning</span>
                    <span className="font-bold">512 (36%)</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div className="bg-[#D98B3A] h-full rounded-full" style={{ width: '36%' }}></div>
                  </div>
                </div>
                {/* Moderate */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between font-data-label text-xs">
                    <span className="text-on-surface flex items-center gap-1"><div className="w-2 h-2 bg-[#477A9E] rounded-full"></div> Moderate</span>
                    <span className="font-bold">420 (29%)</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div className="bg-[#477A9E] h-full rounded-full" style={{ width: '29%' }}></div>
                  </div>
                </div>
                {/* Low */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between font-data-label text-xs">
                    <span className="text-on-surface flex items-center gap-1"><div className="w-2 h-2 bg-[#3D8B63] rounded-full"></div> Low</span>
                    <span className="font-bold">151 (11%)</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div className="bg-[#3D8B63] h-full rounded-full" style={{ width: '11%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Report Export Section */}
          <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-[0_2px_4px_rgba(23,50,77,0.05)] p-[32px] mb-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary text-[28px]">description</span>
              <h2 className="font-headline-md text-headline-md text-primary">Generate Report</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Config Options */}
              <div className="flex flex-col gap-1">
                <label className="font-data-label text-[11px] tracking-[0.05em] font-semibold text-on-surface-variant">Date Range</label>
                <select className="bg-surface border border-outline-variant/50 rounded-md py-2 px-3 text-body-md font-body-md focus:border-secondary focus:ring-0 outline-none w-full">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                  <option>This Quarter</option>
                  <option>Custom</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-data-label text-[11px] tracking-[0.05em] font-semibold text-on-surface-variant">Region</label>
                <select className="bg-surface border border-outline-variant/50 rounded-md py-2 px-3 text-body-md font-body-md focus:border-secondary focus:ring-0 outline-none w-full">
                  <option>Global (All)</option>
                  <option>North America</option>
                  <option>Europe</option>
                  <option>Asia Pacific</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-data-label text-[11px] tracking-[0.05em] font-semibold text-on-surface-variant">Category</label>
                <select className="bg-surface border border-outline-variant/50 rounded-md py-2 px-3 text-body-md font-body-md focus:border-secondary focus:ring-0 outline-none w-full">
                  <option>All Categories</option>
                  <option>Fire</option>
                  <option>Flood</option>
                  <option>Seismic</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-data-label text-[11px] tracking-[0.05em] font-semibold text-on-surface-variant">Severity</label>
                <select className="bg-surface border border-outline-variant/50 rounded-md py-2 px-3 text-body-md font-body-md focus:border-secondary focus:ring-0 outline-none w-full">
                  <option>All Severities</option>
                  <option>Critical Only</option>
                  <option>Critical &amp; Warning</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-surface-container-high pt-6 gap-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="w-5 h-5 border border-outline-variant rounded bg-surface flex items-center justify-center group-hover:border-primary transition-colors">
                    <span className="material-symbols-outlined text-[16px] text-primary">check</span>
                  </div>
                  <span className="font-body-md text-on-surface">Include charts &amp; visualisations</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="w-5 h-5 border border-outline-variant rounded bg-surface flex items-center justify-center group-hover:border-primary transition-colors">
                    <span className="material-symbols-outlined text-[16px] text-primary">check</span>
                  </div>
                  <span className="font-body-md text-on-surface">Include raw incident data</span>
                </label>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button className="flex-1 sm:flex-none border border-primary text-primary px-6 py-2 rounded-lg font-data-label text-[11px] tracking-[0.05em] font-bold hover:bg-surface-container transition-colors uppercase tracking-wide">
                  Export CSV
                </button>
                <button className="flex-1 sm:flex-none bg-secondary text-on-secondary px-6 py-2 rounded-lg font-data-label text-[11px] tracking-[0.05em] font-bold hover:opacity-90 transition-opacity uppercase tracking-wide shadow-sm flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                  Export PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
