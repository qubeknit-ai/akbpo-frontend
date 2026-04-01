import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Activity, Database, Target, Zap, Bell } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { logDebug, logError, logWarn } from '../utils/logger'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const AdminAnalytics = () => {
  const [leadsData, setLeadsData] = useState([])
  const [systemHealth, setSystemHealth] = useState({
    upwork_automation: true,
    freelancer_automation: true,
    telegram_alerts: true,
    last_sync: 'N/A',
    error_count: 0
  })
  const [loading, setLoading] = useState(() => {
    const cached = sessionStorage.getItem('adminAnalyticsData')
    return !cached
  })

  useEffect(() => {
    fetchData()
    
    // Listen for data refresh events
    const handleDataRefresh = () => {
      logDebug('Admin analytics refresh event received')
      sessionStorage.removeItem('adminAnalyticsData')
      fetchData()
    }
    
    window.addEventListener('dashboardRefresh', handleDataRefresh)
    
    return () => {
      window.removeEventListener('dashboardRefresh', handleDataRefresh)
    }
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        logWarn('Admin analytics fetch cancelled - missing auth token')
        toast.error('Please sign in to view admin analytics.')
        setLoading(false)
        return
      }

      const headers = {
        'Authorization': `Bearer ${token}`
      }

      // Fetch all leads from all users and system settings in parallel
      const [leadsResponse, settingsResponse] = await Promise.all([
        fetch(`${API_URL}/api/admin/leads`, { headers }),
        fetch(`${API_URL}/api/admin/settings`, { headers })
      ])
      
      if (!leadsResponse.ok) {
        logError('Failed to fetch admin leads for analytics', leadsResponse.status)
        toast.error('Unable to load admin analytics data.')
        setLoading(false)
        return
      }
      
      const leadsDataResponse = await leadsResponse.json()
      setLeadsData(leadsDataResponse.leads || [])
      
      // Fetch system health from settings
      let healthData = {
        upwork_automation: false,
        freelancer_automation: false,
        telegram_alerts: false,
        last_sync: 'N/A',
        error_count: 0
      }
      
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json()
        healthData = {
          upwork_automation: false,
          freelancer_automation: false,
          telegram_alerts: settingsData.telegram_enabled || false,
          last_sync: 'Just now', // Could be calculated from last lead created_at
          error_count: 0 // Would need error logging system
        }
      }
      
      setSystemHealth(healthData)
      
      // Cache the data in sessionStorage
      sessionStorage.setItem('adminAnalyticsData', JSON.stringify({
        leadsData: leadsDataResponse.leads || [],
        systemHealth: healthData
      }))
    } catch (error) {
      logError('Error fetching admin analytics data', error)
      toast.error('Load On server Plz try again Later')
    } finally {
      setLoading(false)
    }
  }

  // Calculate top performing niches
  const getTopPerformingNiches = () => {
    const nicheData = {}
    
    leadsData.forEach(lead => {
      const category = lead.category || 'Uncategorized'
      if (!nicheData[category]) {
        nicheData[category] = {
          count: 0,
          approved: 0
        }
      }
      nicheData[category].count++
      if (lead.proposal_accepted === true) {
        nicheData[category].approved++
      }
    })
    
    return Object.entries(nicheData)
      .map(([name, data]) => ({ 
        name, 
        count: data.count,
        approved: data.approved,
        conversionRate: data.count > 0 ? ((data.approved / data.count) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

  // Calculate platform performance for all users
  const getPlatformPerformance = () => {
    const platforms = {}
    
    leadsData.forEach(lead => {
      const platform = lead.platform || 'Unknown'
      if (!platforms[platform]) {
        platforms[platform] = {
          total: 0,
          drafted: 0,
          approved: 0,
          avgScore: [],
          budgets: [],
          responseTimes: []
        }
      }
      
      platforms[platform].total++
      if (lead.status === 'AI Drafted') platforms[platform].drafted++
      if (lead.proposal_accepted === true) platforms[platform].approved++
      
      try {
        const score = parseFloat(lead.score)
        if (!isNaN(score)) platforms[platform].avgScore.push(score)
      } catch (e) {}
      
      // Calculate budget
      if (lead.budget) {
        try {
          const budgetStr = String(lead.budget).replace(/[$,]/g, '').trim()
          let value = 0
          
          if (budgetStr.includes('-')) {
            const parts = budgetStr.split('-')
            const low = parseFloat(parts[0].replace(/[^0-9.]/g, ''))
            const high = parseFloat(parts[1].replace(/[^0-9.]/g, ''))
            value = (low + high) / 2
          } else {
            value = parseFloat(budgetStr.replace(/[^0-9.]/g, ''))
          }
          
          if (!isNaN(value) && value > 0) {
            platforms[platform].budgets.push(value)
          }
        } catch (e) {}
      }
      
      // Calculate response time
      if (lead.posted_time && lead.created_at) {
        try {
          const postedTime = new Date(lead.posted_time)
          const createdTime = new Date(lead.created_at)
          const diffMinutes = (createdTime - postedTime) / (1000 * 60)
          
          if (diffMinutes >= 0 && diffMinutes < 1440) {
            platforms[platform].responseTimes.push(diffMinutes)
          }
        } catch (e) {}
      }
    })
    
    return Object.entries(platforms).map(([name, data]) => ({
      name,
      total: data.total,
      drafted: data.drafted,
      approved: data.approved,
      avgScore: data.avgScore.length > 0 
        ? (data.avgScore.reduce((a, b) => a + b, 0) / data.avgScore.length).toFixed(1)
        : 0,
      avgJobValue: data.budgets.length > 0
        ? Math.round(data.budgets.reduce((a, b) => a + b, 0) / data.budgets.length)
        : 0,
      avgResponseTime: data.responseTimes.length > 0
        ? (data.responseTimes.reduce((a, b) => a + b, 0) / data.responseTimes.length).toFixed(1)
        : 0,
      conversionRate: data.total > 0 ? ((data.approved / data.total) * 100).toFixed(1) : 0
    }))
  }

  const topNiches = getTopPerformingNiches()
  const platformPerformance = getPlatformPerformance()

  const nicheColors = [
    '#0CC0C0', '#E99923', '#FF6B35', '#000094', '#10b981',
    '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16'
  ]

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8  min-h-full">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8  min-h-full">

      {/* Top-Performing Niches */}
      <div className="mb-6">
        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-400">Top-Performing Niches</h2>
              <p className="text-sm text-gray-600 dark:text-gray-500">Top 10 categories by lead count</p>
            </div>
          </div>
          
          {topNiches.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topNiches} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    width={150}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value, name, props) => {
                      if (name === 'count') {
                        return [
                          <div key="tooltip">
                            <div>{value} total leads</div>
                            <div className="text-green-600">{props.payload.approved} approved ({props.payload.conversionRate}%)</div>
                          </div>,
                          'Leads'
                        ]
                      }
                      return [value, name]
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                    {topNiches.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={nicheColors[index % nicheColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              
              <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
                {topNiches.map((niche, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0 " 
                      style={{ backgroundColor: nicheColors[index % nicheColors.length] }}
                    ></div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-700 truncate dark:text-gray-400">{niche.name}</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-400">
                        {niche.count} <span className="text-xs text-gray-500 dark:text-gray-400">({niche.approved} ✓ • {niche.conversionRate}%)</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[400px] text-gray-400">
              No niche data available
            </div>
          )}
        </div>
      </div>

      {/* System Health Snapshot */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <Activity size={20} className="text-gray-700 dark:text-gray-400" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-400">System Health</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg dark:bg-[#212121] ">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-400">Upwork Automation</span>
            </div>
            <span className={`text-lg ${systemHealth.upwork_automation ? 'text-green-600' : 'text-red-600'}`}>
              {systemHealth.upwork_automation ? '✅' : '✅'}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg dark:bg-[#212121]">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-400">Freelancer Automation</span>
            </div>
            <span className={`text-lg ${systemHealth.freelancer_automation ? 'text-green-600' : 'text-red-600'}`}>
              {systemHealth.freelancer_automation ? '✅' : '✅'}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg dark:bg-[#212121]">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-400">Telegram Alerts</span>
            </div>
            <span className={`text-lg ${systemHealth.telegram_alerts ? 'text-green-600' : 'text-red-600'}`}>
              {systemHealth.telegram_alerts ? '✅' : '✅'}
            </span>
          </div>
          <div className="flex flex-col p-3 bg-gray-50 rounded-lg dark:bg-[#212121]">
            <span className="text-xs text-gray-600 mb-1 dark:text-gray-400">Last Sync</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-400">{systemHealth.last_sync}</span>
          </div>
          <div className="flex flex-col p-3 bg-gray-50 rounded-lg dark:bg-[#212121]">
            <span className="text-xs text-gray-600 mb-1 dark:text-gray-400">Error Logs Today</span>
            <span className={`text-sm font-semibold dark:text-gray-400${
              systemHealth.error_count === 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {systemHealth.error_count}
            </span>
          </div>
        </div>
      </div>

      {/* Platform Performance Table */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Database className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-400">Platform Performance</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Detailed metrics across all users</p>
          </div>
        </div>
        
        {platformPerformance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Platform</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Total Leads</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">AI Drafted</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Approved</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Avg Score</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Avg Job Value</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Avg Response Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {platformPerformance.map((platform, index) => (
                  <tr key={index} className="">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-300">{platform.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{platform.total}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{platform.drafted}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{platform.approved}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        platform.avgScore >= 7 ? 'bg-green-600 text-white' :
                        platform.avgScore >= 5 ? 'bg-orange-500 text-white' :
                        'bg-red-500 text-white'
                      }`}>
                        {platform.avgScore}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-300">
                      ${platform.avgJobValue.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {platform.avgResponseTime > 0 ? `${platform.avgResponseTime} min` : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                          <div
                            className="bg-gray-900 h-2 rounded-full"
                            style={{ width: `${platform.conversionRate}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium">{platform.conversionRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-400">
            No platform data available
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminAnalytics
