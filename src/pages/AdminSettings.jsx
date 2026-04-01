import { useState, useEffect } from 'react'
import { Save, Globe, Hash } from 'lucide-react'
import toast from 'react-hot-toast'
import { logDebug, logError } from '../utils/logger'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const AdminSettings = () => {
  const [settings, setSettings] = useState(() => {
    // Load from cache immediately
    const cached = sessionStorage.getItem('adminSettings')
    if (cached) {
      try {
        return JSON.parse(cached)
      } catch (e) {
        return {
          default_upwork_limit: 5,
          default_freelancer_limit: 5,
          default_freelancer_plus_limit: 3,
          default_upwork_max_jobs: 3,
          default_freelancer_max_jobs: 3
        }
      }
    }
    return {
      default_upwork_limit: 5,
      default_freelancer_limit: 5,
      default_freelancer_plus_limit: 3,
      default_upwork_max_jobs: 3,
      default_freelancer_max_jobs: 3
    }
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/admin/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        // Cache the data
        sessionStorage.setItem('adminSettings', JSON.stringify(data))
      }
    } catch (error) {
      logError('Failed to load admin settings', error)
      toast.error('Load On server Plz try again Later')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        const data = await response.json()
        // Update cache with new settings
        sessionStorage.setItem('adminSettings', JSON.stringify(settings))
        toast.success('Settings saved successfully')
        logDebug('Admin settings saved', data)
      } else {
        const errorData = await response.json()
        toast.error(errorData.detail || 'Failed to save settings')
      }
    } catch (error) {
      logError('Failed to save admin settings', error)
      toast.error('Load On server Plz try again Later')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8  min-h-full">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8  min-h-full">


      <div className="max-w-3xl space-y-6">
        {/* Daily Limits */}
        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f0e9d2' }}>
              <Globe className="w-5 h-5" style={{ color: '#b59d32' }} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-400">Default Daily Limits</h2>
              <p className="text-sm text-gray-600 dark:text-gray-500">Set default fetch limits for new users</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-400">
                Upwork Daily Limit
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.default_upwork_limit}
                onChange={(e) => setSettings({ ...settings, default_upwork_limit: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                style={{ outlineColor: '#b59d32' }}
              />
              <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                Current: {settings.default_upwork_limit} fetches per day
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-400">
                Freelancer Daily Limit
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.default_freelancer_limit}
                onChange={(e) => setSettings({ ...settings, default_freelancer_limit: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                style={{ outlineColor: '#b59d32' }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Current: {settings.default_freelancer_limit} fetches per day
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-400">
                Freelancer Plus Daily Limit
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.default_freelancer_plus_limit}
                onChange={(e) => setSettings({ ...settings, default_freelancer_plus_limit: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                style={{ outlineColor: '#b59d32' }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Current: {settings.default_freelancer_plus_limit} fetches per day
              </p>
            </div>
          </div>
        </div>

        {/* Maximum Jobs Per Fetch */}
        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Hash className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-400">Maximum Jobs Per Fetch</h2>
              <p className="text-sm text-gray-600 dark:text-gray-500">Set default max jobs to fetch per request</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-400">
                Upwork Max Jobs
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={settings.default_upwork_max_jobs}
                onChange={(e) => setSettings({ ...settings, default_upwork_max_jobs: parseInt(e.target.value) || 3 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                style={{ outlineColor: '#b59d32' }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Current: {settings.default_upwork_max_jobs} jobs per fetch
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-400">
                Freelancer Max Jobs
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={settings.default_freelancer_max_jobs}
                onChange={(e) => setSettings({ ...settings, default_freelancer_max_jobs: parseInt(e.target.value) || 3 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                style={{ outlineColor: '#b59d32' }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Current: {settings.default_freelancer_max_jobs} jobs per fetch
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#b59d32' }}
            onMouseEnter={(e) => !saving && (e.currentTarget.style.backgroundColor = '#9a8429')}
            onMouseLeave={(e) => !saving && (e.currentTarget.style.backgroundColor = '#b59d32')}
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminSettings
