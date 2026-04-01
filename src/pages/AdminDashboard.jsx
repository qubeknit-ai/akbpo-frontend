import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Users, Database, Zap, Clock, RefreshCw } from 'lucide-react'
import { logError } from '../utils/logger'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const AdminDashboard = () => {
  const [stats, setStats] = useState(() => {
    // Load from cache immediately
    const cached = sessionStorage.getItem('adminStats')
    if (cached) {
      try {
        return JSON.parse(cached)
      } catch (e) {
        return {
          totalUsers: 0,
          totalLeads: 0,
          autoBidEnabled: 0,
          autoBidDisabled: 0,
          avgBidFrequency: 0,
          platformBreakdown: [],
          totalRevenue: 0,
          proposalsSent: 0,
          proposalsAccepted: 0,
          successRate: 0
        }
      }
    }
    return {
      totalUsers: 0,
      totalLeads: 0,
      autoBidEnabled: 0,
      autoBidDisabled: 0,
      avgBidFrequency: 0,
      platformBreakdown: [],
      totalRevenue: 0,
      proposalsSent: 0,
      proposalsAccepted: 0,
      successRate: 0
    }
  })
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState(() => {
    const cached = sessionStorage.getItem('adminStatsTimestamp')
    return cached ? new Date(parseInt(cached)) : null
  })

  useEffect(() => {
    loadStats()
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadStats(true) // Background sync
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const loadStats = async (isBackgroundSync = false) => {
    try {
      if (!isBackgroundSync) {
        setLoading(true)
      } else {
        setSyncing(true)
      }
      
      const token = localStorage.getItem('token')
      
      // Check cache age (use cache if less than 2 minutes old and not forced refresh)
      const cacheTimestamp = sessionStorage.getItem('adminStatsTimestamp')
      const cacheAge = cacheTimestamp ? Date.now() - parseInt(cacheTimestamp) : Infinity
      
      if (cacheAge < 120000 && stats.totalUsers > 0 && !isBackgroundSync) {
        // Use cached data if less than 2 minutes old
        setLoading(false)
        return
      }
      
      const response = await fetch(`${API_URL}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
        const now = Date.now()
        // Cache the data
        sessionStorage.setItem('adminStats', JSON.stringify(data))
        sessionStorage.setItem('adminStatsTimestamp', now.toString())
        setLastSync(new Date(now))
      }
    } catch (error) {
      logError('Failed to load admin stats', error)
      if (!isBackgroundSync) {
        toast.error('Load On server Plz try again Later')
      }
    } finally {
      setLoading(false)
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8  min-h-full">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 min-h-full relative">
      {/* Page Header with Status Indicators */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 dark:text-gray-100">Dashboard Overview</h1>
        </div>
        
        {/* Status Indicators - Page Level */}
        <div className="flex items-center gap-3">
          {syncing ? (
            <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-lg shadow-sm border border-blue-200 dark:border-blue-800">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Syncing...</span>
            </div>
          ) : lastSync ? (
            <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-2 rounded-lg shadow-sm border border-green-200 dark:border-green-800">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Live</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Stats Grid - Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1 dark:text-gray-100">{stats.totalUsers}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
        </div>

        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Database className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1 dark:text-gray-100">{stats.totalLeads}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Leads</p>
        </div>

        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1 dark:text-gray-100">
            {stats.autoBidEnabled || 0}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Auto Bidders On</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {stats.autoBidDisabled || 0} disabled
          </p>
        </div>

        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1 dark:text-gray-100">
            {stats.avgBidFrequency || 0}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Avg Bid Frequency</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            minutes between bids
          </p>
        </div>
      </div>

      {/* Platform Breakdown with Revenue */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 dark:text-gray-100">Platform Usage & Revenue Breakdown</h2>
        <div className="space-y-4">
          {stats.platformBreakdown.map((platform, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  platform.name === 'Upwork' ? 'bg-green-100 dark:bg-green-900/30' :
                  platform.name === 'Freelancer' ? 'bg-blue-100 dark:bg-blue-900/30' :
                  'bg-blue-100 dark:bg-blue-900/30'
                }`}>
                  <Database className={`w-5 h-5 ${
                    platform.name === 'Upwork' ? 'text-green-600 dark:text-green-400' :
                    platform.name === 'Freelancer' ? 'text-blue-600 dark:text-blue-400' :
                    'text-blue-900 dark:text-blue-300'
                  }`} />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{platform.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{platform.count} leads • {platform.percentage}%</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  ${(platform.revenue || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Revenue</p>
              </div>
            </div>
          ))}
          
          {stats.platformBreakdown.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No platform data available yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
