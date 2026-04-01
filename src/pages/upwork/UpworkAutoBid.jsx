import { useState, useEffect } from 'react'
import { Play, Square, RefreshCw, AlertCircle, CheckCircle, Zap, DollarSign, Target, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import gif from '../../assets/gif.gif'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const UpworkAutoBid = () => {
  const [logs, setLogs] = useState([])
  const [stats, setStats] = useState({ bids_today: 0, bids_week: 0, success_week: 0, is_running: false, connects_used: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [isToggling, setIsToggling] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('checking')
  const [isPageLoaded, setIsPageLoaded] = useState(false)

  useEffect(() => {
    setIsPageLoaded(true)
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/upwork/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setConnectionStatus(data.connected ? 'connected' : 'disconnected')
        if (data.connected) {
          fetchStats()
          fetchLogs()
        }
      } else {
        setConnectionStatus('disconnected')
      }
    } catch {
      setConnectionStatus('disconnected')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/upwork/autobid/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch {}
  }

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/upwork/autobid/history?limit=20`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || data || [])
      }
    } catch {}
  }

  const toggleAutoBid = async () => {
    setIsToggling(true)
    try {
      const token = localStorage.getItem('token')
      const endpoint = stats.is_running ? '/api/upwork/autobid/stop' : '/api/upwork/autobid/start'
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        toast.success(stats.is_running ? 'Upwork auto-bid stopped' : 'Upwork auto-bid started')
        setStats(prev => ({ ...prev, is_running: !prev.is_running }))
      } else {
        toast.error('Failed to toggle auto-bid')
      }
    } catch {
      toast.error('Failed to toggle auto-bid')
    } finally {
      setIsToggling(false)
    }
  }

  if (!isPageLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <img src={gif} alt="Loading" className="w-16 h-16 object-contain" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#14a800' }}>
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Upwork Auto Bid</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Automated proposal submission</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchStats(); fetchLogs() }}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={toggleAutoBid}
            disabled={isToggling || connectionStatus !== 'connected'}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 transition-colors"
            style={{ backgroundColor: stats.is_running ? '#ef4444' : '#14a800' }}
          >
            {stats.is_running ? <><Square size={14} /> Stop</> : <><Play size={14} /> Start</>}
          </button>
        </div>
      </div>

      {/* Not connected */}
      {connectionStatus === 'disconnected' && (
        <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
          <AlertCircle size={18} className="text-yellow-600 flex-shrink-0" />
          <p className="text-sm text-yellow-800 dark:text-yellow-300">Upwork not connected. Visit Upwork.com with the extension active to connect.</p>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Bids Today', value: stats.bids_today, icon: Target },
          { label: 'Bids This Week', value: stats.bids_week, icon: Zap },
          { label: 'Successful', value: stats.success_week, icon: CheckCircle },
          { label: 'Connects Used', value: stats.connects_used || 0, icon: DollarSign },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={14} className="text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          </div>
        ))}
      </div>

      {/* Status indicator */}
      <div className={`flex items-center gap-3 p-4 rounded-xl border ${
        stats.is_running
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
      }`}>
        <div className={`w-2.5 h-2.5 rounded-full ${stats.is_running ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
        <p className={`text-sm font-medium ${stats.is_running ? 'text-green-800 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'}`}>
          {stats.is_running ? 'Auto-bidder is running' : 'Auto-bidder is stopped'}
        </p>
      </div>

      {/* Recent bid logs */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Recent Activity</h3>
        {isLoading && (
          <div className="flex justify-center py-8">
            <img src={gif} alt="Loading" className="w-10 h-10 object-contain" />
          </div>
        )}
        {!isLoading && logs.length === 0 && (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            <Clock size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No bid activity yet</p>
          </div>
        )}
        {!isLoading && logs.map((log, i) => (
          <div key={i} className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${log.status === 'success' ? 'bg-green-500' : log.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{log.project_title || log.title || 'Unknown project'}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {log.bid_amount && <span className="text-xs text-gray-500">${log.bid_amount}</span>}
                <span className="text-xs text-gray-400">{log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default UpworkAutoBid
