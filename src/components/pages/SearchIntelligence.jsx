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
    "Telemetry"
  ]

  const handleSearchSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (!query.trim()) return

    setSearching(true)
    setSearched(true)
    try {
      const searchResults = await searchIntelligence(query)
      setResults(searchResults)
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
        <Header title="Search Intelligence Database" />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Search Hero Box */}
          <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-8 shadow-sm space-y-4 max-w-4xl mx-auto text-center">
            <span className="material-symbols-outlined text-4xl text-[#D98B3A]">manage_search</span>
            <h2 className="text-xl font-bold text-[#001d36]">Natural Language Intelligence Search</h2>
            <p className="text-xs text-[#74777e] max-w-md mx-auto">
              Query multi-source disaster telemetry, satellite records, social stream archives, and historical incident logs in Cloud Firestore.
            </p>

            <form onSubmit={handleSearchSubmit} className="relative max-w-2xl mx-auto mt-4">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask DisasterLens AI e.g. 'flood', 'gas leak', 'bridge'..."
                className="w-full bg-white border border-[#E7DED2] rounded-xl py-3 pl-12 pr-28 text-sm text-[#001d36] focus:outline-none focus:border-[#D98B3A] shadow-sm"
              />
              <span className="material-symbols-outlined absolute left-4 top-3.5 text-[#74777e]">search</span>
              <button 
                type="submit"
                disabled={searching}
                className="absolute right-2 top-2 bg-[#001d36] text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-[#17324d] transition-colors cursor-pointer disabled:opacity-50"
              >
                {searching ? "Searching..." : "Search"}
              </button>
            </form>

            {/* Quick Search Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <span className="text-[11px] font-bold text-[#74777e]">Popular Keywords:</span>
              {recentSearches.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(s)
                    searchIntelligence(s).then(res => {
                      setResults(res)
                      setSearched(true)
                    })
                  }}
                  className="bg-[#F7F3EC] border border-[#E7DED2] text-[11px] font-medium text-[#001d36] px-2.5 py-1 rounded-full hover:border-[#D98B3A] transition-colors cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Results Summary & List Box */}
          <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-6 shadow-sm space-y-4 max-w-4xl mx-auto">
            <div className="flex justify-between items-center border-b border-[#E7DED2] pb-3">
              <h3 className="font-bold text-sm text-[#001d36]">Firestore Query Search Index Results</h3>
              <span className="text-xs font-mono text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full font-bold">
                {searched ? `${results.length} Matches Found` : "Ready to Search"}
              </span>
            </div>

            {searched && results.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <span className="material-symbols-outlined text-3xl text-gray-400">search_off</span>
                <p className="text-xs text-[#74777e]">No exact matching records found for "{query}". Try keywords like "flood" or "sensor".</p>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-3">
                {results.map((res, idx) => (
                  <div key={idx} className="p-4 border border-[#E7DED2] rounded-lg bg-white space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="bg-[#001d36] text-white text-[10px] px-2 py-0.5 rounded uppercase font-bold font-mono">
                        {res.type}
                      </span>
                      <span className="text-xs font-mono text-green-700 font-bold">AI Conf: {res.confidence}%</span>
                    </div>
                    <h4 className="font-bold text-sm text-[#001d36]">{res.title}</h4>
                    <p className="text-xs text-[#74777e] leading-relaxed">{res.snippet}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#74777e]">
                Enter a search prompt above to filter through historical and real-time disaster intelligence data points in Cloud Firestore.
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
export default SearchIntelligence
