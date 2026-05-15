import { useState, useEffect } from 'react'
import { ExternalLink, RefreshCw, CheckCircle, XCircle, AlertCircle, Trash2, Save, Settings } from 'lucide-react'
import toast from 'react-hot-toast'
import gif from '../../assets/gif.gif'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const GURU_COLOR = '#f47c20'

const GuruSettings = () => {
  const [connectionStatus, setConnectionStatus] = useState('checking')
  const [credentials, setCredentials] = useState(null)
  const [isPageLoaded, setIsPageLoaded] = useState(false)

  const [autoBidSettings, setAutoBidSettings] = useState(() => {
    try {
      const cached = localStorage.getItem('guruAutoBidSettings')
      if (cached) return JSON.parse(cached)
    } catch { }
    return {
      enabled: false,
      daily_bids: 10,
      frequency_minutes: 15,
      smart_bidding: true,
      skill_matching: true,
      proposal_type: 1,
      max_quotes: 50,
      max_project_age_hours: 46,
    }
  })
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [autoBidStatus, setAutoBidStatus] = useState(() => {
    try { return localStorage.getItem('guruAutoBidStatus') || 'unknown' } catch { return 'unknown' }
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
      const cached = localStorage.getItem('guruCredentials')
      if (cached) setCredentials(JSON.parse(cached))
    } catch { }
  }

  const checkConnection = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/guru/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setConnectionStatus(data.connected ? 'connected' : 'disconnected')
        if (data.profile) {
          setCredentials(data.profile)
          localStorage.setItem('guruCredentials', JSON.stringify(data.profile))
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
      const res = await fetch(`${API_URL}/api/guru/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setAutoBidSettings(prev => ({ ...prev, ...data }))
        const status = data.enabled ? 'running' : 'stopped'
        setAutoBidStatus(status)
        localStorage.setItem('guruAutoBidSettings', JSON.stringify(data))
        localStorage.setItem('guruAutoBidStatus', status)
      }
    } catch { }
  }

  const saveAutoBidSettings = async () => {
    setIsSavingSettings(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/guru/settings`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(autoBidSettings)
      })
      if (res.ok) {
        toast.success('Guru settings saved')
        localStorage.setItem('guruAutoBidSettings', JSON.stringify(autoBidSettings))
        const status = autoBidSettings.enabled ? 'running' : 'stopped'
        setAutoBidStatus(status)
        localStorage.setItem('guruAutoBidStatus', status)
      } else {
        throw new Error('Failed')
      }
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setIsSavingSettings(false)
    }
  }

  const disconnectGuru = async () => {
    if (!confirm('Are you sure you want to disconnect from Guru? This will remove all stored credentials.')) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/guru/disconnect`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        toast.success('Disconnected from Guru')
        setConnectionStatus('disconnected')
        setCredentials(null)
        localStorage.removeItem('guruCredentials')
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
      case 'connected': return 'Connected to Guru'
      case 'disconnected': return 'Not connected to Guru'
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
              onClick={disconnectGuru}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Disconnect
            </button>
          ) : (
            <button
              onClick={() => toast.info('Please visit guru.com while the extension is active to connect')}
              className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors"
              style={{ backgroundColor: GURU_COLOR }}
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
              {credentials.picture_url ? (
                <img
                  src={credentials.picture_url}
                  alt="Profile"
                  className="w-12 h-12 rounded-full object-cover border-2"
                  style={{ borderColor: GURU_COLOR }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = gif; // Fallback to gif if image fails
                  }}
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: GURU_COLOR }}
                >
                  {(credentials.name || credentials.username || 'G').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Username</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {credentials.username || credentials.name || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">User ID</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {credentials.user_id || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Email</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {credentials.email || 'N/A'}
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

        {connectionStatus === 'disconnected' && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-start gap-2">
            <AlertCircle size={15} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700 dark:text-blue-400">
              <p className="font-medium mb-1">How to connect Guru:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Make sure the AB BPO Chrome extension is installed</li>
                <li>Visit <a href="https://www.guru.com" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-0.5">guru.com <ExternalLink size={10} /></a> and log in</li>
                <li>The extension auto-captures your credentials</li>
                <li>Refresh this page</li>
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* Auto Bidding System */}
      <div className="bg-white dark:bg-[#1f1f1f] rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${autoBidStatus === 'running' ? '' : 'bg-gray-100 dark:bg-gray-800 text-gray-600'}`}
              style={autoBidStatus === 'running' ? { backgroundColor: '#fff7f0', color: GURU_COLOR } : {}}>
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
                className="w-full px-3 py-2 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': GURU_COLOR }}
              >
                <option value={1}>Proposal 1</option>
                <option value={2}>Proposal 2</option>
                <option value={3}>Proposal 3</option>
                <option value={4}>Proposal 4</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Select which proposal template to use</p>
            </div>

            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Max Quotes Received</label>
              <input
                type="number" min="1" max="500"
                value={autoBidSettings.max_quotes || 50}
                onChange={(e) => setAutoBidSettings({ ...autoBidSettings, max_quotes: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2"
                style={{ '--tw-ring-color': GURU_COLOR }}
              />
              <p className="text-xs text-gray-500 mt-1">Don't bid if project has more than X quotes</p>
            </div>

            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Posted Within (Hours)</label>
              <select
                value={autoBidSettings.max_project_age_hours || 46}
                onChange={(e) => setAutoBidSettings({ ...autoBidSettings, max_project_age_hours: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': GURU_COLOR }}
              >
                <option value={24}>24 Hours</option>
                <option value={48}>48 Hours</option>
                <option value={72}>72 Hours</option>
                <option value={120}>120 Hours (5 Days)</option>
                <option value={168}>168 Hours (1 Week)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Only bid on projects posted within this time</p>
            </div>
          </div>

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
                  className="w-4 h-4 rounded"
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
                  className="w-4 h-4 rounded"
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
            style={{ backgroundColor: GURU_COLOR }}
          >
            <Save className="w-4 h-4" />
            {isSavingSettings ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default GuruSettings
