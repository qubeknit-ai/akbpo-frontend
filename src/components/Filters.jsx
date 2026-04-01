import { Search, Filter, ChevronDown, X, ArrowUpDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

const Filters = ({ searchTerm, setSearchTerm, selectedPlatform, setSelectedPlatform, selectedStatus, setSelectedStatus, sortBy, setSortBy, platforms, statuses }) => {
  const [isPlatformOpen, setIsPlatformOpen] = useState(false)
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)
  const platformRef = useRef(null)
  const statusRef = useRef(null)
  const sortRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (platformRef.current && !platformRef.current.contains(event.target)) {
        setIsPlatformOpen(false)
      }
      if (statusRef.current && !statusRef.current.contains(event.target)) {
        setIsStatusOpen(false)
      }
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setIsSortOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
        <input
          type="text"
          placeholder="Search leads..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2.5 pl-10 bg-gray-50 dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
          style={{ outlineColor: '#b59d32' }}
        />
      </div>

      <div className="flex gap-2 sm:gap-3">
        {/* Platform Filter */}
        <div className="flex-1 sm:flex-none relative" ref={platformRef}>
          <button
            onClick={() => setIsPlatformOpen(!isPlatformOpen)}
            className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Filter size={16} />
            <span className="hidden sm:inline">{selectedPlatform || 'All Platforms'}</span>
            <span className="sm:hidden">{selectedPlatform || 'Platform'}</span>
            {selectedPlatform && (
              <X
                size={14}
                className="ml-1"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedPlatform('')
                }}
              />
            )}
            <ChevronDown size={16} className={`transition-transform ${isPlatformOpen ? 'rotate-180' : ''}`} />
          </button>

          {isPlatformOpen && (
            <div className="absolute top-full mt-2 w-48 bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
              <button
                onClick={() => {
                  setSelectedPlatform('')
                  setIsPlatformOpen(false)
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                All Platforms
              </button>
              {platforms.map((platform) => (
                <button
                  key={platform}
                  onClick={() => {
                    setSelectedPlatform(platform)
                    setIsPlatformOpen(false)
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    selectedPlatform === platform
                      ? 'font-medium text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  style={selectedPlatform === platform ? { backgroundColor: '#b59d32' } : {}}
                >
                  {platform}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex-1 sm:flex-none relative" ref={statusRef}>
          <button
            onClick={() => setIsStatusOpen(!isStatusOpen)}
            className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="hidden sm:inline">{selectedStatus || 'All Statuses'}</span>
            <span className="sm:hidden">{selectedStatus || 'Status'}</span>
            {selectedStatus && (
              <X
                size={14}
                className="ml-1"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedStatus('')
                }}
              />
            )}
            <ChevronDown size={16} className={`transition-transform ${isStatusOpen ? 'rotate-180' : ''}`} />
          </button>

          {isStatusOpen && (
            <div className="absolute top-full mt-2 w-48 bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
              <button
                onClick={() => {
                  setSelectedStatus('')
                  setIsStatusOpen(false)
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                All Statuses
              </button>
              {statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setSelectedStatus(status)
                    setIsStatusOpen(false)
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    selectedStatus === status
                      ? 'font-medium text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  style={selectedStatus === status ? { backgroundColor: '#b59d32' } : {}}
                >
                  {status}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sort Filter */}
        <div className="flex-1 sm:flex-none relative" ref={sortRef}>
          <button
            onClick={() => setIsSortOpen(!isSortOpen)}
            className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowUpDown size={16} />
            <span className="hidden sm:inline">
              {sortBy === 'bids-low' ? 'Bids: Low to High' : 
               sortBy === 'bids-high' ? 'Bids: High to Low' : 
               sortBy === 'connects-low' ? 'Connects: Low to High' : 
               sortBy === 'connects-high' ? 'Connects: High to Low' : 
               'Sort'}
            </span>
            <span className="sm:hidden">Sort</span>
            {sortBy && (
              <X
                size={14}
                className="ml-1"
                onClick={(e) => {
                  e.stopPropagation()
                  setSortBy('')
                }}
              />
            )}
            <ChevronDown size={16} className={`transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
          </button>

          {isSortOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 sm:w-64 bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
              <button
                onClick={() => {
                  setSortBy('')
                  setIsSortOpen(false)
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800"
              >
                Default (Newest First)
              </button>
              
              <button
                onClick={() => {
                  setSortBy('bids-low')
                  setIsSortOpen(false)
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  sortBy === 'bids-low'
                    ? 'font-medium text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                style={sortBy === 'bids-low' ? { backgroundColor: '#b59d32' } : {}}
              >
                Bids: Low to High
              </button>
              <button
                onClick={() => {
                  setSortBy('bids-high')
                  setIsSortOpen(false)
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  sortBy === 'bids-high'
                    ? 'font-medium text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                style={sortBy === 'bids-high' ? { backgroundColor: '#b59d32' } : {}}
              >
                Bids: High to Low
              </button>
              <button
                onClick={() => {
                  setSortBy('connects-low')
                  setIsSortOpen(false)
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  sortBy === 'connects-low'
                    ? 'font-medium text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                style={sortBy === 'connects-low' ? { backgroundColor: '#b59d32' } : {}}
              >
                Connects: Low to High
              </button>
              <button
                onClick={() => {
                  setSortBy('connects-high')
                  setIsSortOpen(false)
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  sortBy === 'connects-high'
                    ? 'font-medium text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                style={sortBy === 'connects-high' ? { backgroundColor: '#b59d32' } : {}}
              >
                Connects: High to Low
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Filters
