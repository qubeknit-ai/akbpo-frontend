import { useState, useEffect, useMemo } from 'react'
import toast from 'react-hot-toast'
import { TrendingUp, FileText, AlertTriangle, CheckCircle, DollarSign, Target, Activity, Clock, Zap, Bell } from 'lucide-react'
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { logDebug, logError, logWarn } from '../utils/logger'
import { useQuery, useQueryClient } from '@tanstack/react-query'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const Dashboard = () => {
  const queryClient = useQueryClient()
  const navigate = (page) => {
    window.dispatchEvent(new CustomEvent('navigateToFreelancer', { detail: page }))
  }
  
  // Fetch dashboard stats with React Query
  const { data: dashboardStats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No token')
      
      const response = await fetch(`${API_URL}/api/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error('Failed to fetch stats')
      return response.json()
    },
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache data
    enabled: !!localStorage.getItem('token')
  })
  
  // Fetch pipeline data with React Query
  const { data: pipelineData, isLoading: pipelineLoading } = useQuery({
    queryKey: ['dashboard-pipeline'],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No token')
      
      const response = await fetch(`${API_URL}/api/dashboard/pipeline`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error('Failed to fetch pipeline')
      return response.json()
    },
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache data
    enabled: !!localStorage.getItem('token')
  })

  // Fetch auto-bid stats with React Query
  const { data: autoBidStats, isLoading: autoBidLoading, error: autoBidError } = useQuery({
    queryKey: ['dashboard-autobid-stats'],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No token')
      
      const response = await fetch(`${API_URL}/api/autobid/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error('Failed to fetch auto-bid stats')
      const data = await response.json()
      console.log('Auto-bid stats from API:', data) // Debug log
      return data
    },
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache data
    enabled: !!localStorage.getItem('token')
  })

  // Fetch CRM stats with React Query
  const { data: crmStats, isLoading: crmLoading } = useQuery({
    queryKey: ['dashboard-crm-stats'],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No token')
      
      const response = await fetch(`${API_URL}/api/crm/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error('Failed to fetch CRM stats')
      return response.json()
    },
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache data
    enabled: !!localStorage.getItem('token')
  })
  
  const loading = statsLoading || pipelineLoading || autoBidLoading || crmLoading
  const dashboardData = {
    ...getDefaultData(),
    ...dashboardStats,
    pipeline: pipelineData?.pipeline || [],
    // Auto-bid stats - with debug logging
    bids_week: autoBidStats?.bids_week || 0,
    success_week: autoBidStats?.success_week || 0,
    failed_week: autoBidStats?.failed_week || 0,
    system_health: {
      upwork_automation: true,
      freelancer_automation: true,
      telegram_alerts: true,
      last_sync: '2 minutes ago',
      error_count: 0
    }
  }

  // Debug logging
  console.log('Dashboard autoBidStats:', autoBidStats)
  console.log('Dashboard dashboardData bids_week:', dashboardData.bids_week)
  console.log('Dashboard dashboardData success_week:', dashboardData.success_week)
  console.log('Dashboard dashboardData failed_week:', dashboardData.failed_week)

  function getDefaultData() {
    return {
      total_leads: 0,
      ai_drafted: 0,
      low_score: 0,
      approved: 0,
      platform_distribution: [],
      timeline_data: [],
      bids_week: 0,
      success_week: 0,
      failed_week: 0,
      pipeline: [],
      system_health: {
        upwork_automation: true,
        freelancer_automation: true,
        telegram_alerts: true,
        last_sync: 'N/A',
        error_count: 0
      }
    }
  }

  const normalizeStatus = (status = '') => status.toString().trim().toLowerCase()

  const getApprovedCountFromLeads = async (headers) => {
    let leads = []
    const cachedLeads = sessionStorage.getItem('leadsData')

    if (cachedLeads) {
      try {
        leads = JSON.parse(cachedLeads)
      } catch (error) {
        logError('Unable to parse cached leads data', error)
      }
    }

    if (leads.length === 0 && headers) {
      try {
        const leadsResponse = await fetch(`${API_URL}/api/leads`, { headers })
        if (leadsResponse.ok) {
          const leadsPayload = await leadsResponse.json()
          leads = leadsPayload.leads || []
          sessionStorage.setItem('leadsData', JSON.stringify(leads))
        } else {
          logError('Failed to fetch leads for approval count', leadsResponse.status)
        }
      } catch (error) {
        logError('Error fetching leads for approval count', error)
      }
    }

    return leads.filter((lead) => normalizeStatus(lead.status) === 'approved').length
  }

  useEffect(() => {
    // Listen for data refresh events from Navbar
    const handleDataRefresh = () => {
      logDebug('Dashboard data refresh event received, invalidating queries')
      queryClient.invalidateQueries(['dashboard-stats'])
      queryClient.invalidateQueries(['dashboard-pipeline'])
      queryClient.invalidateQueries(['dashboard-autobid-stats'])
    }
    
    // Listen for custom events
    window.addEventListener('dashboardRefresh', handleDataRefresh)
    
    return () => {
      window.removeEventListener('dashboardRefresh', handleDataRefresh)
    }
  }, [queryClient])

  // Handle errors
  useEffect(() => {
    if (statsError) {
      logError('Dashboard stats error', statsError)
      toast.error('Failed to load dashboard data')
    }
    if (autoBidError) {
      logError('Dashboard auto-bid stats error', autoBidError)
      console.error('Auto-bid stats error:', autoBidError)
    }
  }, [statsError, autoBidError])

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

  const aiDraftedPercentage = dashboardData.total_leads > 0 
    ? ((dashboardData.ai_drafted / dashboardData.total_leads) * 100).toFixed(1)
    : 0

  const approvalRate = dashboardData.ai_drafted > 0
    ? ((dashboardData.approved / dashboardData.ai_drafted) * 100).toFixed(1)
    : 0

  // Dynamic data for timeline chart based on current stats
  const timelineData = [
    { 
      date: 'Current', 
      total: (dashboardData.total_leads || 0) + (dashboardData.bids_week || 0),
      approved: (dashboardData.approved || 0) + (dashboardData.success_week || 0)
    }
  ]

  const stats = useMemo(() => [
    {
      title: 'Total Leads',
      value: loading ? '...' : ((dashboardData.total_leads || 0) + (dashboardData.bids_week || 0)).toString(),
      change: loading ? 'Loading...' : `Last 7 Days`,
      changeType: 'neutral',
      icon: TrendingUp,
    },
    {
      title: 'AI Proposals Generated',
      value: loading ? '...' : ((dashboardData.ai_drafted || 0) + (dashboardData.success_week || 0)).toString(),
      change: loading ? 'Loading...' : `Last 7 Days`,
      changeType: 'neutral',
      icon: FileText,
    },
    {
      title: 'Unqualified Leads',
      value: loading ? '...' : ((dashboardData.low_score || 0) + (dashboardData.failed_week || 0)).toString(),
      change: loading ? 'Loading...' : `Last 7 Days`,
      changeType: 'warning',
      icon: AlertTriangle,
    },
    {
      title: 'Approved & Sent',
      value: loading ? '...' : ((dashboardData.approved || 0) + (dashboardData.success_week || 0)).toString(),
      change: loading ? 'Loading...' : `Last 7 Days`,
      changeType: 'positive',
      icon: CheckCircle,
    },
  ], [loading, dashboardData, aiDraftedPercentage, approvalRate])

  // Debug the stats array
  console.log('Stats array:', stats)
  console.log('Loading state:', loading)
  console.log('autoBidLoading:', autoBidLoading)
  console.log('statsLoading:', statsLoading)
  console.log('pipelineLoading:', pipelineLoading)

  // Calculate profit percentage
  const profitPercentage = useMemo(() => {
    if (loading || !crmStats) return '0'
    const revenue = crmStats.total_revenue || 0
    const profit = crmStats.total_profit || 0
    if (revenue === 0) return '0'
    return ((profit / revenue) * 100).toFixed(1)
  }, [loading, crmStats])

  const revenueStats = [
    {
      title: 'Amount Today',
      value: loading ? '...' : `$${(autoBidStats?.bid_amount_today || 0).toFixed(0)}`,
      change: 'Auto-bid amount today',
      changeType: 'neutral',
      icon: Clock,
      clickable: false
    },
    {
      title: 'Total Revenue (Closed)',
      value: loading ? '...' : `$${(crmStats?.total_revenue || 0).toFixed(0)}`,
      change: 'From closed deals',
      changeType: 'positive',
      icon: DollarSign,
      clickable: true,
      onClick: () => navigate('crm')
    },
    {
      title: 'Total Profit',
      value: loading ? '...' : `$${(crmStats?.total_profit || 0).toFixed(0)}`,
      change: 'Net profit from deals',
      changeType: 'positive',
      icon: Target,
      clickable: true,
      onClick: () => navigate('crm')
    },
    {
      title: 'Profit Percentage',
      value: loading ? '...' : `${profitPercentage}%`,
      change: 'Profit margin from revenue',
      changeType: parseFloat(profitPercentage) >= 30 ? 'positive' : 'neutral',
      icon: TrendingUp,
      clickable: false
    },
  ]

  const pipelineStageColors = {
    'New': '#3b82f6',
    'Proposal Sent': '#f59e0b',
    'Approved': '#10b981',
    'Closed': '#6366f1'
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8  min-h-full">
      {/* Lead Stats Grid */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-300 mb-3">Lead Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="bg-white dark:bg-[#1f1f1f] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                <div className="flex items-start justify-between mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</p>
                  <Icon size={18} className="text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-300 mb-2">{stat.value}</p>
                <p className={`text-sm ${
                  stat.changeType === 'positive' ? 'text-green-600' :
                  stat.changeType === 'warning' ? 'text-orange-600' :
                  'text-gray-600'
                }`}>
                  {stat.change}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Revenue Stats Grid */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-300 mb-3">Freelancer Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {revenueStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div 
                key={index} 
                className={`bg-white dark:bg-[#1f1f1f] rounded-xl border border-gray-200 dark:border-gray-800 p-6 ${
                  stat.clickable ? 'cursor-pointer hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-500 transition-all' : ''
                }`}
                onClick={stat.clickable ? stat.onClick : undefined}
              >
                <div className="flex items-start justify-between mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</p>
                  <Icon size={18} className="text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-300 mb-2">{stat.value}</p>
                <p className={`text-sm ${
                  stat.changeType === 'positive' ? 'text-green-600 dark:text-green-500' :
                  stat.changeType === 'warning' ? 'text-orange-600 dark:text-orange-500' :
                  'text-gray-600 dark:text-gray-400'
                }`}>
                  {stat.change}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pipeline Breakdown Section */}
      <div className="mb-6 sm:mb-8">
        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="mb-4 sm:mb-6">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-300">Pipeline Breakdown</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Lead stages and values</p>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-32 text-gray-400 dark:text-gray-500">
              Loading pipeline data...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* New Leads */}
              <div className="bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-300">New Leads</h4>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-300 mb-1">
                  {((dashboardData.total_leads || 0) + (dashboardData.bids_week || 0))}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Leads</p>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mt-2">
                  ${((autoBidStats?.bid_amount_today || 0) + (autoBidStats?.bid_amount_week || 0)).toFixed(0)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">Total Value</p>
              </div>

              {/* Proposals Sent */}
              <div className="bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-300">Proposals Sent</h4>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-300 mb-1">
                  {((dashboardData.ai_drafted || 0) + (dashboardData.success_week || 0))}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Leads</p>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mt-2">
                  ${(autoBidStats?.bid_amount_week || 0).toFixed(0)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">Total Value</p>
              </div>

              {/* Approved */}
              <div className="bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate('crm')}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-300">Approved</h4>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-300 mb-1">
                  {loading ? '...' : (crmStats?.active_deals || 0)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Deals</p>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mt-2">
                  ${loading ? '...' : (crmStats?.total_revenue || 0).toFixed(0)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">Total Revenue</p>
              </div>

              {/* Closed */}
              <div className="bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate('crm')}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-300">Closed</h4>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-300 mb-1">
                  {loading ? '...' : (crmStats?.total_deals || 0)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Deals</p>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mt-2">
                  ${loading ? '...' : (crmStats?.total_profit || 0).toFixed(0)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">Total Profit</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* System Health Snapshot */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
        <div className="flex items-center gap-2 mb-4 sm:mb-6">
          <Activity size={20} className="text-gray-700 dark:text-gray-300" />
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-300">System Health</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#1e1e1e] rounded-lg">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Upwork Automation</span>
            </div>
            <span className={`text-lg ${dashboardData.system_health?.upwork_automation ? 'text-green-600' : 'text-red-600'}`}>
              {dashboardData.system_health?.upwork_automation ? '✅' : '❌'}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#1e1e1e] rounded-lg">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Freelancer Automation</span>
            </div>
            <span className={`text-lg ${dashboardData.system_health?.freelancer_automation ? 'text-green-600' : 'text-red-600'}`}>
              {dashboardData.system_health?.freelancer_automation ? '✅' : '❌'}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#1e1e1e] rounded-lg">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Telegram Alerts</span>
            </div>
            <span className={`text-lg ${dashboardData.system_health?.telegram_alerts ? 'text-green-600' : 'text-red-600'}`}>
              {dashboardData.system_health?.telegram_alerts ? '✅' : '❌'}
            </span>
          </div>
          <div className="flex flex-col p-3 bg-gray-50 dark:bg-[#1e1e1e] rounded-lg">
            <span className="text-xs text-gray-600 dark:text-gray-400 mb-1">Last Sync</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-300">{dashboardData.system_health?.last_sync || 'N/A'}</span>
          </div>
          <div className="flex flex-col p-3 bg-gray-50 dark:bg-[#1e1e1e] rounded-lg">
            <span className="text-xs text-gray-600 dark:text-gray-400 mb-1">Error Logs Today</span>
            <span className={`text-sm font-semibold ${
              dashboardData.system_health?.error_count === 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {dashboardData.system_health?.error_count || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Line Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="mb-4 sm:mb-6">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-300">Total Leads vs. Approved & Sent</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Current performance overview</p>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-[250px] text-gray-400 dark:text-gray-500">
              Loading chart data...
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 6 }}
                    name="Total Leads"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="approved" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 6 }}
                    name="Approved & Sent"
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Leads</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Approved & Sent</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Pie Chart */}
        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="mb-4 sm:mb-6">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-300">Lead Source Distribution</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">By platform</p>
          </div>
          {pieChartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value, _name, props) => [`${props.payload.count} leads (${value}%)`, props.payload.name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3 mt-4">
                {pieChartData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-300">{item.count} ({item.value}%)</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400 dark:text-gray-500">
              No platform data available
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

export default Dashboard
