import { RefreshCw, Bell, MoreVertical, Trash2, CheckCircle, AlertCircle, FileText, User, Settings, LogOut, Moon, Sun } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'
import ConfirmModal from '../modals/ConfirmModal'
import ProfileModal from '../modals/ProfileModal'
import { logDebug, logError, logWarn } from '../utils/logger'
import { useFetchLimits } from '../hooks/useFetchLimits'
import { debouncedApiCalls } from '../utils/apiUtils'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const Navbar = ({ onSyncComplete, pageTitle, pageDescription }) => {
  const [isSyncing, setIsSyncing] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isFetchingUpwork, setIsFetchingUpwork] = useState(false)
  const [isFetchingFreelancer, setIsFetchingFreelancer] = useState(false)
  const [isFetchingFreelancerPlus, setIsFetchingFreelancerPlus] = useState(false)
  const [isCleaning, setIsCleaning] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)

  // Use the optimized fetch limits hook
  const { limits, updateLimits } = useFetchLimits()
  
  // Extract limits for easier access
  const upworkRemaining = limits.upwork.remaining
  const freelancerRemaining = limits.freelancer.remaining
  const freelancerPlusRemaining = limits.freelancer_plus.remaining
  const upworkLimit = limits.upwork.limit
  const freelancerLimit = limits.freelancer.limit
  const freelancerPlusLimit = limits.freelancer_plus.limit

  const [notifications, setNotifications] = useState([])
  const dropdownRef = useRef(null)
  const notificationRef = useRef(null)
  const profileRef = useRef(null)

  // Get user info from localStorage and state
  const [userProfile, setUserProfile] = useState(() => {
    // Try to get from session storage first, then fallback to localStorage
    const cached = sessionStorage.getItem('userProfileData')
    if (cached) {
      try {
        const data = JSON.parse(cached)
        return {
          email: data.email || localStorage.getItem('userEmail') || 'user@example.com',
          name: data.name || '',
          role: data.role || 'user'
        }
      } catch (e) {
        // If parsing fails, fallback to localStorage
        return {
          email: localStorage.getItem('userEmail') || 'user@example.com',
          name: '',
          role: 'user'
        }
      }
    }
    // If no cached data, use localStorage or defaults
    return {
      email: localStorage.getItem('userEmail') || 'user@example.com',
      name: '',
      role: 'user'
    }
  })

  // Freelancer profile data state
  const [freelancerProfile, setFreelancerProfile] = useState(() => {
    const cached = localStorage.getItem('freelancerProfileData')
    if (cached) {
      try {
        return JSON.parse(cached)
      } catch (e) {
        return null
      }
    }
    return null
  })

  const userEmail = userProfile.email
  const userName = userProfile.name || userEmail.split('@')[0].charAt(0).toUpperCase() + userEmail.split('@')[0].slice(1)

  // Get freelancer avatar URL using the same logic as FreelancerSettings
  const getFreelancerAvatarUrl = () => {
    if (!freelancerProfile) return null
    
    // Try CDN URLs first (they're more reliable), then fallback to relative paths
    let avatarUrl = null
    
    if (freelancerProfile.avatar_large_cdn) {
      avatarUrl = `https:${freelancerProfile.avatar_large_cdn}`
    } else if (freelancerProfile.avatar_cdn) {
      avatarUrl = `https:${freelancerProfile.avatar_cdn}`
    } else if (freelancerProfile.avatar_xlarge_cdn) {
      avatarUrl = `https:${freelancerProfile.avatar_xlarge_cdn}`
    } else if (freelancerProfile.avatar_large) {
      avatarUrl = `https://www.freelancer.com${freelancerProfile.avatar_large}`
    } else if (freelancerProfile.avatar) {
      avatarUrl = `https://www.freelancer.com${freelancerProfile.avatar}`
    } else if (freelancerProfile.avatar_xlarge) {
      avatarUrl = `https://www.freelancer.com${freelancerProfile.avatar_xlarge}`
    }
    
    return avatarUrl
  }

  const freelancerAvatarUrl = getFreelancerAvatarUrl()
  const displayName = freelancerProfile?.display_name || freelancerProfile?.username || userProfile.name || userName

  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark'
  })

  // Apply theme on mount and when it changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light')
  }

  // Fetch limits are now handled by the useFetchLimits hook - no more excessive polling!

  // Load freelancer profile data
  const loadFreelancerProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/freelancer/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setFreelancerProfile(data)
        // Cache the freelancer profile data
        localStorage.setItem('freelancerProfileData', JSON.stringify(data))
      }
    } catch (error) {
      // Silently fail - user might not have Freelancer connected
      logDebug('Freelancer profile not available', error)
    }
  }

  // Load user profile and notifications on mount
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return
        
        // Direct API call without debouncing for immediate profile load
        const response = await fetch(`${API_URL}/api/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.ok) {
          const data = await response.json()
          setUserProfile({
            email: data.email || userProfile.email,
            name: data.name || '',
            role: data.role || 'user'
          })
          // Cache the profile data
          sessionStorage.setItem('userProfileData', JSON.stringify(data))
        }
      } catch (error) {
        logError('Failed to load user profile', error)
      }
    }

    const loadNotifications = async () => {
      try {
        const data = await debouncedApiCalls.fetchNotifications()
        if (data) {
          setNotifications(data.notifications || [])
        }
      } catch (error) {
        logError('Failed to load notifications', error)
      }
    }

    // Always load user profile on mount
    loadUserProfile()
    loadFreelancerProfile()

    // Only load notifications if user is authenticated
    const token = localStorage.getItem('token')
    if (token) {
      loadNotifications()

      // REMOVED: Notification polling - now only loads on mount and user actions
      // This prevents excessive API calls
    }

    // Listen for freelancer profile updates
    const handleFreelancerProfileUpdate = () => {
      loadFreelancerProfile()
    }

    // Listen for profile updates from Settings page
    const handleProfileUpdate = () => {
      loadUserProfile()
    }

    window.addEventListener('freelancerProfileUpdated', handleFreelancerProfileUpdate)
    window.addEventListener('userProfileUpdated', handleProfileUpdate)

    return () => {
      window.removeEventListener('freelancerProfileUpdated', handleFreelancerProfileUpdate)
      window.removeEventListener('userProfileUpdated', handleProfileUpdate)
    }
  }, [])

  // REMOVED: Excessive polling - fetch limits only updated when user performs actions
  // This was causing hundreds of unnecessary API calls

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/notifications/mark-all-read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setNotifications(notifications.map(n => ({ ...n, read: true })))
        toast.success('All notifications marked as read')
      }
    } catch (error) {
      logError('Failed to mark notifications as read', error)
      toast.error('Load On server Plz try again Later')
    }
  }

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Just now'

    try {
      const now = new Date()
      const created = new Date(timestamp)
      const diffMs = now - created
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins} min ago`
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
      if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
      return created.toLocaleDateString()
    } catch (error) {
      return 'Just now'
    }
  }

  const getIconForType = (type) => {
    switch (type) {
      case 'success':
        return CheckCircle
      case 'warning':
        return AlertCircle
      case 'info':
        return FileText
      default:
        return FileText
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return 'text-green-600 bg-green-50'
      case 'warning':
        return 'text-orange-600 bg-orange-50'
      case 'info':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)

    try {
      // Show loading message
      toast.loading('Refreshing page...')
      
      // Reload the entire page
      window.location.reload()
      
    } catch (error) {
      logError('Refresh failed', error)
      toast.error('Failed to refresh page')
      setIsSyncing(false)
    }
  }

  const handleFetchUpwork = async () => {
    setIsFetchingUpwork(true)
    setIsDropdownOpen(false)

    const loadingToast = toast.loading('Fetching Upwork Jobs...')

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      // Trigger the webhook via backend proxy
      const response = await fetch(`${API_URL}/api/fetch-upwork`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          toast.error(data.detail || 'Daily limit reached', { id: loadingToast })
          setUpworkRemaining(0)
          localStorage.setItem('upworkRemaining', '0')
          return
        }
        throw new Error(data.detail || 'Failed to fetch Upwork jobs')
      }

      logDebug('Upwork webhook response', data)

      // Update remaining count using the optimized hook
      if (data.remaining !== undefined) {
        updateLimits('upwork', data.remaining, data.daily_limit)
      }

      toast.success(`Upwork jobs fetched successfully!`, { id: loadingToast })

      // Notify parent component to refresh leads
      if (onSyncComplete) {
        onSyncComplete()
      }

      // Dispatch event to refresh dashboard
      window.dispatchEvent(new CustomEvent('dashboardRefresh'))
    } catch (error) {
      logError('Upwork fetch failed', error)
      toast.error('Load On server Plz try again Later', { id: loadingToast })
    } finally {
      setIsFetchingUpwork(false)
    }
  }

  const handleFetchFreelancer = async () => {
    setIsFetchingFreelancer(true)
    setIsDropdownOpen(false)

    const loadingToast = toast.loading('Fetching Freelancer Jobs...')

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      // Trigger the webhook via backend proxy
      const response = await fetch(`${API_URL}/api/fetch-freelancer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          toast.error(data.detail || 'Daily limit reached', { id: loadingToast })
          setFreelancerRemaining(0)
          localStorage.setItem('freelancerRemaining', '0')
          return
        }
        throw new Error(data.detail || 'Failed to fetch Freelancer jobs')
      }

      logDebug('Freelancer webhook response', data)

      // Update remaining count using the optimized hook
      if (data.remaining !== undefined) {
        updateLimits('freelancer', data.remaining, data.daily_limit)
      }

      toast.success(`Freelancer jobs fetched successfully!`, { id: loadingToast })

      // Notify parent component to refresh leads
      if (onSyncComplete) {
        onSyncComplete()
      }

      // Dispatch event to refresh dashboard
      window.dispatchEvent(new CustomEvent('dashboardRefresh'))
    } catch (error) {
      logError('Freelancer fetch failed', error)
      toast.error('Load On server Plz try again Later', { id: loadingToast })
    } finally {
      setIsFetchingFreelancer(false)
    }
  }

  const handleFetchFreelancerPlus = async () => {
    setIsFetchingFreelancerPlus(true)
    setIsDropdownOpen(false)

    const loadingToast = toast.loading('Fetching Freelancer Plus jobs from n8n...')

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      // Trigger the webhook via backend proxy
      const response = await fetch(`${API_URL}/api/fetch-freelancer-plus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle rate limit error
        if (response.status === 429) {
          toast.error(data.detail || 'Daily limit reached', { id: loadingToast })
          setFreelancerPlusRemaining(0)
          localStorage.setItem('freelancerPlusRemaining', '0')
          return
        }
        throw new Error(data.detail || 'Failed to fetch Freelancer Plus jobs')
      }

      logDebug('Freelancer Plus webhook response', data)

      // Update remaining count using the optimized hook
      if (data.remaining !== undefined) {
        updateLimits('freelancer_plus', data.remaining, data.daily_limit)
        logDebug(`[Freelancer Plus] Remaining fetches today: ${data.remaining}`)
      }

      toast.success(`Freelancer Plus jobs fetched successfully!`, { id: loadingToast })

      // Notify parent component to refresh leads
      if (onSyncComplete) {
        onSyncComplete()
      }

      // Dispatch event to refresh dashboard
      window.dispatchEvent(new CustomEvent('dashboardRefresh'))
    } catch (error) {
      logError('Freelancer Plus fetch failed', error)
      toast.error('Load On server Plz try again Later', { id: loadingToast })
    } finally {
      setIsFetchingFreelancerPlus(false)
    }
  }

  const handleCleanJobsClick = () => {
    setIsDropdownOpen(false)
    setShowConfirmModal(true)
  }

  const handleCleanJobs = async () => {
    setIsCleaning(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/leads/clean`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to clean jobs')
      }

      const data = await response.json()
      logDebug('Clean jobs response', data)
      toast.success(`Hidden ${data.count} of your leads successfully!`)

      // Notify parent component to refresh leads
      if (onSyncComplete) {
        onSyncComplete()
      }

      // Dispatch event to refresh dashboard
      window.dispatchEvent(new CustomEvent('dashboardRefresh'))
    } catch (error) {
      logError('Clean jobs failed', error)
      toast.error('Load On server Plz try again Later')
    } finally {
      setIsCleaning(false)
    }
  }



  return (
    <div className="bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        {/* Page Title - Left Side */}
        <div className="flex-1 min-w-0 pl-14 lg:pl-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-300 truncate">{pageTitle || 'Dashboard'}</h1>
          {pageDescription && (
            <p className="hidden lg:block text-gray-600 dark:text-gray-400 text-xs sm:text-sm mt-0.5 truncate">{pageDescription}</p>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={isFetchingUpwork || isFetchingFreelancer || isFetchingFreelancerPlus || isCleaning}
              className="border border-gray-200 dark:border-gray-700 w-10 h-10 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MoreVertical size={18} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="py-2">
                  <button
                    onClick={handleFetchUpwork}
                    disabled={isFetchingUpwork || isFetchingFreelancer || isFetchingFreelancerPlus || isCleaning}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-900 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      {isFetchingUpwork ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.561 13.158c-1.102 0-2.135-.467-3.074-1.227l.228-1.076.008-.042c.207-1.143.849-3.06 2.839-3.06 1.492 0 2.703 1.212 2.703 2.703 0 1.492-1.212 2.702-2.704 2.702zm0-8.14c-2.539 0-4.51 1.649-5.31 4.366-1.22-1.834-2.148-4.036-2.687-5.892H7.828v7.112c-.002 1.406-1.141 2.546-2.547 2.548-1.405-.002-2.543-1.143-2.545-2.548V3.492H0v7.112c0 2.914 2.37 5.303 5.281 5.303 2.913 0 5.283-2.389 5.283-5.303v-1.19c.529 1.107 1.182 2.229 1.974 3.221l-1.673 7.873h2.797l1.213-5.71c1.063.679 2.285 1.109 3.686 1.109 3 0 5.439-2.452 5.439-5.45 0-3-2.439-5.439-5.439-5.439z" />
                        </svg>
                      )}
                      <span>{isFetchingUpwork ? 'Fetching Upwork...' : 'Fetch Upwork'}</span>
                    </div>
                  </button>
                  <button
                    onClick={handleFetchFreelancer}
                    disabled={isFetchingUpwork || isFetchingFreelancer || isFetchingFreelancerPlus || isCleaning}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-900 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      {isFetchingFreelancer ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14.096 3.076l1.634 2.292L24 3.076M5.503 20.924l4.474-4.374-2.692-2.89m6.133-10.584L11.027 5.23l4.022.15M4.124 3.077l .857 1.76 4.734.294m-3.058 7.072l3.497-6.522L0 5.13" />
                        </svg>
                      )}
                      <span>{isFetchingFreelancer ? 'Fetching Freelancer...' : 'Fetch Freelancer'}</span>
                    </div>
                  </button>
                  <button
                    onClick={handleFetchFreelancerPlus}
                    disabled={isFetchingUpwork || isFetchingFreelancer || isFetchingFreelancerPlus || isCleaning}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-900 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      {isFetchingFreelancerPlus ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14.096 3.076l1.634 2.292L24 3.076M5.503 20.924l4.474-4.374-2.692-2.89m6.133-10.584L11.027 5.23l4.022.15M4.124 3.077l.857 1.76 4.734.294m-3.058 7.072l3.497-6.522L0 5.13" />
                        </svg>
                      )}
                      <span className="font-semibold">
                        {isFetchingFreelancerPlus ? 'Fetching Freelancer Plus...' : 'Fetch Freelancer Plus'}
                      </span>
                    </div>
                  </button>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-700 my-2"></div>

                <button
                  onClick={handleCleanJobsClick}
                  disabled={isFetchingUpwork || isFetchingFreelancer || isFetchingFreelancerPlus || isCleaning}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white flex items-center gap-3"
                >
                  <Trash2 size={16} />
                  <span>{isCleaning ? 'Clearing...' : 'Clear Jobs'}</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="border border-gray-200 dark:border-gray-700 flex items-center gap-2 px-3 sm:px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
            <span className="font-medium text-sm hidden sm:inline">{isSyncing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="w-10 h-10 bg-white dark:bg-[#1f1f1f] hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-300 relative transition-colors"
            >
              <Bell size={18} />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-semibold">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>

            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 max-h-[500px] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-300">Notifications</h3>
                  {notifications.filter(n => !n.read).length > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notification) => {
                      const Icon = getIconForType(notification.type)
                      return (
                        <div
                          key={notification.id}
                          className={`px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${!notification.read ? 'bg-purple-50/30 dark:bg-purple-900/10' : ''
                            }`}
                        >
                          <div className="flex gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                              <Icon size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-300 truncate">
                                  {notification.title}
                                </h4>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-purple-600 rounded-full flex-shrink-0 mt-1"></div>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-1">
                                {notification.message}
                              </p>
                              <span className="text-xs text-gray-500 dark:text-gray-500">{getTimeAgo(notification.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1e1e1e]">
                  <button className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium w-full text-center">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow overflow-hidden border-2 border-gray-200 dark:border-gray-600"
              title={displayName}
            >
              {freelancerAvatarUrl ? (
                <div className="relative w-full h-full">
                  <img 
                    src={freelancerAvatarUrl} 
                    alt={`${displayName}'s profile`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                  <div 
                    className="w-full h-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center text-white font-semibold absolute top-0 left-0"
                    style={{ display: 'none' }}
                  >
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                </div>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center text-white font-semibold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="py-2">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false)
                      setShowProfileModal(true)
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-3"
                  >
                    <User size={16} className="text-gray-500 dark:text-gray-400" />
                    <span>View Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileOpen(false)
                      window.dispatchEvent(new CustomEvent('navigateToSettings', { detail: { tab: 'ai-agent' } }))
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-3"
                  >
                    <Settings size={16} className="text-gray-500 dark:text-gray-400" />
                    <span>Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      toggleTheme()
                      setIsProfileOpen(false)
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-3"
                  >
                    {theme === 'light' ? (
                      <>
                        <Moon size={16} className="text-gray-500 dark:text-gray-400" />
                        <span>Dark Mode</span>
                      </>
                    ) : (
                      <>
                        <Sun size={16} className="text-gray-500 dark:text-gray-400" />
                        <span>Light Mode</span>
                      </>
                    )}
                  </button>

                  <div className="border-t border-gray-100 dark:border-gray-700 my-2"></div>

                  <button
                    onClick={() => {
                      setIsProfileOpen(false)
                      localStorage.removeItem('token')
                      localStorage.removeItem('userEmail')
                      window.location.reload()
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleCleanJobs}
        title="Hide All Your Leads"
        message="Are you sure you want to hide all YOUR leads? Hidden leads will no longer appear in your leads list, but they will remain in the database. Other users' leads will not be affected."
        confirmText="Hide My Leads"
        cancelText="Cancel"
        isDangerous={true}
      />

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userProfile={userProfile}
        upworkRemaining={upworkRemaining}
        upworkLimit={upworkLimit}
        freelancerRemaining={freelancerRemaining}
        freelancerLimit={freelancerLimit}
        freelancerPlusRemaining={freelancerPlusRemaining}
        freelancerPlusLimit={freelancerPlusLimit}
        freelancerProfile={freelancerProfile}
        onEditProfile={() => {
          window.dispatchEvent(new CustomEvent('navigateToSettings', { detail: { tab: 'profile' } }))
        }}
      />
    </div>
  )
}

export default Navbar
