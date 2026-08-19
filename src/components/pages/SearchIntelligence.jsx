import React, { useState } from 'react'
import { Sidebar } from '../common/Sidebar'
import { Header } from '../common/Header'
import { searchIntelligence } from '../../services/searchService'

export const SearchIntelligence = () => {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)

  const recentSearches = [
    "Flash flood",
    "Gas leak",
    "Bridge",
    "Wildfire",
    "Evacuation"
  ]

  const handleSearchSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (!query.trim()) return

    setSearching(true)
    setSearched(true)
    try {
      const searchResults = await searchIntelligence(query)
      setResults(searchResults || [])
    } catch (error) {
      console.error("Search execution error:", error)
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="bg-[#F7F3EC] text-[#1c1c18] font-sans flex h-screen overflow-hidden antialiased">
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-[260px] min-h-screen relative overflow-hidden">
        <Header title="Search" />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">

          {/* Search Box */}
          <div className="bg-white border border-[#E7DED2] rounded-lg p-5 md:p-6 space-y-3 max-w-3xl mx-auto">
            <div>
              <h2 className="text-base font-semibold text-[#001d36]">Search Incidents</h2>
              <p className="text-xs text-[#74777e] mt-0.5">
                Search incidents, reports, and alerts.
              </p>
            </div>

            <form onSubmit={handleSearchSubmit} className="relative mt-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by keyword..."
                className="w-full bg-[#FAF7F2] border border-[#E7DED2] rounded-lg py-2.5 pl-10 pr-24 text-xs text-[#001d36] focus:outline-none focus:border-[#001d36]"
              />
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#74777e] text-lg">search</span>
              <button 
                type="submit"
                disabled={searching}
                className="absolute right-1.5 top-1.5 bg-[#001d36] text-white px-3.5 py-1.5 rounded-md text-xs font-semibold hover:bg-[#17324d] transition-colors cursor-pointer disabled:opacity-50"
              >
                {searching ? "Searching..." : "Search"}
              </button>
            </form>

            {/* Quick Search Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-[#74777e]">Suggested:</span>
              {recentSearches.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(s)
                    setSearching(true)
                    setSearched(true)
                    searchIntelligence(s).then(res => {
                      setResults(res || [])
                    }).finally(() => setSearching(false))
                  }}
                  className="bg-[#F7F3EC] border border-[#E7DED2] text-[11px] font-medium text-[#43474d] px-2.5 py-0.5 rounded hover:border-[#74777e] transition-colors cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Results Box */}
          <div className="bg-white border border-[#E7DED2] rounded-lg p-5 space-y-3 max-w-3xl mx-auto">
            <div className="flex justify-between items-center border-b border-[#E7DED2] pb-2.5">
              <h3 className="font-semibold text-xs text-[#001d36]">Results</h3>
              <span className="text-xs text-[#74777e]">
                {searched ? `${results.length} found` : "Ready"}
              </span>
            </div>

            {searched && results.length === 0 ? (
              <div className="text-center py-6 text-xs text-[#74777e]">
                No matching records found for "{query}".
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-2.5">
                {results.map((res, idx) => (
                  <div key={idx} className="p-3 border border-[#E7DED2] rounded-lg bg-[#FAF7F2] space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] uppercase font-semibold text-[#001d36]">
                        {res.type || "Report"}
                      </span>
                      <span className="text-[11px] font-medium text-slate-700">{res.confidence}% confidence</span>
                    </div>
                    <h4 className="font-semibold text-xs text-[#001d36]">{res.title}</h4>
                    <p className="text-xs text-[#43474d] leading-relaxed">{res.snippet}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#74777e]">
                Enter a search query above to filter incidents and incoming reports.
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
export default SearchIntelligence
