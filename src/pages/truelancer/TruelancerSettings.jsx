import { useState, useEffect } from 'react'
import { ExternalLink, RefreshCw, CheckCircle, XCircle, AlertCircle, Trash2, User, Play, Square, Settings, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import gif from '../../assets/gif.gif'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const PACKAGE_NAMES = { 1: 'Free', 3: 'Basic', 4: 'Pro', 5: 'Plus' }

const TruelancerSettings = () => {
  const [connectionStatus, setConnectionStatus] = useState('checking')
  const [credentials, setCredentials] = useState(null)
  const [isPageLoaded, setIsPageLoaded] = useState(false)

  const [autoBidSettings, setAutoBidSettings] = useState(() => {
    try {
      const cached = localStorage.getItem('truelancerAutoBidSettings')
      if (cached) return JSON.parse(cached)
    } catch { }
    return {
      enabled: true,
      daily_bids: 10,
      frequency_minutes: 15,
      smart_bidding: true,
      skill_matching: true,
      proposal_type: 1,
    }
  })
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [autoBidStatus, setAutoBidStatus] = useState(() => {
    try {
      return localStorage.getItem('truelancerAutoBidStatus') || 'unknown'
    } catch { }
    return 'unknown'
  })

  useEffect(() => {
    const init = async () => {
      loadCachedData()
      setIsPageLoaded(true)
      await Promise.all([checkConnection(), loadAutoBidSettings()])
    }
    init()
  }, [])

  const loadCachedData = () => {
    try {
      const cached = localStorage.getItem('truelancerCredentials')
      if (cached) setCredentials(JSON.parse(cached))
    } catch { }
  }

  const saveToCache = (data) => {
    try {
      if (data.credentials !== undefined) localStorage.setItem('truelancerCredentials', JSON.stringify(data.credentials))
      if (data.autoBidSettings !== undefined) localStorage.setItem('truelancerAutoBidSettings', JSON.stringify(data.autoBidSettings))
      if (data.autoBidStatus !== undefined) localStorage.setItem('truelancerAutoBidStatus', data.autoBidStatus)
    } catch { }
  }

  const checkConnection = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/truelancer/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setConnectionStatus(data.connected ? 'connected' : 'disconnected')
        if (data.profile) {
          setCredentials(data.profile)
          saveToCache({ credentials: data.profile })
        }
      } else {
        setConnectionStatus('disconnected')
      }
    } catch {
      setConnectionStatus('error')
    }
  }

  const loadAutoBidSettings = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/truelancer/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setAutoBidSettings(prev => ({ ...prev, ...data }))
        const status = data.enabled ? 'running' : 'stopped'
        setAutoBidStatus(status)
        saveToCache({ autoBidSettings: data, autoBidStatus: status })
      }
    } catch { }
  }

  const saveAutoBidSettings = async () => {
    setIsSavingSettings(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/truelancer/settings`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(autoBidSettings)
      })
      if (response.ok) {
        toast.success('Truelancer settings saved')
        saveToCache({ autoBidSettings: autoBidSettings })
        setAutoBidStatus(autoBidSettings.enabled ? 'running' : 'stopped')
      } else {
        throw new Error('Failed')
      }
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setIsSavingSettings(false)
    }
  }

  const disconnectTruelancer = async () => {
    if (!confirm('Are you sure you want to disconnect from Truelancer? This will remove all stored credentials.')) return
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/truelancer/disconnect`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        toast.success('Disconnected from Truelancer')
        setConnectionStatus('disconnected')
        setCredentials(null)
        localStorage.removeItem('truelancerCredentials')
      } else {
        throw new Error('Failed')
      }
    } catch {
      toast.error('Failed to disconnect')
    }
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'disconnected': return <XCircle className="w-5 h-5 text-red-500" />
      case 'error': return <AlertCircle className="w-5 h-5 text-yellow-500" />
      default: return <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected to Truelancer'
      case 'disconnected': return 'Not connected to Truelancer'
      case 'error': return 'Connection error'
      default: return 'Checking connection...'
    }
  }

  return (
    <div className="p-6 space-y-6">

      {/* Connection Status */}
      <div className="bg-white dark:bg-[#1f1f1f] rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Connection Status</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{getStatusText()}</p>
            </div>
          </div>
          {connectionStatus === 'connected' ? (
            <button
              onClick={disconnectTruelancer}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Disconnect
            </button>
          ) : (
            <button
              onClick={() => toast.info('Please use the browser extension to connect to Truelancer')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Connect
            </button>
          )}
        </div>

        {credentials && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Connection Details</h4>
              {credentials.picture_url || credentials.truelancer_picture_url ? (
                <img
                  src={credentials.picture_url || credentials.truelancer_picture_url}
                  alt="Profile"
                  className="w-12 h-12 rounded-full object-cover border-2 border-green-500"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(credentials.name || credentials.validated_username || 'T')}&background=00c853&color=fff`;
                  }}
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: '#00c853' }}
                >
                  {(credentials.name || credentials.validated_username || 'T').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Username</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {credentials.validated_username || credentials.name || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">User ID</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {credentials.truelancer_user_id || credentials.user_id || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Email</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {credentials.validated_email || credentials.email || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Package</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {credentials.package_name || PACKAGE_NAMES[credentials.package_id] || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Currency</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {credentials.currency || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Last Updated</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {credentials.updated_at ? new Date(credentials.updated_at).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Auto Bidding System */}
      <div className="bg-white dark:bg-[#1f1f1f] rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${autoBidStatus === 'running' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Auto Bidding System</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {autoBidStatus === 'running' ? 'System is active and monitoring projects' : 'System is currently paused'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-4 mr-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Daily Bids Limit</label>
              <input
                type="number" min="1" max="50"
                value={autoBidSettings.daily_bids}
                onChange={(e) => setAutoBidSettings({ ...autoBidSettings, daily_bids: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum number of bids to place per day</p>
            </div>

            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Proposal Type</label>
              <select
                value={autoBidSettings.proposal_type || 1}
                onChange={(e) => setAutoBidSettings({ ...autoBidSettings, proposal_type: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value={1}>Proposal 1</option>
                <option value={2}>Proposal 2</option>
                <option value={3}>Proposal 3</option>
                <option value={4}>Proposal 4</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Select which proposal template to use for auto-bidding</p>
            </div>


          </div>

          {/* Right column */}
          <div className="space-y-4 ml-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Check Frequency (Minutes)</label>
              <div className="flex items-center gap-4">
                <input
                  type="range" min="5" max="60"
                  value={autoBidSettings.frequency_minutes}
                  onChange={(e) => setAutoBidSettings({ ...autoBidSettings, frequency_minutes: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12 text-center text-gray-900 dark:text-gray-200">
                  {autoBidSettings.frequency_minutes}m
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">How often to check for new projects (5-60 mins)</p>
            </div>

            <div className="pt-4 space-y-4">

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoBidSettings.smart_bidding}
                  onChange={(e) => setAutoBidSettings({ ...autoBidSettings, smart_bidding: e.target.checked })}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Enable Smart Bidding (Avg Price)</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">Automatically bids the average of Min/Max budget</p>
            </div>

            <div className="pt-2 space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoBidSettings.skill_matching}
                  onChange={(e) => setAutoBidSettings({ ...autoBidSettings, skill_matching: e.target.checked })}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Enable Skill Matching</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">Only bid on projects that match your profile skills</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={saveAutoBidSettings}
            disabled={isSavingSettings}
            className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-70"
            style={{ backgroundColor: '#00c853' }}
          >
            <Save className="w-4 h-4" />
            {isSavingSettings ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>


    </div>
  )
}

export default TruelancerSettings
