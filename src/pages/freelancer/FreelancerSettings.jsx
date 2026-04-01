import { useState, useEffect } from 'react'
import { ExternalLink, RefreshCw, CheckCircle, XCircle, AlertCircle, Trash2, User, Play, Square, Settings, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { logError } from '../../utils/logger'
import gif from '../../assets/gif.gif'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const FreelancerSettings = () => {
  const [connectionStatus, setConnectionStatus] = useState('checking')
  const [credentials, setCredentials] = useState(null)
  const [profileData, setProfileData] = useState(null)
  const [isPageLoaded, setIsPageLoaded] = useState(false)

  // Auto-bid settings state - Load from cookies first
  const [autoBidSettings, setAutoBidSettings] = useState(() => {
    try {
      const cached = localStorage.getItem('autoBidSettings')
      if (cached) {
        return JSON.parse(cached)
      }
    } catch (error) {
      console.error('Error loading cached auto-bid settings:', error)
    }
    return {
      enabled: false,
      daily_bids: 10,
      currencies: ['USD'],
      frequency_minutes: 10,
      max_project_bids: 50,
      smart_bidding: true,
      min_skill_match: 1,
      proposal_type: 1,
      commission_projects: true
    }
  })
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [autoBidStatus, setAutoBidStatus] = useState(() => {
    try {
      const cached = localStorage.getItem('autoBidStatus')
      if (cached) {
        return cached
      }
    } catch (error) {
      console.error('Error loading cached auto-bid status:', error)
    }
    return 'unknown'
  })

  // Skills state
  const [selectedSkills, setSelectedSkills] = useState([])
  const [availableSkills, setAvailableSkills] = useState([])
  const [isLoadingSkills, setIsLoadingSkills] = useState(false)
  const [isSavingSkills, setIsSavingSkills] = useState(false)

  useEffect(() => {
    const initializePage = async () => {
      // Load cached data first to show page immediately
      loadCachedData()
      setIsPageLoaded(true)
      
      // Then fetch fresh data from database
      await Promise.all([
        checkConnection(),
        loadAutoBidSettings(),
        loadSkills()
      ])
    }
    
    initializePage()
  }, [])

  const loadCachedData = () => {
    try {
      // Load cached connection status
      const cachedConnectionStatus = localStorage.getItem('connectionStatus')
      if (cachedConnectionStatus) {
        setConnectionStatus(cachedConnectionStatus)
      }

      // Load cached credentials
      const cachedCredentials = localStorage.getItem('freelancerCredentials')
      if (cachedCredentials) {
        setCredentials(JSON.parse(cachedCredentials))
      }

      // Load cached profile data
      const cachedProfileData = localStorage.getItem('freelancerProfileData')
      if (cachedProfileData) {
        setProfileData(JSON.parse(cachedProfileData))
      }
    } catch (error) {
      console.error('Error loading cached data:', error)
    }
  }

  const saveToCaches = (data) => {
    try {
      if (data.connectionStatus !== undefined) {
        localStorage.setItem('connectionStatus', data.connectionStatus)
      }
      if (data.credentials !== undefined) {
        localStorage.setItem('freelancerCredentials', JSON.stringify(data.credentials))
      }
      if (data.profileData !== undefined) {
        localStorage.setItem('freelancerProfileData', JSON.stringify(data.profileData))
      }
      if (data.autoBidSettings !== undefined) {
        localStorage.setItem('autoBidSettings', JSON.stringify(data.autoBidSettings))
      }
      if (data.autoBidStatus !== undefined) {
        localStorage.setItem('autoBidStatus', data.autoBidStatus)
      }
    } catch (error) {
      console.error('Error saving to cache:', error)
    }
  }

  const loadAutoBidSettings = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/autobid/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setAutoBidSettings(data)
        const status = data.enabled ? 'running' : 'stopped'
        setAutoBidStatus(status)
        
        // Save to cache
        saveToCaches({
          autoBidSettings: data,
          autoBidStatus: status
        })
      }
    } catch (error) {
      console.error('Failed to load auto-bid settings:', error)
    }
  }

  const saveAutoBidSettings = async () => {
    setIsSavingSettings(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/autobid/settings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(autoBidSettings)
      })

      if (response.ok) {
        toast.success('Auto-bid settings saved')
        const data = await response.json()
        setAutoBidSettings(data)
        setAutoBidStatus(data.enabled ? 'running' : 'stopped')
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      logError('Failed to save auto-bid settings', error)
      toast.error('Failed to save settings')
    } finally {
      setIsSavingSettings(false)
    }
  }

  const loadSkills = async () => {
    setIsLoadingSkills(true)
    try {
      const token = localStorage.getItem('token')
      
      // Load selected skills
      const skillsResponse = await fetch(`${API_URL}/api/freelancer/skills`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (skillsResponse.ok) {
        const skillsData = await skillsResponse.json()
        setSelectedSkills(skillsData.selected_skills || [])
      }
      
      // Load available skills
      const availableResponse = await fetch(`${API_URL}/api/freelancer/available-skills`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (availableResponse.ok) {
        const availableData = await availableResponse.json()
        setAvailableSkills(availableData.available_skills || [])
      }
      
    } catch (error) {
      console.error('Failed to load skills:', error)
    } finally {
      setIsLoadingSkills(false)
    }
  }

  const saveSkills = async () => {
    setIsSavingSkills(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/freelancer/skills`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ selected_skills: selectedSkills })
      })

      if (response.ok) {
        toast.success('Skills saved successfully')
      } else {
        throw new Error('Failed to save skills')
      }
    } catch (error) {
      logError('Failed to save skills', error)
      toast.error('Failed to save skills')
    } finally {
      setIsSavingSkills(false)
    }
  }

  const toggleSkill = (skillName) => {
    setSelectedSkills(prev => {
      if (prev.includes(skillName)) {
        return prev.filter(skill => skill !== skillName)
      } else {
        return [...prev, skillName]
      }
    })
  }

  const selectAllSkills = () => {
    setSelectedSkills([...availableSkills])
  }

  const deselectAllSkills = () => {
    setSelectedSkills([])
  }

  const toggleAutoBidder = async () => {
    try {
      const token = localStorage.getItem('token')
      const action = autoBidStatus === 'running' ? 'stop' : 'start'

      // First save current settings to ensure they're applied
      if (action === 'start') {
        const settingsResponse = await fetch(`${API_URL}/api/autobid/settings`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(autoBidSettings)
        })

        if (!settingsResponse.ok) {
          throw new Error('Failed to save settings before starting')
        }
      }

      // Then start/stop the auto-bidder
      const response = await fetch(`${API_URL}/api/autobid/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const result = await response.json()
        
        // Wait for database confirmation before updating UI
        if (result.success) {
          setAutoBidStatus(action === 'start' ? 'running' : 'stopped')
          setAutoBidSettings(prev => ({ ...prev, enabled: action === 'start' }))
          
          // Save to cache
          const newStatus = action === 'start' ? 'running' : 'stopped'
          const newSettings = { ...autoBidSettings, enabled: action === 'start' }
          saveToCaches({
            autoBidStatus: newStatus,
            autoBidSettings: newSettings
          })
          
          toast.success(`Auto-bidder ${action === 'start' ? 'started' : 'stopped'} successfully`)
          
          // Reload settings to get updated data from database
          await loadAutoBidSettings()
        } else {
          throw new Error(result.message || 'Failed to toggle')
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to toggle')
      }
    } catch (error) {
      console.error('Toggle error:', error)
      toast.error(`Failed to ${autoBidStatus === 'running' ? 'stop' : 'start'} auto-bidder: ${error.message}`)
    }
  }

  const loadProfileData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/freelancer/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Profile data loaded successfully
        setProfileData(data)

        // Cache the freelancer profile data for navbar and settings
        saveToCaches({ profileData: data })

        // Notify navbar to update profile picture
        window.dispatchEvent(new CustomEvent('freelancerProfileUpdated'))
      }
    } catch (error) {
      logError('Failed to load profile data', error)
    }
  }

  const checkConnection = async () => {
    try {
      const response = await fetch(`${API_URL}/api/freelancer/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setConnectionStatus(data.connected ? 'connected' : 'disconnected')
        if (data.credentials) {
          setCredentials(data.credentials)
          
          // Save to cache
          saveToCaches({
            connectionStatus: data.connected ? 'connected' : 'disconnected',
            credentials: data.credentials
          })
          
          // Load profile data if connected
          if (data.connected) {
            loadProfileData()
          }
        }
      } else {
        setConnectionStatus('disconnected')
        saveToCaches({ connectionStatus: 'disconnected' })
      }
    } catch (error) {
      logError('Failed to check connection', error)
      setConnectionStatus('error')
    }
  }



  const disconnectFreelancer = async () => {
    if (!confirm('Are you sure you want to disconnect from Freelancer.com? This will remove all stored credentials.')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/freelancer/disconnect`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast.success('Disconnected from Freelancer.com')
        setConnectionStatus('disconnected')
        setCredentials(null)
        setProfileData(null)
        
        // Clear cache
        saveToCaches({
          connectionStatus: 'disconnected',
          credentials: null,
          profileData: null
        })
      } else {
        throw new Error('Failed to disconnect')
      }
    } catch (error) {
      logError('Failed to disconnect', error)
      toast.error('Failed to disconnect from Freelancer.com')
    }
  }

  const handleConnectToFreelancer = () => {
    toast.info('Please use the browser extension to connect to Freelancer.com')
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'disconnected':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      default:
        return <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected to Freelancer.com'
      case 'disconnected':
        return 'Not connected to Freelancer.com'
      case 'error':
        return 'Connection error'
      default:
        return 'Checking connection...'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Loading overlay */}
      {!isPageLoaded && (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
          </div>
        </div>
      )}

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
              onClick={disconnectFreelancer}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Disconnect
            </button>
          ) : (
            <button
              onClick={handleConnectToFreelancer}
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
              {profileData ? (
                (() => {
                  // Try CDN URLs first (they're more reliable), then fallback to relative paths
                  let avatarUrl = null;

                  if (profileData.avatar_large_cdn) {
                    avatarUrl = `https:${profileData.avatar_large_cdn}`;
                  } else if (profileData.avatar_cdn) {
                    avatarUrl = `https:${profileData.avatar_cdn}`;
                  } else if (profileData.avatar_xlarge_cdn) {
                    avatarUrl = `https:${profileData.avatar_xlarge_cdn}`;
                  } else if (profileData.avatar_large) {
                    avatarUrl = `https://www.freelancer.com${profileData.avatar_large}`;
                  } else if (profileData.avatar) {
                    avatarUrl = `https://www.freelancer.com${profileData.avatar}`;
                  } else if (profileData.avatar_xlarge) {
                    avatarUrl = `https://www.freelancer.com${profileData.avatar_xlarge}`;
                  }

                  // Using avatar URL: avatarUrl

                  return avatarUrl ? (
                    <div className="relative">
                      <img
                        src={avatarUrl}
                        alt={`${profileData.username || profileData.display_name}'s profile`}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                      <div
                        className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg absolute top-0 left-0"
                        style={{ display: 'none' }}
                      >
                        {(profileData.username || profileData.display_name || profileData.first_name || 'U').charAt(0).toUpperCase()}
                      </div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                      {(profileData.username || profileData.display_name || profileData.first_name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )
                })()
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                </div>
              )}
              <div
                className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
                style={{ display: 'none' }}
              >
                <User className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Username</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {profileData?.username || credentials.username || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">User ID</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {profileData?.id || credentials.user_id || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Display Name</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {profileData?.display_name || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Email</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {profileData?.email || credentials.validated_email || 'N/A'}
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
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {credentials.access_token ? 'OAuth Token' : 'Session Cookies'}
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
          {/* Left */}
          <div className="space-y-4 mr-4">
            
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Daily Bids Limit</label>
              <input
                type="number"
                min="1"
                max="100"
                value={autoBidSettings.daily_bids}
                onChange={(e) => setAutoBidSettings({ ...autoBidSettings, daily_bids: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum number of bids to place per day</p>
            </div>
            

            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                Proposal Type
              </label>
              <select
                value={autoBidSettings.proposal_type || 1}
                onChange={(e) => setAutoBidSettings({ ...autoBidSettings, proposal_type: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={1}>Proposal 1</option>
                <option value={2}>Proposal 2</option>
                <option value={3}>Proposal 3</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Select which proposal template to use for auto-bidding</p>
            </div>

            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                Min Skill Match
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={autoBidSettings.min_skill_match}
                onChange={(e) => setAutoBidSettings({ ...autoBidSettings, min_skill_match: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum number of your skills that must match project requirements</p>
            </div>

            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                Max Competition (Existing Bids)
              </label>
              <input
                type="number"
                value={autoBidSettings.max_project_bids}
                onChange={(e) => setAutoBidSettings({ ...autoBidSettings, max_project_bids: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Skip projects that already have more than this many bids</p>
            </div>

          </div>

          {/* right */}
          <div className="space-y-4 ml-4">
            
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                Check Frequency (Minutes)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="60"
                  value={autoBidSettings.frequency_minutes}
                  onChange={(e) => setAutoBidSettings({ ...autoBidSettings, frequency_minutes: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12 text-center text-gray-900 dark:text-gray-200">
                  {autoBidSettings.frequency_minutes}m
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">How often to check for new projects (1-60 mins)</p>
            </div>

            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Supported Currencies</label>
              <div className="space-y-2">
                {['USD', 'GBP', 'EUR', 'INR', 'ZAR', 'AED'].map((currency) => (
                  <label key={currency} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoBidSettings.currencies.includes(currency)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAutoBidSettings({
                            ...autoBidSettings,
                            currencies: [...autoBidSettings.currencies, currency]
                          })
                        } else {
                          setAutoBidSettings({
                            ...autoBidSettings,
                            currencies: autoBidSettings.currencies.filter(c => c !== currency)
                          })
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{currency}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Select currencies you want to bid on</p>
            </div>

            
            <div className="pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoBidSettings.smart_bidding}
                  onChange={(e) => setAutoBidSettings({ ...autoBidSettings, smart_bidding: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Enable Smart Bidding (Avg Price)</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Automatically bids the average of Min/Max budget
              </p>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoBidSettings.commission_projects}
                  onChange={(e) => setAutoBidSettings({ ...autoBidSettings, commission_projects: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Commission Projects</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Include commission-based projects in auto-bidding
              </p>
            </div>
          </div>

        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={saveAutoBidSettings}
            disabled={isSavingSettings}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70"
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
                Select skills to filter projects that match your expertise
              </p>
            </div>
          </div>
        </div>

        {isLoadingSkills ? (
          <div className="text-center py-8">
            <img
              src={gif}
              alt="AK BPO AI Logo"
              className="h-12 object-contain mx-auto mb-4"
            />
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
                  onClick={selectAllSkills}
                  disabled={selectedSkills.length === availableSkills.length || availableSkills.length === 0}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAllSkills}
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
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {skill}
                  </span>
                </label>
              ))}
            </div>

            {availableSkills.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">
                  No skills available. Connect to Freelancer.com to load skills.
                </p>
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

export default FreelancerSettings