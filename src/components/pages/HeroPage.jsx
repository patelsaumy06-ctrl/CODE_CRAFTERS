import React from 'react'
import { useNavigate } from 'react-router-dom'

export const HeroPage = () => {
  const navigate = useNavigate()

  return (
    <div className="bg-[#F7F3EC] text-on-background font-body-md antialiased selection:bg-primary-container selection:text-on-primary overflow-x-hidden min-h-screen">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-margin-desktop py-4 bg-primary text-white border-b border-white/10 shadow-sm">
        <div className="flex items-center gap-gutter">
          <span 
            className="font-display-lg text-headline-md font-bold tracking-tighter cursor-pointer" 
            onClick={() => navigate("/")}
          >
            DisasterLens AI
          </span>
        </div>
        <div className="hidden md:flex items-center gap-gutter">
          <a className="font-data-label text-data-label border-b-2 border-white pb-1 hover:text-white/80 transition-colors duration-300" href="#">Home</a>
          <a className="font-data-label text-data-label text-white/70 hover:text-white transition-colors duration-300" href="#">Intelligence</a>
          <a className="font-data-label text-data-label text-white/70 hover:text-white transition-colors duration-300" href="#">Incidents</a>
          <a className="font-data-label text-data-label text-white/70 hover:text-white transition-colors duration-300" href="#">Analytics</a>
          <a className="font-data-label text-data-label text-white/70 hover:text-white transition-colors duration-300" href="#">About</a>
        </div>
        <div className="flex items-center">
          <button 
            onClick={() => navigate("/login")}
            className="font-data-label text-data-label bg-white text-primary px-4 py-2 rounded-lg hover:bg-white/90 transition-colors active:scale-95 font-semibold"
          >
            Login / Secure Access
          </button>
        </div>
      </nav>

      <main className="pt-[80px]">
        {/* Hero Section */}
        <section className="relative min-h-[921px] flex flex-col justify-center items-center px-margin-desktop overflow-hidden border-b border-outline-variant">
          {/* Background Visual */}
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40" 
            style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida/AP1WRLvDVhHMTbWxGsnmBU_VDbcNVOtcQ99TvHH_tmco6DdwXNSomaUVgaCfpJGDQXvBxt-RWHXfLxhuU7r6AszXiI-opRVskscaKQCOmpXTmhsp9ngy-0b4qMe70UrhBBalJD0N4ChKndf3j-PvuxcnfbqcY0I2uLI3lp6cNwYqmk909QChr9T1kpxdiJ1_KZt3clOZb3RF-pkOzOVXij3rZdLzv7WVsrDxEWWtQATlrboSmocn6pylS8FntPX-")' }}
          ></div>
          {/* Grid overlay for technical feel */}
          <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#001d3612_1px,transparent_1px),linear-gradient(to_bottom,#001d3612_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute inset-0 z-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
          
          <div className="relative z-10 max-w-4xl mx-auto text-center mt-12 flex flex-col items-center gap-6 p-8">
            {/* Status Chip */}
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-md border border-[#E7DED2] rounded-full px-4 py-2 font-data-label text-data-label text-primary mb-4 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
              SYSTEM ACTIVE - GLOBAL MONITORING
            </div>
            <h1 className="font-display-lg text-[64px] leading-tight text-primary tracking-tighter font-bold">
              See the Crisis.<br />
              <span className="text-primary">Understand the Situation.</span><br />
              Respond Faster.
            </h1>
            <p className="font-body-lg text-body-lg text-[#1c1c18] max-w-2xl mx-auto mt-4 font-semibold">
              DisasterLens AI continuously aggregates, classifies, and clusters multi-source intelligence to verify critical events in real-time, empowering response agencies with actionable, ground-truth data.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button 
                onClick={() => navigate("/login")}
                className="font-data-label text-data-label bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors active:scale-95 flex items-center justify-center gap-2 font-bold tracking-widest uppercase shadow-md"
              >
                Go to Dashboard
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
              <button 
                className="font-data-label text-data-label bg-white border border-[#E7DED2] text-primary px-6 py-3 rounded-lg hover:bg-surface-container-low transition-colors active:scale-95 flex items-center justify-center gap-2 font-bold tracking-widest uppercase shadow-sm"
              >
                Explore Live Intelligence
                <span className="material-symbols-outlined text-[16px]">travel_explore</span>
              </button>
            </div>
          </div>
        </section>

        {/* Stat Strip Ticker */}
        <div className="w-full bg-white border-b border-[#E7DED2] py-4 overflow-hidden relative shadow-sm">
          <div className="flex animate-ticker whitespace-nowrap">
            {/* First copy */}
            <div className="flex shrink-0 gap-12 px-6 font-data-label text-data-label text-[#6B7280]">
              <span className="flex items-center gap-2">
                <span className="text-primary font-bold">Posts Analyzed:</span> 1.2M+ 
                <span className="material-symbols-outlined text-primary text-[14px]">trending_up</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-error font-bold">Active Incidents:</span> <span className="text-error">42</span>
                <span className="material-symbols-outlined text-error text-[14px]">warning</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-secondary font-bold">Verified Events:</span> 18 
                <span className="material-symbols-outlined text-secondary text-[14px]">check_circle</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-primary font-bold">AI Confidence:</span> 99.4% 
                <span className="material-symbols-outlined text-primary text-[14px]">analytics</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-primary font-bold">Avg. Detection Time:</span> &lt; 30s 
                <span className="material-symbols-outlined text-primary text-[14px]">timer</span>
              </span>
            </div>
            {/* Second copy (identical for seamless loop) */}
            <div className="flex shrink-0 gap-12 px-6 font-data-label text-data-label text-[#6B7280]">
              <span className="flex items-center gap-2">
                <span className="text-primary font-bold">Posts Analyzed:</span> 1.2M+ 
                <span className="material-symbols-outlined text-primary text-[14px]">trending_up</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-error font-bold">Active Incidents:</span> <span className="text-error">42</span>
                <span className="material-symbols-outlined text-error text-[14px]">warning</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-secondary font-bold">Verified Events:</span> 18 
                <span className="material-symbols-outlined text-secondary text-[14px]">check_circle</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-primary font-bold">AI Confidence:</span> 99.4% 
                <span className="material-symbols-outlined text-primary text-[14px]">analytics</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-primary font-bold">Avg. Detection Time:</span> &lt; 30s 
                <span className="material-symbols-outlined text-primary text-[14px]">timer</span>
              </span>
            </div>
          </div>
        </div>

        {/* How it Works Section */}
        <section className="py-24 px-margin-desktop bg-[#F7F3EC] relative border-b border-[#E7DED2]">
          <div className="max-w-[1920px] mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-headline-lg text-headline-lg text-primary mb-4">Operational Architecture</h2>
              <p className="font-body-md text-body-md text-[#6B7280] max-w-2xl mx-auto">The intelligence pipeline from raw noise to verified situational awareness.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
              {/* Card 1 */}
              <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-lg p-8 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 left-0 w-full h-1 bg-primary/20 group-hover:bg-primary transition-colors"></div>
                <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center mb-6 border border-outline-variant text-primary">
                  <span className="material-symbols-outlined">satellite_alt</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-primary mb-3">1. Multi-source Intake</h3>
                <p className="font-body-sm text-body-sm text-[#1E2933]">Continuous ingestion of global social feeds, seismic sensors, meteorological data, and local news streams into a unified data lake.</p>
              </div>
              {/* Card 2 */}
              <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-lg p-8 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 left-0 w-full h-1 bg-primary/20 group-hover:bg-primary transition-colors"></div>
                <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center mb-6 border border-outline-variant text-primary">
                  <span className="material-symbols-outlined">network_node</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-primary mb-3">2. AI Classification &amp; Clustering</h3>
                <p className="font-body-sm text-body-sm text-[#1E2933]">Deep learning models filter noise, categorize events by threat level, and cluster related reports geographically to form incident nodes.</p>
              </div>
              {/* Card 3 */}
              <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-lg p-8 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 left-0 w-full h-1 bg-error/20 group-hover:bg-error transition-colors"></div>
                <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center mb-6 border border-outline-variant text-error">
                  <span className="material-symbols-outlined">crisis_alert</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-primary mb-3">3. Real-time Detection</h3>
                <p className="font-body-sm text-body-sm text-[#1E2933]">Verified events trigger automated alerts, populating the global map with high-confidence intelligence for immediate tactical response.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-24 px-margin-desktop bg-white border-b border-[#E7DED2]">
          <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1 space-y-6">
              <h2 className="font-headline-lg text-headline-lg text-primary">Mission-Critical Accuracy</h2>
              <p className="font-body-lg text-body-lg text-[#6B7280]">
                Built for the realities of crisis management. Our verification protocols employ multi-modal consensus algorithms to ensure high fidelity before an alert is raised.
              </p>
              <ul className="space-y-6 mt-8">
                <li className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-primary text-[28px]">gpp_good</span>
                  <div>
                    <h4 className="font-data-label text-data-label text-primary font-bold uppercase tracking-wider">Rigorous Verification Protocols</h4>
                    <p className="font-body-sm text-body-sm text-[#1E2933] mt-2">Cross-referencing eyewitness accounts with sensor data and historical baseline metrics to eliminate false positives.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-primary text-[28px]">policy</span>
                  <div>
                    <h4 className="font-data-label text-data-label text-primary font-bold uppercase tracking-wider">Professional Agency Adoption</h4>
                    <p className="font-body-sm text-body-sm text-[#1E2933] mt-2">Trusted by tier-1 NGOs, federal emergency management, and global response coordination centers.</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="flex-1 w-full h-[500px] relative rounded-lg border border-[#E7DED2] overflow-hidden bg-surface shadow-md">
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-80" 
                style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDDQKGsJoR21aAPcrn1OwSXcUKE9I6r9gv1ozQ_bkql2D8BZ8WqrjNcVFJcHMnenPwxD-exF1lgDwvbQ63D_2060Elg3DfioC42RIvuAB7PbuwGzLFjh1ONYGTHImTyy1h0bpJWXoBko62teyQMunA2uybTUU-NThETuIuC8NMHrIw8x4Oz1NoXQfvycdbMigafv0lqXPK5raPq2mY30YyB2zUwLs87g0JrSJHEjIBtB0Lh-ZSNO5Q9-w")' }}
              ></div>
              {/* Inner element */}
              <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md border border-[#E7DED2] p-4 rounded-lg flex items-center justify-between shadow-sm">
                <div className="flex flex-col">
                  <span className="font-data-label text-data-label text-[#6B7280]">PROTOCOL STATUS</span>
                  <span className="font-data-value text-data-value text-primary font-bold">VERIFICATION ACTIVE</span>
                </div>
                <span className="material-symbols-outlined text-primary text-[32px]">verified_user</span>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 px-margin-desktop bg-[#F7F3EC] relative overflow-hidden flex flex-col items-center justify-center text-center border-b border-[#E7DED2]">
          {/* Decorative radial gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,theme('colors.primary/0.05')_0%,transparent_70%)]"></div>
          <div className="relative z-10 max-w-2xl flex flex-col items-center">
            <span className="material-symbols-outlined text-[64px] text-primary mb-8">shield_person</span>
            <h2 className="font-headline-lg text-[40px] leading-tight text-primary mb-8 font-bold">Deploy DisasterLens AI for your agency today.</h2>
            <button 
              onClick={() => navigate("/login")}
              className="font-data-label text-data-label bg-primary text-white px-8 py-4 rounded-lg hover:bg-primary/90 transition-colors active:scale-95 font-bold tracking-widest uppercase shadow-md"
            >
              Request Secure Access
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-gutter bg-white border-t border-[#E7DED2]">
        <div className="font-headline-md text-headline-md text-primary font-bold">
          DisasterLens AI
        </div>
        <div className="flex flex-wrap items-center justify-center gap-8">
          <a className="font-data-label text-data-label text-[#6B7280] hover:text-primary transition-colors uppercase tracking-wider" href="#">Security Protocols</a>
          <a className="font-data-label text-data-label text-[#6B7280] hover:text-primary transition-colors uppercase tracking-wider" href="#">Privacy Policy</a>
          <a className="font-data-label text-data-label text-[#6B7280] hover:text-primary transition-colors uppercase tracking-wider" href="#">API Docs</a>
          <a className="font-data-label text-data-label text-[#6B7280] hover:text-primary transition-colors uppercase tracking-wider" href="#">System Status</a>
        </div>
        <div className="font-data-label text-data-label text-[#6B7280]">
          © 2026 DISASTERLENS AI. CLASSIFIED PROFESSIONAL USE ONLY.
        </div>
      </footer>
    </div>
  )
}
