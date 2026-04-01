import { useState, useEffect } from 'react'
import { DollarSign, Clock, AlertCircle, RefreshCw, CheckCircle, XCircle, Hourglass, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import gif from '../../assets/gif.gif'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const GURU_COLOR = '#f47c20'

const STATUS_CONFIG = {
  accepted: { icon: CheckCircle, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', label: 'Accepted' },
  rejected: { icon: XCircle, color: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', label: 'Rejected' },
  pending: { icon: Hourglass, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', label: 'Pending' },
}

const GuruBids = () => {
  const [bids, setBids] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [connectionStatus, setConnectionStatus] = useState('checking')

  useEffect(() => {
    checkConnection()
  }, [])

  useEffect(() => {
    if (connectionStatus === 'connected') loadBids()
  }, [filter, connectionStatus])

  const checkConnection = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/guru/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setConnectionStatus(data.connected ? 'connected' : 'disconnected')
      } else {
        setConnectionStatus('disconnected')
      }
    } catch {
      setConnectionStatus('disconnected')
    }
  }

  const loadBids = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/guru/bids?filter=${filter}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setBids(data.bids || data || [])
      } else {
        setBids([])
      }
    } catch {
      toast.error('Failed to load Guru bids')
      setBids([])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: GURU_COLOR }}>G</div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">My Guru Quotes</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{bids.length} quotes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {['all', 'pending', 'accepted', 'rejected'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
                filter === f ? 'text-white' : 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800'
              }`}
              style={filter === f ? { backgroundColor: GURU_COLOR } : {}}
            >
              {f}
            </button>
          ))}
          <button onClick={loadBids} disabled={isLoading} className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {connectionStatus === 'disconnected' && (
        <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
          <AlertCircle size={18} className="text-yellow-600 flex-shrink-0" />
          <p className="text-sm text-yellow-800 dark:text-yellow-300">Guru not connected. Visit guru.com with the extension active to connect.</p>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-16">
          <img src={gif} alt="Loading" className="w-12 h-12 object-contain" />
        </div>
      )}

      {!isLoading && connectionStatus === 'connected' && bids.length === 0 && (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <div className="w-10 h-10 rounded-full mx-auto mb-3 opacity-30 flex items-center justify-center text-2xl font-bold">G</div>
          <p className="font-medium">No quotes yet</p>
          <p className="text-sm mt-1">Quotes placed via the auto-bidder will appear here</p>
        </div>
      )}

      {!isLoading && bids.map(bid => {
        const statusKey = (bid.status || 'pending').toLowerCase()
        const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending
        const Icon = cfg.icon
        return (
          <div key={bid.id || bid.project_id} className="bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">{bid.project_title || bid.title || 'Untitled Project'}</h3>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {bid.bid_amount && (
                    <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                      <DollarSign size={13} />{bid.bid_amount}
                    </span>
                  )}
                  {bid.submitted_at && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock size={12} />{new Date(bid.submitted_at).toLocaleDateString()}
                    </span>
                  )}
                  <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                    <Icon size={11} />{cfg.label}
                  </span>
                </div>
                {bid.proposal_text && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{bid.proposal_text}</p>
                )}
              </div>
              {bid.project_url && (
                <a href={bid.project_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-500 transition-colors flex-shrink-0">
                  <ExternalLink size={15} />
                </a>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default GuruBids
