import { useState, useEffect } from 'react'
import { ExternalLink, RefreshCw, CheckCircle, XCircle, AlertCircle, Trash2, User, Play, Square, Settings, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import gif from '../../assets/gif.gif'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const JOB_CATEGORIES = [
  'Web Development', 'Mobile Development', 'UI/UX Design',
  'Graphic Design', 'Writing & Translation', 'Digital Marketing',
  'Data Science & Analytics', 'Admin Support', 'Customer Service',
  'Video & Animation', 'Engineering & Architecture', 'IT & Networking',
  'Sales & Marketing', 'Accounting & Consulting', 'Legal'
]

const UpworkSettings = () => {
  const [connectionStatus, setConnectionStatus] = useState('checking')
  const [credentials, setCredentials] = useState(null)
  const [isPageLoaded, setIsPageLoaded] = useState(false)

  const [autoBidSettings, setAutoBidSettings] = useState(() => {
    try {
      const cached = localStorage.getItem('upworkAutoBidSettings')
      if (cached) return JSON.parse(cached)
    } catch {}
    return {
      enabled: false,
      daily_bids: 10,
      max_connects_per_day: 60,
      frequency_minutes: 15,
      min_skill_match: 1,
      max_competition: 50,
      smart_bidding: true,
      payment_verified_only: true,
      proposal_type: 1,
      job_categories: ['Web Development'],
    }
  })
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [autoBidStatus, setAutoBidStatus] = useState(() => {
    try {
      return localStorage.getItem('upworkAutoBidStatus') || 'unknown'
    } catch {}
    return 'unknown'
  })

  const [selectedSkills, setSelectedSkills] = useState([])
  const [availableSkills, setAvailableSkills] = useState([])
  const [isLoadingSkills, setIsLoadingSkills] = useState(false)
  const [isSavingSkills, setIsSavingSkills] = useState(false)

  useEffect(() => {
    const init = async () => {
      loadCachedData()
      setIsPageLoaded(true)
      await Promise.all([checkConnection(), loadAutoBidSettings(), loadSkills()])
    }
    init()
  }, [])

  const loadCachedData = () => {
    try {
      const cached = localStorage.getItem('upworkCredentials')
      if (cached) setCredentials(JSON.parse(cached))
    } catch {}
  }

  const saveToCache = (data) => {
    try {
      if (data.credentials !== undefined) localStorage.setItem('upworkCredentials', JSON.stringify(data.credentials))
      if (data.autoBidSettings !== undefined) localStorage.setItem('upworkAutoBidSettings', JSON.stringify(data.autoBidSettings))
      if (data.autoBidStatus !== undefined) localStorage.setItem('upworkAutoBidStatus', data.autoBidStatus)
    } catch {}
  }

  const checkConnection = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/upwork/status`, {
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
      const response = await fetch(`${API_URL}/api/upwork/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setAutoBidSettings(prev => ({ ...prev, ...data }))
        const status = data.enabled ? 'running' : 'stopped'
        setAutoBidStatus(status)
        saveToCache({ autoBidSettings: data, autoBidStatus: status })
      }
    } catch {}
  }

  const saveAutoBidSettings = async () => {
    setIsSavingSettings(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/upwork/settings`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(autoBidSettings)
      })
      if (response.ok) {
        toast.success('Upwork settings saved')
        saveToCache({ autoBidSettings: autoBidSettings })
      } else {
        throw new Error('Failed')
      }
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setIsSavingSettings(false)
    }
  }

  const toggleAutoBidder = async () => {
    try {
      const token = localStorage.getItem('token')
      const action = autoBidStatus === 'running' ? 'stop' : 'start'

      if (action === 'start') {
        const settingsRes = await fetch(`${API_URL}/api/upwork/settings`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...autoBidSettings, enabled: true })
        })
        if (!settingsRes.ok) throw new Error('Failed to save settings before starting')
      }

      const response = await fetch(`${API_URL}/api/upwork/autobid/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const newStatus = action === 'start' ? 'running' : 'stopped'
        const newSettings = { ...autoBidSettings, enabled: action === 'start' }
        setAutoBidStatus(newStatus)
        setAutoBidSettings(newSettings)
        saveToCache({ autoBidStatus: newStatus, autoBidSettings: newSettings })
        toast.success(`Auto-bidder ${action === 'start' ? 'started' : 'stopped'} successfully`)
        await loadAutoBidSettings()
      } else {
        throw new Error('Failed to toggle')
      }
    } catch (error) {
      toast.error(`Failed to toggle auto-bidder: ${error.message}`)
    }
  }

  const loadSkills = async () => {
    setIsLoadingSkills(true)
    try {
      const token = localStorage.getItem('token')
      const [selectedRes, availableRes] = await Promise.all([
        fetch(`${API_URL}/api/upwork/skills`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/upwork/available-skills`, { headers: { 'Authorization': `Bearer ${token}` } })
      ])
      if (selectedRes.ok) {
        const data = await selectedRes.json()
        setSelectedSkills(data.selected_skills || [])
      }
      if (availableRes.ok) {
        const data = await availableRes.json()
        setAvailableSkills(data.available_skills || [])
      }
    } catch {}
    finally { setIsLoadingSkills(false) }
  }

  const saveSkills = async () => {
    setIsSavingSkills(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/upwork/skills`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected_skills: selectedSkills })
      })
      if (response.ok) {
        toast.success('Skills saved successfully')
      } else {
        throw new Error('Failed')
      }
    } catch {
      toast.error('Failed to save skills')
    } finally {
      setIsSavingSkills(false)
    }
  }

  const toggleSkill = (skill) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    )
  }

  const disconnectUpwork = async () => {
    if (!confirm('Are you sure you want to disconnect from Upwork? This will remove all stored credentials.')) return
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/upwork/disconnect`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        toast.success('Disconnected from Upwork')
        setConnectionStatus('disconnected')
        setCredentials(null)
        localStorage.removeItem('upworkCredentials')
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
      case 'connected': return 'Connected to Upwork'
      case 'disconnected': return 'Not connected to Upwork'
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
              onClick={disconnectUpwork}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Disconnect
            </button>
          ) : (
            <button
              onClick={() => toast.info('Please use the browser extension to connect to Upwork')}
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
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: '#14a800' }}
              >
                {(credentials.name || credentials.username || credentials.validated_username || 'U').charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Username</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {credentials.username || credentials.validated_username || credentials.name || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">User ID</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {credentials.user_id || credentials.upwork_user_id || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Email</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {credentials.email || credentials.validated_email || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Last Updated</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {credentials.updated_at ? new Date(credentials.updated_at).toLocaleString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Connection Type</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">OAuth Token</p>
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
          <button
            onClick={toggleAutoBidder}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-white ${
              autoBidStatus === 'running' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {autoBidStatus === 'running'
              ? <><Square className="w-4 h-4" /> Stop</>
              : <><Play className="w-4 h-4" /> Start</>
            }
          </button>
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
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Max Connects Per Day</label>
              <input
                type="number" min="1" max="100"
                value={autoBidSettings.max_connects_per_day}
                onChange={(e) => setAutoBidSettings({ ...autoBidSettings, max_connects_per_day: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum Upwork Connects to spend per day</p>
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
              </select>
              <p className="text-xs text-gray-500 mt-1">Select which proposal template to use for auto-bidding</p>
            </div>

            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Min Skill Match</label>
              <input
                type="number" min="1" max="10"
                value={autoBidSettings.min_skill_match}
                onChange={(e) => setAutoBidSettings({ ...autoBidSettings, min_skill_match: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum number of your skills that must match project requirements</p>
            </div>

            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Max Competition (Existing Proposals)</label>
              <input
                type="number"
                value={autoBidSettings.max_competition}
                onChange={(e) => setAutoBidSettings({ ...autoBidSettings, max_competition: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Skip jobs that already have more than this many proposals</p>
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

            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Job Categories</label>
              <div className="space-y-2">
                {JOB_CATEGORIES.map((cat) => (
                  <label key={cat} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(autoBidSettings.job_categories || []).includes(cat)}
                      onChange={(e) => {
                        const cats = autoBidSettings.job_categories || []
                        setAutoBidSettings({
                          ...autoBidSettings,
                          job_categories: e.target.checked
                            ? [...cats, cat]
                            : cats.filter(c => c !== cat)
                        })
                      }}
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{cat}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Select Upwork job categories to target</p>
            </div>

            <div className="pt-4">
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

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoBidSettings.payment_verified_only}
                  onChange={(e) => setAutoBidSettings({ ...autoBidSettings, payment_verified_only: e.target.checked })}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Payment Verified Only</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">Only bid on jobs from clients with verified payment methods</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={saveAutoBidSettings}
            disabled={isSavingSettings}
            className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-70"
            style={{ backgroundColor: '#14a800' }}
          >
            <Save className="w-4 h-4" />
            {isSavingSettings ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {/* My Skills */}
      <div className="bg-white dark:bg-[#1f1f1f] rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">My Skills</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select skills to filter Upwork projects that match your expertise
              </p>
            </div>
          </div>
        </div>

        {isLoadingSkills ? (
          <div className="text-center py-8">
            <img src={gif} alt="Loading" className="h-12 object-contain mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading skills...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Selected: {selectedSkills.length} skill{selectedSkills.length !== 1 ? 's' : ''}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedSkills([...availableSkills])}
                  disabled={selectedSkills.length === availableSkills.length || availableSkills.length === 0}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30"
                >
                  Select All
                </button>
                <button
                  onClick={() => setSelectedSkills([])}
                  disabled={selectedSkills.length === 0}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
              {availableSkills.map((skill) => (
                <label
                  key={skill}
                  className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedSkills.includes(skill)}
                    onChange={() => toggleSkill(skill)}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{skill}</span>
                </label>
              ))}
            </div>

            {availableSkills.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">No skills available. Loading...</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={saveSkills}
            disabled={isSavingSkills || isLoadingSkills}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-70"
          >
            <Save className="w-4 h-4" />
            {isSavingSkills ? 'Saving...' : 'Save Skills'}
          </button>
        </div>
      </div>

    </div>
  )
}

export default UpworkSettings
