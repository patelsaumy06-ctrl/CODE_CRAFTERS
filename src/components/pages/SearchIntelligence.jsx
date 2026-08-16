import React, { useState } from 'react'
import { Sidebar } from '../common/Sidebar'
import { Header } from '../common/Header'

export const SearchIntelligence = () => {
  const [query, setQuery] = useState("")

  const recentSearches = [
    "Flash floods in District 4 past 24 hours",
    "Gas leak reports near power stations",
    "Bridge structural integrity readings",
    "Wildfire smoke trajectory models",
  ]

  return (
    <div className="bg-[#F7F3EC] text-[#1c1c18] font-sans flex h-screen overflow-hidden antialiased">
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-[260px] min-h-screen relative overflow-hidden">
        <Header title="Search Intelligence Database" />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Search Hero Box */}
          <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-8 shadow-sm space-y-4 max-w-4xl mx-auto text-center">
            <span className="material-symbols-outlined text-4xl text-[#D98B3A]">manage_search</span>
            <h2 className="text-xl font-bold text-[#001d36]">Natural Language Intelligence Search</h2>
            <p className="text-xs text-[#74777e] max-w-md mx-auto">
              Query multi-source disaster telemetry, satellite records, social stream archives, and historical incident logs.
            </p>

            <div className="relative max-w-2xl mx-auto mt-4">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask DisasterLens AI e.g. 'Show verified river level reports in Sector 4'..."
                className="w-full bg-white border border-[#E7DED2] rounded-xl py-3 pl-12 pr-28 text-sm text-[#001d36] focus:outline-none focus:border-[#D98B3A] shadow-sm"
              />
              <span className="material-symbols-outlined absolute left-4 top-3.5 text-[#74777e]">search</span>
              <button className="absolute right-2 top-2 bg-[#001d36] text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-[#17324d] transition-colors">
                Search
              </button>
            </div>

            {/* Quick Search Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <span className="text-[11px] font-bold text-[#74777e]">Recent Queries:</span>
              {recentSearches.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setQuery(s)}
                  className="bg-[#F7F3EC] border border-[#E7DED2] text-[11px] font-medium text-[#001d36] px-2.5 py-1 rounded-full hover:border-[#D98B3A] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-6 shadow-sm space-y-4 max-w-4xl mx-auto">
            <h3 className="font-bold text-sm text-[#001d36]">Search Results Index</h3>
            <p className="text-xs text-[#74777e]">
              Enter a search prompt above to filter through 1.2M+ historical and real-time disaster intelligence data points.
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
export default SearchIntelligence
