import { useState, useEffect } from 'react'
import { RefreshCw, TrendingUp, CheckCircle, XCircle, Clock, DollarSign, Award, Target, ExternalLink } from 'lucide-react'
import gif from '../../assets/gif.gif'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const PACKAGE_NAMES = { 1: 'Free', 3: 'Basic', 4: 'Pro', 5: 'Plus' }

const STATUS_COLORS = {
  submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  accepted: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  hired: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  withdrawn: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

const TruelancerBids = () => {
  const [bids, setBids] = useState([])
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filterStatus, setFilterStatus] = useState('all')

  const PER_PAGE = 20

  useEffect(() => {
    loadAll()
  }, [])

  useEffect(() => {
    loadBids()
  }, [currentPage, filterStatus])

  const loadAll = async () => {
    setIsLoading(true)
    await Promise.all([loadBids(), loadStats()])
    setIsLoading(false)
  }

  const loadBids = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        page: currentPage,
        per_page: PER_PAGE,
        live: 'true'
      })
      if (filterStatus !== 'all') params.set('status', filterStatus)

      const response = await fetch(`${API_URL}/api/truelancer/bids?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        const bidsList = data.bids || data.data || []
        setBids(bidsList)
        if (data.total) {
          setTotalPages(Math.ceil(data.total / PER_PAGE))

          // Calculate Avg Rank from current page bids
          const ranks = bidsList
            .map(b => parseInt(b.total_proposals))
            .filter(r => !isNaN(r))

          const avgRank = ranks.length > 0
            ? (ranks.reduce((a, b) => a + b, 0) / ranks.length).toFixed(1)
            : '0'

          const activeCount = bidsList.filter(b =>
            b.status && b.status.toLowerCase().includes('active')
          ).length

          setStats(prev => ({
            ...prev,
            total_bids: data.total,
            avg_rank: avgRank,
            current_active: activeCount,
            bids_today: prev?.bids_today || 0,
          }))
        }
      }
    } catch { }
  }

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/truelancer/autobid/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch { }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadAll()
    setIsRefreshing(false)
  }

  const formatCurrency = (amount, currency = 'USD') => {
    if (!amount && amount !== 0) return 'N/A'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 0 }).format(amount)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getStatusBadge = (status) => {
    const normalized = (status || 'pending').toLowerCase()
    const colorClass = STATUS_COLORS[normalized] || STATUS_COLORS.pending
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {normalized.charAt(0).toUpperCase() + normalized.slice(1)}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <img src={gif} alt="Loading" className="h-12 object-contain" />
        <p className="text-gray-600 dark:text-gray-400">Loading bid history...</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#1f1f1f] rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                <Target className="w-5 h-5" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Bids</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total_bids ?? 0}</p>
          </div>

          <div className="bg-white dark:bg-[#1f1f1f] rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Today</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.bids_today ?? 0}</p>
          </div>

          <div className="bg-white dark:bg-[#1f1f1f] rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                <Award className="w-5 h-5" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Avg Rank</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stats.avg_rank ?? '0'}
            </p>
          </div>

          <div className="bg-white dark:bg-[#1f1f1f] rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Current Active</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.current_active ?? 0}</p>
          </div>
        </div>
      )}

      {/* Bid History Table */}
      <div className="bg-white dark:bg-[#1f1f1f] rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Bid History</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">All proposals submitted via Auto Bidder</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1) }}
              className="px-3 py-2 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Status</option>
              <option value="submitted">Submitted</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="hired">Hired</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {bids.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Clock className="w-12 h-12 text-gray-300 dark:text-gray-600" />
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 font-medium">No bids yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Enable the Auto Bidder in Settings to start submitting proposals
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#252525]">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Project</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rank</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {bids.map((bid, index) => (
                    <tr
                      key={bid.id || index}
                      className="hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="max-w-xs">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                            {bid.project_title || bid.title || `Project #${bid.project_id || index + 1}`}
                          </p>
                          {bid.skills && bid.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {bid.skills.slice(0, 3).map((s, i) => (
                                <span key={i} className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                                  {s}
                                </span>
                              ))}
                              {bid.skills.length > 3 && (
                                <span className="text-xs text-gray-500">+{bid.skills.length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {bid.total_proposals ?? bid.competition ?? 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(bid.status)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {formatDate(bid.submitted_at || bid.created_at)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {bid.project_url && (
                          <a
                            href={bid.project_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            View
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default TruelancerBids
