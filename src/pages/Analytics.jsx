import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  Target, 
  Award,
  Calendar,
  Zap,
  BarChart3,
  Activity
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart
} from 'recharts'
import { logDebug, logError, logWarn } from '../utils/logger'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const Analytics = () => {
  const [dashboardData, setDashboardData] = useState(() => {
    // Try to load cached data from sessionStorage
    const cached = sessionStorage.getItem('analyticsData')
    if (cached) {
      const data = JSON.parse(cached)
      return data.dashboardData || {
        total_leads: 0,
        ai_drafted: 0,
        low_score: 0,
        approved: 0,
        platform_distribution: [],
        timeline_data: []
      }
    }
    return {
      total_leads: 0,
      ai_drafted: 0,
      low_score: 0,
      approved: 0,
      platform_distribution: [],
      timeline_data: []
    }
  })
  const [leadsData, setLeadsData] = useState(() => {
    // Try to load cached data from sessionStorage
    const cached = sessionStorage.getItem('analyticsData')
    if (cached) {
      const data = JSON.parse(cached)
      return data.leadsData || []
    }
    return []
  })
  const [loading, setLoading] = useState(() => {
    // Only show loading if there's no cached data
    const cached = sessionStorage.getItem('analyticsData')
    return !cached
  })
  const [timeRange, setTimeRange] = useState('30') // 7, 30, 90 days

  useEffect(() => {
    fetchData()
    
    // Listen for data refresh events
    const handleDataRefresh = () => {
      logDebug('Analytics refresh event received')
      sessionStorage.removeItem('analyticsData')
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
        logWarn('Analytics fetch cancelled - missing auth token')
        toast.error('Please sign in again to view analytics.')
        setLoading(false)
        return
      }

      const headers = {
        'Authorization': `Bearer ${token}`
      }

      const [statsResponse, leadsResponse] = await Promise.all([
        fetch(`${API_URL}/api/dashboard/stats`, { headers }),
        fetch(`${API_URL}/api/leads`, { headers })
      ])
      
      if (!statsResponse.ok || !leadsResponse.ok) {
        logError('Failed to fetch analytics data', {
          statsStatus: statsResponse.status,
          leadsStatus: leadsResponse.status
        })
        toast.error('Unable to load analytics data.')
        setLoading(false)
        return
      }
      
      const statsData = await statsResponse.json()
      const leadsDataResponse = await leadsResponse.json()
      
      setDashboardData(statsData)
      setLeadsData(leadsDataResponse.leads || [])
      
      // Cache the data in sessionStorage
      sessionStorage.setItem('analyticsData', JSON.stringify({
        dashboardData: statsData,
        leadsData: leadsDataResponse.leads || []
      }))
    } catch (error) {
      logError('Error fetching analytics data', error)
      toast.error('Load On server Plz try again Later')
    } finally {
      setLoading(false)
    }
  }

  // Calculate revenue metrics
  const calculateRevenueMetrics = () => {
    let pendingRevenue = 0
    let closedRevenue = 0
    let totalBudgets = []
    
    leadsData.forEach(lead => {
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
            totalBudgets.push(value)
            
            if (lead.status === 'Approved') {
              pendingRevenue += value
            } else if (lead.status === 'Sent' || lead.status === 'Closed' || lead.status === 'Won') {
              closedRevenue += value
            }
          }
        } catch (e) {}
      }
    })
    
    const avgDealValue = totalBudgets.length > 0 
      ? totalBudgets.reduce((a, b) => a + b, 0) / totalBudgets.length 
      : 0
    
    // Calculate projected monthly revenue based on last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentApprovals = leadsData.filter(lead => {
      if (!lead.created_at || lead.status !== 'Approved') return false
      return new Date(lead.created_at) >= thirtyDaysAgo
    })
    
    const recentRevenue = recentApprovals.reduce((sum, lead) => {
      if (!lead.budget) return sum
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
        
        return sum + (isNaN(value) ? 0 : value)
      } catch (e) {
        return sum
      }
    }, 0)
    
    return {
      pendingRevenue,
      closedRevenue,
      avgDealValue,
      projectedMonthly: recentRevenue
    }
  }

  // Calculate response speed metrics
  const calculateResponseSpeed = () => {
    const timeDiffs = []
    let within10Mins = 0
    
    leadsData.forEach(lead => {
      if (lead.posted_time && lead.created_at && lead.status === 'AI Drafted') {
        try {
          const postedTime = new Date(lead.posted_time)
          const createdTime = new Date(lead.created_at)
          const diffMinutes = (createdTime - postedTime) / (1000 * 60)
          
          if (diffMinutes >= 0 && diffMinutes < 1440) { // Within 24 hours
            timeDiffs.push(diffMinutes)
            if (diffMinutes <= 10) within10Mins++
          }
        } catch (e) {}
      }
    })
    
    const avgResponseTime = timeDiffs.length > 0
      ? timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length
      : 0
    
    const within10MinsPercent = timeDiffs.length > 0
      ? (within10Mins / timeDiffs.length) * 100
      : 0
    
    return {
      avgResponseTime: avgResponseTime.toFixed(1),
      within10MinsPercent: within10MinsPercent.toFixed(1),
      totalTracked: timeDiffs.length
    }
  }

  // Calculate funnel metrics
  const calculateFunnelMetrics = () => {
    const total = leadsData.length
    const drafted = leadsData.filter(l => l.status === 'AI Drafted' || l.status === 'Approved' || l.status === 'Sent').length
    const approved = leadsData.filter(l => l.status === 'Approved' || l.status === 'Sent').length
    const sent = leadsData.filter(l => l.status === 'Sent').length
    
    return [
      { 
        stage: 'AI Drafted', 
        count: drafted, 
        percentage: total > 0 ? ((drafted / total) * 100).toFixed(1) : 0 
      },
      { 
        stage: 'Approved', 
        count: approved, 
        percentage: drafted > 0 ? ((approved / drafted) * 100).toFixed(1) : 0 
      },
      { 
        stage: 'Sent', 
        count: sent, 
        percentage: approved > 0 ? ((sent / approved) * 100).toFixed(1) : 0 
      }
    ]
  }

  // Calculate lead value by score tier
  const getLeadValueByScore = () => {
    const tiers = {
      '1-2': 0,
      '3-4': 0,
      '5-6': 0,
      '7-8': 0,
      '9-10': 0
    }
    
    leadsData.forEach(lead => {
      if (!lead.score || !lead.budget) return
      
      try {
        const score = parseFloat(lead.score)
        if (isNaN(score)) return
        
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
        
        if (isNaN(value) || value <= 0) return
        
        if (score <= 2) tiers['1-2'] += value
        else if (score <= 4) tiers['3-4'] += value
        else if (score <= 6) tiers['5-6'] += value
        else if (score <= 8) tiers['7-8'] += value
        else tiers['9-10'] += value
      } catch (e) {}
    })
    
    return [
      { tier: '1-2', value: Math.round(tiers['1-2']), color: '#FF7477' },
      { tier: '3-4', value: Math.round(tiers['3-4']), color: '#FFA500' },
      { tier: '5-6', value: Math.round(tiers['5-6']), color: '#FFD700' },
      { tier: '7-8', value: Math.round(tiers['7-8']), color: '#90EE90' },
      { tier: '9-10', value: Math.round(tiers['9-10']), color: '#0CC0C0' }
    ]
  }

  // Calculate advanced metrics
  const calculateMetrics = () => {
    const total = dashboardData.total_leads
    const drafted = dashboardData.ai_drafted
    const approved = dashboardData.approved
    const lowScore = dashboardData.low_score
    
    const conversionRate = total > 0 ? ((approved / total) * 100).toFixed(1) : 0
    const draftRate = total > 0 ? ((drafted / total) * 100).toFixed(1) : 0
    const approvalRate = drafted > 0 ? ((approved / drafted) * 100).toFixed(1) : 0
    const qualityRate = total > 0 ? (((total - lowScore) / total) * 100).toFixed(1) : 0
    
    return { conversionRate, draftRate, approvalRate, qualityRate }
  }
  
  // Calculate system efficiency score
  const calculateEfficiencyScore = () => {
    const metrics = calculateMetrics()
    const responseSpeed = calculateResponseSpeed()
    
    const conversionScore = parseFloat(metrics.conversionRate)
    const qualityScore = parseFloat(metrics.qualityRate)
    const speedScore = parseFloat(responseSpeed.within10MinsPercent)
    
    const efficiencyScore = ((conversionScore + qualityScore + speedScore) / 3).toFixed(1)
    
    return efficiencyScore
  }

  // Calculate status distribution
  const getStatusDistribution = () => {
    const statusCounts = {}
    leadsData.forEach(lead => {
      const status = lead.status || 'Unknown'
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })
    
    const colors = {
      'AI Drafted': '#0CC0C0',
      'Approved': '#E99923',
      'Rejected': '#FF7477',
      'Pending': '#777777',
      'Awaiting Review': '#000094',
      'Unknown': '#d1d5db'
    }
    
    return Object.entries(statusCounts).map(([name, count]) => ({
      name,
      value: count,
      color: colors[name] || '#94a3b8'
    }))
  }

  // Calculate score distribution
  const getScoreDistribution = () => {
    const ranges = {
      '0-3': 0,
      '4-6': 0,
      '7-8': 0,
      '9-10': 0
    }
    
    leadsData.forEach(lead => {
      try {
        const score = parseFloat(lead.score)
        if (isNaN(score)) return
        
        if (score <= 3) ranges['0-3']++
        else if (score <= 6) ranges['4-6']++
        else if (score <= 8) ranges['7-8']++
        else ranges['9-10']++
      } catch (e) {
        // Skip invalid scores
      }
    })
    
    return [
      { range: '0-3', count: ranges['0-3'], color: '#FF7477' },
      { range: '4-6', count: ranges['4-6'], color: '#777777' },
      { range: '7-8', count: ranges['7-8'], color: '#E99923' },
      { range: '9-10', count: ranges['9-10'], color: '#0CC0C0' }
    ]
  }

  // Calculate daily activity
  const getDailyActivity = () => {
    const last30Days = []
    const today = new Date()
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayLeads = leadsData.filter(lead => {
        if (!lead.created_at) return false
        const leadDate = new Date(lead.created_at).toISOString().split('T')[0]
        return leadDate === dateStr
      })
      
      const dayApproved = dayLeads.filter(l => l.status === 'Approved').length
      const dayDrafted = dayLeads.filter(l => l.status === 'AI Drafted').length
      
      last30Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        leads: dayLeads.length,
        drafted: dayDrafted,
        approved: dayApproved
      })
    }
    
    return last30Days
  }

  // Calculate platform performance
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
      if (lead.status === 'Approved') platforms[platform].approved++
      
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

  const metrics = calculateMetrics()
  const revenueMetrics = calculateRevenueMetrics()
  const responseSpeed = calculateResponseSpeed()
  const funnelMetrics = calculateFunnelMetrics()
  const leadValueByScore = getLeadValueByScore()
  const efficiencyScore = calculateEfficiencyScore()
  const statusDistribution = getStatusDistribution()
  const scoreDistribution = getScoreDistribution()
  const dailyActivity = getDailyActivity()
  const platformPerformance = getPlatformPerformance()

  const platformColors = {
    'Upwork': '#0CC0C0',
    'Freelancer': '#E99923',
    'Freelancer Plus': '#FF6B35',
    'Direct': '#000094',
    'Unknown': '#777777'
  }

  const pieChartData = (dashboardData.platform_distribution || []).map(platform => ({
    name: platform.name,
    value: platform.value,
    count: platform.count,
    color: platformColors[platform.name] || '#94a3b8'
  }))

  return (
    <div className="p-4 sm:p-6 lg:p-8  min-h-full">

      {/* System Efficiency Score - Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-1">System Efficiency Score</h2>
            <p className="text-sm text-blue-100">Overall performance metric</p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold mb-1">{efficiencyScore}%</div>
            <p className="text-sm text-blue-100">
              {efficiencyScore >= 70 ? '🚀 Excellent' : efficiencyScore >= 50 ? '✅ Good' : '⚠️ Needs Improvement'}
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-blue-400">
          <div>
            <p className="text-xs text-blue-100">Conversion</p>
            <p className="text-lg font-semibold">{metrics.conversionRate}%</p>
          </div>
          <div>
            <p className="text-xs text-blue-100">Quality</p>
            <p className="text-lg font-semibold">{metrics.qualityRate}%</p>
          </div>
          <div>
            <p className="text-xs text-blue-100">Speed</p>
            <p className="text-lg font-semibold">{responseSpeed.within10MinsPercent}%</p>
          </div>
        </div>
      </div>

      {/* Revenue Metrics */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Revenue Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-orange-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-300 mb-1">${revenueMetrics.pendingRevenue.toLocaleString()}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Pending Revenue</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Approved but not sent</p>
          </div>

          <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign size={20} className="text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-300 mb-1">${revenueMetrics.closedRevenue.toLocaleString()}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Closed Revenue</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Completed deals</p>
          </div>

          <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target size={20} className="text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-300 mb-1">${Math.round(revenueMetrics.avgDealValue).toLocaleString()}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Deal Value</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Per lead</p>
          </div>

          <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp size={20} className="text-purple-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-300 mb-1">${Math.round(revenueMetrics.projectedMonthly).toLocaleString()}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Projected Monthly</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Based on last 30 days</p>
          </div>
        </div>
      </div>

      {/* Response Speed & Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Response Speed */}
        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-300">Response Speed</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Time to AI proposal generation</p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center dark:bg-[#212121] justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600  dark:text-gray-400">Avg Time to Proposal</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-300">{responseSpeed.avgResponseTime} min</p>
              </div>
              <Clock size={32} className="text-blue-600" />
            </div>
            <div className="flex items-center justify-between dark:bg-[#212121] p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Within 10 Minutes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-300">{responseSpeed.within10MinsPercent}%</p>
              </div>
              <Zap size={32} className="text-green-600" />
            </div>
            <div className="text-xs text-gray-500 text-center pt-2">
              Tracked {responseSpeed.totalTracked} proposals with timestamps
            </div>
          </div>
        </div>

        {/* AI Proposal Funnel */}
        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-300">AI Proposal Funnel</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Conversion through stages</p>
          </div>
          <div className="space-y-4">
            {funnelMetrics.map((stage, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-300">{stage.stage}</span>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-900">{stage.count}</span>
                    <span className="text-sm text-gray-600 ml-2">({stage.percentage}%)</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${stage.percentage}%`,
                      backgroundColor: index === 0 ? '#0CC0C0' : index === 1 ? '#E99923' : '#10b981'
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lead Value by Score Tier */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-300">Lead Value by Score Tier</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total budget value per quality score range</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={leadValueByScore}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="tier" 
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              label={{ value: 'Score Range', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              label={{ value: 'Total Value ($)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              formatter={(value) => [`$${value.toLocaleString()}`, 'Total Value']}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {leadValueByScore.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Key Metrics */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Performance Metrics</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target size={20} className="text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-300 mb-1">{metrics.conversionRate}%</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Approved / Total Leads</p>
        </div>

        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Zap size={20} className="text-orange-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-300 mb-1">{metrics.draftRate}%</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">AI Draft Rate</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Drafted / Total Leads</p>
        </div>

        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Award size={20} className="text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-300 mb-1">{metrics.approvalRate}%</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Approval Rate</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Approved / Drafted</p>
        </div>

        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <BarChart3 size={20} className="text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-300 mb-1">{metrics.qualityRate}%</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Quality Rate</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">High Score Leads</p>
        </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Daily Activity Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-300">Daily Activity</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Last 30 days lead activity</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyActivity}>
              <defs>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0CC0C0" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0CC0C0" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E99923" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#E99923" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                interval={4}
              />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="leads" 
                stroke="#0CC0C0" 
                fillOpacity={1}
                fill="url(#colorLeads)"
                name="Total Leads"
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="approved" 
                stroke="#E99923" 
                fillOpacity={1}
                fill="url(#colorApproved)"
                name="Approved"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-300">Status Distribution</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Current lead statuses</p>
          </div>
          {statusDistribution.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {statusDistribution.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-xs text-gray-700 dark:text-gray-300">{item.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-300">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">
              No status data available
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Score Distribution */}
        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-300">Score Distribution</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Lead quality breakdown</p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={scoreDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="range" 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {scoreDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Platform Distribution */}
        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-300">Platform Distribution</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Lead sources</p>
          </div>
          {pieChartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, _name, props) => [`${props.payload.count} leads (${value}%)`, props.payload.name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {pieChartData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-300">{item.count} ({item.value}%)</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">
              No platform data available
            </div>
          )}
        </div>
      </div>

      {/* Platform Performance Table */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-300">Platform Performance</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Detailed metrics by platform</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-[#212121] border-b border-gray-200  dark:border-gray-600">
              <tr>
                <th className="px-4 py-3 text-left dark:text-gray-300 text-xs font-semibold text-gray-700">Platform</th>
                <th className="px-4 py-3 text-left text-xs dark:text-gray-300 font-semibold text-gray-700">Total Leads</th>
                <th className="px-4 py-3 text-left text-xs dark:text-gray-300 font-semibold text-gray-700">AI Drafted</th>
                <th className="px-4 py-3 text-left text-xs dark:text-gray-300 font-semibold text-gray-700">Approved</th>
                <th className="px-4 py-3 text-left text-xs dark:text-gray-300 font-semibold text-gray-700">Avg Score</th>
                <th className="px-4 py-3 text-left text-xs dark:text-gray-300 font-semibold text-gray-700">Avg Job Value</th>
                <th className="px-4 py-3 text-left text-xs dark:text-gray-300 font-semibold text-gray-700">Avg Response Time</th>
                <th className="px-4 py-3 text-left text-xs  dark:text-gray-300 font-semibold text-gray-700">Conversion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {platformPerformance.map((platform, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 ">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-300">{platform.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{platform.total}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{platform.drafted}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{platform.approved}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      platform.avgScore >= 7 ? 'bg-green-600 text-white dark:text-gray-300' :
                      platform.avgScore >= 5 ? 'bg-orange-500 text-white dark:text-gray-300' :
                      'bg-red-500 text-white'
                    }`}>
                      {platform.avgScore}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-300">
                    ${platform.avgJobValue.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {platform.avgResponseTime > 0 ? `${platform.avgResponseTime} min` : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                        <div
                          className="bg-gray-900 h-2 rounded-full dark:text-gray-300"
                          style={{ width: `${platform.conversionRate}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium dark:text-gray-300">{platform.conversionRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Analytics
