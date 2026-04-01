import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Save, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import gif from '../../assets/gif.gif'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const GURU_COLOR = '#f47c20'

const GuruSettings = () => {
  const [connectionStatus, setConnectionStatus] = useState('checking')
  const [credentials, setCredentials] = useState(null)
  const [isPageLoaded, setIsPageLoaded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [settings, setSettings] = useState(() => {
    try {
      const cached = localStorage.getItem('guruAutoBidSettings')
      if (cached) return JSON.parse(cached)
    } catch {}
    return {
      enabled: false,
      daily_bids: 10,
      frequency_minutes: 15,
      min_skill_match: 1,
      smart_bidding: true,
      employer_verified_only: false,
      job_categories: [],
    }
  })

  useEffect(() => {
    setIsPageLoaded(true)
    checkConnection()
    loadSettings()
  }, [])

  const checkConnection = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/guru/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setConnectionStatus(data.connected ? 'connected' : 'disconnected')
        setCredentials(data.profile || null)
      } else {
        setConnectionStatus('disconnected')
      }
    } catch {
      setConnectionStatus('disconnected')
    }
  }

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/guru/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setSettings(prev => ({ ...prev, ...data }))
        localStorage.setItem('guruAutoBidSettings', JSON.stringify(data))
      }
    } catch {}
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/guru/settings`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      if (response.ok) {
        localStorage.setItem('guruAutoBidSettings', JSON.stringify(settings))
        toast.success('Guru settings saved')
      } else {
        toast.error('Failed to save settings')
      }
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const disconnectGuru = async () => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`${API_URL}/api/guru/disconnect`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setConnectionStatus('disconnected')
      setCredentials(null)
      toast.success('Guru disconnected')
    } catch {
      toast.error('Failed to disconnect')
    }
  }

  if (!isPageLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <img src={gif} alt="Loading" className="w-16 h-16 object-contain" />
      </div>
    )
  }

  const statusIcon = connectionStatus === 'connected'
    ? <CheckCircle size={16} className="text-green-500" />
    : connectionStatus === 'checking'
    ? <RefreshCw size={16} className="text-gray-400 animate-spin" />
    : <XCircle size={16} className="text-red-500" />

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: GURU_COLOR }}>G</div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Guru Settings</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your Guru.com connection and automation</p>
        </div>
      </div>

      {/* Connection card */}
      <div className="bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Connection Status</h3>
          <button onClick={checkConnection} className="text-gray-400 hover:text-gray-600 transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {statusIcon}
          <span className={`text-sm font-medium ${
            connectionStatus === 'connected' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
          }`}>
            {connectionStatus === 'checking' ? 'Checking...' : connectionStatus === 'connected' ? 'Connected' : 'Not Connected'}
          </span>
        </div>

        {credentials && (
          <div className="p-3 rounded-lg" style={{ backgroundColor: '#fff7f0' }}>
            <p className="text-sm font-medium" style={{ color: GURU_COLOR }}>{credentials.name || 'Guru Account'}</p>
            {credentials.username && <p className="text-xs" style={{ color: '#c96100' }}>@{credentials.username}</p>}
          </div>
        )}

        {connectionStatus === 'disconnected' && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <AlertCircle size={15} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700 dark:text-blue-400">
              <p className="font-medium mb-1">How to connect Guru:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Make sure the AK BPO Chrome extension is installed</li>
                <li>Visit <a href="https://www.guru.com" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-0.5">guru.com <ExternalLink size={10} /></a> and log in</li>
                <li>The extension will automatically capture your token</li>
                <li>Refresh this page</li>
              </ol>
            </div>
          </div>
        )}

        {connectionStatus === 'connected' && (
          <button onClick={disconnectGuru} className="text-xs text-red-500 hover:text-red-700 transition-colors">
            Disconnect Guru
          </button>
        )}
      </div>

      {/* Auto-bid settings */}
      <div className="bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-5">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Auto-Quote Settings</h3>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Enable Auto-Quoting</p>
            <p className="text-xs text-gray-500 mt-0.5">Automatically submit quotes on matching jobs</p>
          </div>
          <button
            onClick={() => setSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
            className={`w-11 h-6 rounded-full transition-colors ${settings.enabled ? '' : 'bg-gray-300 dark:bg-gray-600'}`}
            style={settings.enabled ? { backgroundColor: GURU_COLOR } : {}}
          >
            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform mx-1 ${settings.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Daily Quote Limit</label>
            <input
              type="number"
              value={settings.daily_bids}
              onChange={e => setSettings(prev => ({ ...prev, daily_bids: parseInt(e.target.value) || 0 }))}
              min={1} max={50}
              className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Check Interval (mins)</label>
            <input
              type="number"
              value={settings.frequency_minutes}
              onChange={e => setSettings(prev => ({ ...prev, frequency_minutes: parseInt(e.target.value) || 0 }))}
              min={5} max={120}
              className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Min Skill Match</label>
            <input
              type="number"
              value={settings.min_skill_match}
              onChange={e => setSettings(prev => ({ ...prev, min_skill_match: parseInt(e.target.value) || 0 }))}
              min={1} max={10}
              className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.smart_bidding}
                onChange={e => setSettings(prev => ({ ...prev, smart_bidding: e.target.checked }))}
                className="rounded"
              />
              Smart bidding
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.employer_verified_only}
                onChange={e => setSettings(prev => ({ ...prev, employer_verified_only: e.target.checked }))}
                className="rounded"
              />
              Verified employers only
            </label>
          </div>
          <button
            onClick={saveSettings}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50"
            style={{ backgroundColor: GURU_COLOR }}
          >
            <Save size={14} />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default GuruSettings
