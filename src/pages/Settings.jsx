import { useState, useEffect } from 'react'
import { Save, Loader2, RefreshCw, User, Bot, HelpCircle, X } from 'lucide-react'
import { Toaster } from 'react-hot-toast'
import { showSingleToast } from '../utils/toastUtils'
import { logError } from '../utils/logger'
import gif from '../assets/gif.gif'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const UPWORK_CATEGORIES = [
  "Accounting & Bookkeeping",
  "Financial Planning",
  "Management Consulting & Analysis",
  "Personal & Professional Coaching",
  "Recruiting & Human Resources",
  "Other - Accounting & Consulting",
  "All - Accounting & Consulting",
  "Data Entry & Transcription Services",
  "Market Research & Product Reviews",
  "Project Management (Admin)",
  "Virtual Assistance",
  "All - Admin Support",
  "Community Management & Tagging",
  "Customer Service & Tech Support",
  "All - Customer Service",
  "AI & Machine Learning",
  "Data Analysis & Testing",
  "Data Extraction/ETL",
  "Data Mining & Management",
  "All - Data Science & Analytics",
  "Art & Illustration",
  "Audio & Music Production",
  "Branding & Logo Design",
  "Graphic, Editorial & Presentation Design",
  "NFT, AR/VR & Game Art",
  "Performing Arts",
  "Photography",
  "Product Design (Creative)",
  "Video & Animation",
  "All - Design & Creative",
  "3D Modeling & CAD",
  "Building & Landscape Architecture",
  "Chemical Engineering",
  "Civil & Structural Engineering",
  "Contract Manufacturing",
  "Electrical & Electronic Engineering",
  "Energy & Mechanical Engineering",
  "Interior & Trade Show Design",
  "Physical Sciences",
  "All - Engineering & Architecture",
  "Database Management & Administration",
  "DevOps & Solution Architecture",
  "ERP/CRM Software",
  "Information Security & Compliance",
  "Network & System Administration",
  "All - IT & Networking",
  "Corporate & Contract Law",
  "Finance & Tax Law",
  "International & Immigration Law",
  "Public Law",
  "All - Legal",
  "Digital Marketing",
  "Lead Generation & Telemarketing",
  "Marketing, PR & Brand Strategy",
  "All - Sales & Marketing",
  "Language Tutoring & Interpretation",
  "Translation & Localization Services",
  "All - Translation",
  "AI Apps & Integration",
  "Blockchain, NFT & Cryptocurrency",
  "Desktop Application Development",
  "Ecommerce Development",
  "Game Design & Development",
  "Mobile Development",
  "Product Management & Scrum",
  "QA Testing",
  "Scripts & Utilities",
  "Web & Mobile Design",
  "Web Development",
  "Other - Software Development",
  "All - Web, Mobile & Software Dev",
  "Content Writing",
  "Editing & Proofreading Services",
  "Professional & Business Writing",
  "Sales & Marketing Copywriting",
  "All - Writing"
]

const Settings = () => {
  const [loading, setLoading] = useState(() => {
    const cached = sessionStorage.getItem('settingsData')
    return !cached
  })
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [showTelegramModal, setShowTelegramModal] = useState(false)
  
  const [userProfile, setUserProfile] = useState(() => {
    const cached = sessionStorage.getItem('userProfileData')
    if (cached) {
      const data = JSON.parse(cached)
      return {
        name: data.name || '',
        email: data.email || '',
        telegram_chat_id: data.telegram_chat_id || '',
        country: data.country || ''
      }
    }
    return {
      name: '',
      email: '',
      telegram_chat_id: '',
      country: ''
    }
  })
  
  const [aiAgentSettings, setAiAgentSettings] = useState(() => {
    const cached = sessionStorage.getItem('settingsData')
    if (cached) {
      const data = JSON.parse(cached)
      return {
        minScore: data.ai_agent_min_score || 2,
        maxScore: data.ai_agent_max_score || 8,
        model: data.ai_agent_model || 'gpt-4',
        maxBidsFreelancer: data.ai_agent_max_bids_freelancer || 30,
        maxConnectsUpwork: data.ai_agent_max_connects_upwork || 20
      }
    }
    return {
      minScore: 2,
      maxScore: 8,
      model: 'gpt-4',
      maxBidsFreelancer: 30,
      maxConnectsUpwork: 20
    }
  })

  const [upworkSettings, setUpworkSettings] = useState(() => {
    const cached = sessionStorage.getItem('settingsData')
    if (cached) {
      const data = JSON.parse(cached)
      return {
        jobCategories: data.upwork_job_categories || ['Web Development'],
        maxJobs: data.upwork_max_jobs || 3,
        paymentVerified: data.upwork_payment_verified || false
      }
    }
    return {
      jobCategories: ['Web Development'],
      maxJobs: 3,
      paymentVerified: false
    }
  })

  const [freelancerSettings, setFreelancerSettings] = useState(() => {
    const cached = sessionStorage.getItem('settingsData')
    if (cached) {
      const data = JSON.parse(cached)
      return {
        jobCategory: data.freelancer_job_category || 'Web Development',
        maxJobs: data.freelancer_max_jobs || 3
      }
    }
    return {
      jobCategory: 'Web Development',
      maxJobs: 3
    }
  })

  useEffect(() => {
    fetchSettings()
    fetchProfile()
    
    // Listen for navigation events from Navbar
    const handleNavigateToSettings = (event) => {
      const tab = event.detail?.tab
      if (tab) {
        setActiveTab(tab)
      }
    }
    
    window.addEventListener('navigateToSettings', handleNavigateToSettings)
    
    return () => {
      window.removeEventListener('navigateToSettings', handleNavigateToSettings)
    }
  }, [])

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const profileData = {
          name: data.name || '',
          email: data.email || '',
          telegram_chat_id: data.telegram_chat_id || '',
          country: data.country || ''
        }
        setUserProfile(profileData)
        // Cache the profile data
        sessionStorage.setItem('userProfileData', JSON.stringify(data))
      }
    } catch (error) {
      logError('Failed to fetch profile', error)
      showSingleToast.error('Load On server Plz try again Later')
    }
  }

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        sessionStorage.setItem('settingsData', JSON.stringify(data))
        
        setUpworkSettings({
          jobCategories: data.upwork_job_categories || ['Web Development'],
          maxJobs: data.upwork_max_jobs || 3,
          paymentVerified: data.upwork_payment_verified || false
        })
        setFreelancerSettings({
          jobCategory: data.freelancer_job_category || 'Web Development',
          maxJobs: data.freelancer_max_jobs || 3
        })
        setAiAgentSettings({
          minScore: data.ai_agent_min_score || 2,
          maxScore: data.ai_agent_max_score || 8,
          model: data.ai_agent_model || 'gpt-4',
          maxBidsFreelancer: data.ai_agent_max_bids_freelancer || 30,
          maxConnectsUpwork: data.ai_agent_max_connects_upwork || 20
        })
      }
    } catch (error) {
      logError('Failed to fetch settings', error)
      showSingleToast.error('Load On server Plz try again Later')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)

    try {
      const token = localStorage.getItem('token')
      
      // Save platform settings
      const settingsResponse = await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          upwork_job_categories: upworkSettings.jobCategories,
          upwork_max_jobs: upworkSettings.maxJobs,
          upwork_payment_verified: upworkSettings.paymentVerified,
          freelancer_job_category: freelancerSettings.jobCategory,
          freelancer_max_jobs: freelancerSettings.maxJobs,
          ai_agent_min_score: aiAgentSettings.minScore,
          ai_agent_max_score: aiAgentSettings.maxScore,
          ai_agent_model: aiAgentSettings.model,
          ai_agent_max_bids_freelancer: aiAgentSettings.maxBidsFreelancer,
          ai_agent_max_connects_upwork: aiAgentSettings.maxConnectsUpwork
        })
      })

      // Save user profile if on profile tab
      if (activeTab === 'profile') {
        const profileResponse = await fetch(`${API_URL}/api/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: userProfile.name,
            telegram_chat_id: userProfile.telegram_chat_id,
            country: userProfile.country
          })
        })

        if (!profileResponse.ok) {
          showSingleToast.error('Load On server Plz try again Later')
          setSaving(false)
          return
        }

        // Update profile cache
        const profileData = await profileResponse.json()
        sessionStorage.setItem('userProfileData', JSON.stringify(profileData))
        
        // Notify other components that profile was updated
        window.dispatchEvent(new CustomEvent('userProfileUpdated'))
      }

      if (settingsResponse.ok) {
        const data = await settingsResponse.json()
        sessionStorage.setItem('settingsData', JSON.stringify(data))
        showSingleToast.success('Settings saved successfully!')
      } else {
        showSingleToast.error('Load On server Plz try again Later')
      }
    } catch (error) {
      logError('Failed to save settings', error)
      showSingleToast.error('Load On server Plz try again Later')
    } finally {
      setSaving(false)
    }
  }

  const toggleUpworkCategory = (category) => {
    setUpworkSettings(prev => ({
      ...prev,
      jobCategories: prev.jobCategories.includes(category)
        ? prev.jobCategories.filter(c => c !== category)
        : [...prev.jobCategories, category]
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full ">
        <img
              src={gif}
              alt="AK BPO AI Logo"
              className="h-12 object-contain mx-auto mb-4"
            />
      </div>
      
    )
  }

  return (
    <div className=" min-h-full">
      <Toaster position="top-center" />
      {/* Telegram Help Modal */}
      {showTelegramModal && (
        <div 
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
          onClick={() => setShowTelegramModal(false)}
        >
          <div 
            className="bg-white dark:bg-[#1e1e1e] rounded-2xl max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">How to Get Telegram Chat ID</h2>
                </div>
                <button
                  onClick={() => setShowTelegramModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Instructions */}
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Follow these steps:</h3>
                  <ol className="space-y-3 text-sm text-gray-700">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                      <span>Open Telegram app on your device</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                      <span>Search for <code className="bg-white dark:bg-[#212121] px-2 py-0.5 rounded border border-blue-300 font-mono text-blue-700">@userinfobot</code></span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                      <span>Send any message to the bot (e.g., "Hi" or "/start")</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                      <span>The bot will reply with your ID, name, and language</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
                      <span>Copy the <strong>ID number</strong> and paste it here</span>
                    </li>
                  </ol>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Your Chat ID is usually a number like <code className="bg-white dark:bg-[#212121] px-2 py-0.5 rounded border border-yellow-300 font-mono">123456789</code>
                  </p>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => setShowTelegramModal(false)}
                  className="w-full text-white px-4 py-3 rounded-lg transition-colors font-medium"
              style={{ backgroundColor: '#b59d32' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#9a8429'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#b59d32'}
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">

      {/* Tabs */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'border-b-2 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              style={activeTab === 'profile' ? { borderBottomColor: '#b59d32', backgroundColor: '#f0e9d2', color: '#b59d32' } : {}}
            >
              <div className="flex items-center justify-center gap-2">
                <User size={18} />
                User Profile
              </div>
            </button>
            <button
              onClick={() => setActiveTab('upwork')}
              className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'upwork'
                  ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.561 13.158c-1.102 0-2.135-.467-3.074-1.227l.228-1.076.008-.042c.207-1.143.849-3.06 2.839-3.06 1.492 0 2.703 1.212 2.703 2.703 0 1.492-1.212 2.702-2.704 2.702zm0-8.14c-2.539 0-4.51 1.649-5.31 4.366-1.22-1.834-2.148-4.036-2.687-5.892H7.828v7.112c-.002 1.406-1.141 2.546-2.547 2.548-1.405-.002-2.543-1.143-2.545-2.548V3.492H0v7.112c0 2.914 2.37 5.303 5.281 5.303 2.913 0 5.283-2.389 5.283-5.303v-1.19c.529 1.107 1.182 2.229 1.974 3.221l-1.673 7.873h2.797l1.213-5.71c1.063.679 2.285 1.109 3.686 1.109 3 0 5.439-2.452 5.439-5.45 0-3-2.439-5.439-5.439-5.439z"/>
                </svg>
                Upwork
              </div>
            </button>
            <button
              onClick={() => setActiveTab('freelancer')}
              className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'freelancer'
                  ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.096 3.076l1.634 2.292L24 3.076M5.503 20.924l4.474-4.374-2.692-2.89m6.133-10.584L11.027 5.23l4.022.15M4.124 3.077l.857 1.76 4.734.294m-3.058 7.072l3.497-6.522L0 5.13"/>
                </svg>
                Freelancer
              </div>
            </button>
            <button
              onClick={() => setActiveTab('ai-agent')}
              className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'ai-agent'
                  ? 'border-b-2 border-green-600 text-green-600 bg-green-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Bot size={18} />
                AI Agent
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6 sm:p-8">
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-300">User Profile</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage your personal information</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-gray-300 mb-3">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={userProfile.name}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent text-base"
                    style={{ outlineColor: '#b59d32' }}
                  />
                </div>

                {/* Email (Read-only) */}
                <div className="bg-gray-50 border dark:bg-[#1e1e1e] border-gray-200 rounded-xl p-5 shadow-sm">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-gray-300 mb-3 ">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={userProfile.email}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 text-base cursor-not-allowed dark:bg-[#1e1e1e]"
                  />
                  <p className="text-xs text-gray-500 mt-2">Email cannot be changed</p>
                </div>

                {/* Telegram Chat ID */}
                <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-gray-900 dark:text-gray-300">
                      Telegram Chat ID
                    </label>
                    <button
                      onClick={() => setShowTelegramModal(true)}
                      className="flex items-center gap-1 transition-colors"
                      style={{ color: '#b59d32' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#9a8429'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#b59d32'}
                      type="button"
                    >
                      <HelpCircle size={18} />
                      <span className="text-xs font-medium">How to get ID?</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={userProfile.telegram_chat_id}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, telegram_chat_id: e.target.value }))}
                    placeholder="Enter your Telegram chat ID"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent text-base"
                    style={{ outlineColor: '#b59d32' }}
                  />
                  <p className="text-xs text-gray-500 mt-2">💡 For receiving notifications via Telegram</p>
                </div>

                {/* Country */}
                <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-gray-300 mb-3">
                    Country
                  </label>
                  <input
                    type="text"
                    value={userProfile.country}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="Enter your country"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent text-base"
                    style={{ outlineColor: '#b59d32' }}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'upwork' && (
            <div className="space-y-6 animate-fadeIn dark:bg-[#1e1e1e]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-300">Upwork Configuration</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Select at least 2 job categories</p>
                </div>
              </div>

              {/* Job Categories */}
              <div className="dark:bg-[#212121] bg-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 ">
                <div className=" flex items-center justify-between mb-4">
                  <label className="text-base font-semibold text-gray-900 dark:text-gray-300">
                    Job Categories
                  </label>
                  <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full dark:text-gray-300">
                    {upworkSettings.jobCategories.length} selected
                  </span>
                </div>
                <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-h-80 overflow-y-auto shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 dark:text-gray-300">
                    {UPWORK_CATEGORIES.map((category) => (
                      <label
                        key={category}
                        className="flex items-center space-x-2 p-2.5 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors group dark:text-gray-300"
                      >
                        <input
                          type="checkbox"
                          checked={upworkSettings.jobCategories.includes(category)}
                          onChange={() => toggleUpworkCategory(category)}
                          className="w-4 h-4 border-gray-300 rounded"
                    style={{ accentColor: '#b59d32' }}
                        />
                        <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors dark:text-gray-300">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Payment Verified */}
              <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={upworkSettings.paymentVerified}
                    onChange={(e) => setUpworkSettings(prev => ({
                      ...prev,
                      paymentVerified: e.target.checked
                    }))}
                    className="w-5 h-5 border-gray-300 rounded mt-1"
                    style={{ accentColor: '#b59d32' }}
                  />
                  <div>
                    <span className="text-sm font-semibold text-gray-900 block mb-1 dark:text-gray-300">Payment Verified Clients</span>
                    <p className="text-xs text-gray-600">Only show jobs from clients with verified payment methods</p>
                  </div>
                </label>
              </div>


            </div>
          )}

          {activeTab === 'freelancer' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-300">Freelancer Configuration</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Configure your Freelancer.com preferences</p>
                </div>
              </div>

              {/* Job Category */}
              <div className="bg-blue-50 dark:bg-[#1e1e1e] rounded-xl p-6 border border-blue-100">
                <label className="block text-base font-semibold text-gray-900 mb-4 dark:text-gray-300">
                  Job Category
                </label>
                <input
                  type="text"
                  value={freelancerSettings.jobCategory}
                  onChange={(e) => setFreelancerSettings(prev => ({
                    ...prev,
                    jobCategory: e.target.value
                  }))}
                  placeholder="e.g., Web Development, Design, Writing"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base shadow-sm"
                />
                <p className="text-xs text-gray-600 mt-2 dark:text-gray-300">💡 Enter the main category you want to search for</p>
              </div>


            </div>
          )}

          {activeTab === 'ai-agent' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-300">AI Agent Configuration</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Configure AI proposal generation settings</p>
                </div>
              </div>

              {/* Score Range for Auto-Draft */}
              <div className="bg-gray-100 dark:bg-[#1e1e1e] rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-base font-semibold text-gray-900 mb-4 dark:text-gray-300">Score Range for Auto-Draft</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Only leads with scores between {aiAgentSettings.minScore} and {aiAgentSettings.maxScore} will be auto-drafted
                </p>
                
                {/* Minimum Score */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-gray-300 mb-3">
                    Minimum Score
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={aiAgentSettings.minScore}
                      onChange={(e) => {
                        const newMin = parseInt(e.target.value)
                        setAiAgentSettings(prev => ({
                          ...prev,
                          minScore: newMin,
                          // Ensure max is always >= min
                          maxScore: Math.max(newMin, prev.maxScore)
                        }))
                      }}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-2xl font-bold text-green-600 min-w-[3rem] text-center">
                      {aiAgentSettings.minScore}
                    </span>
                  </div>
                </div>

                {/* Maximum Score */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-gray-300 mb-3">
                    Maximum Score
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={aiAgentSettings.maxScore}
                      onChange={(e) => {
                        const newMax = parseInt(e.target.value)
                        setAiAgentSettings(prev => ({
                          ...prev,
                          maxScore: newMax,
                          // Ensure min is always <= max
                          minScore: Math.min(newMax, prev.minScore)
                        }))
                      }}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-2xl font-bold min-w-[3rem] text-center" style={{ color: '#b59d32' }}>
                      {aiAgentSettings.maxScore}
                    </span>
                  </div>
                </div>
              </div>

              {/* Max Bids for Freelancer Jobs */}
              <div className="bg-gray-100 dark:bg-[#1e1e1e] rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <label className="block text-base font-semibold text-gray-900 dark:text-gray-300 mb-4">
                  Max Bids (Freelancer Jobs)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={aiAgentSettings.maxBidsFreelancer}
                  onChange={(e) => {
                    const value = e.target.value
                    setAiAgentSettings(prev => ({
                      ...prev,
                      maxBidsFreelancer: value === '' ? '' : Math.max(1, Math.min(100, parseInt(value) || 30))
                    }))
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') {
                      setAiAgentSettings(prev => ({
                        ...prev,
                        maxBidsFreelancer: 30
                      }))
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg font-semibold bg-white dark:bg-[#212121] text-gray-900 dark:text-gray-300"
                />
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  💡 Only fetch jobs from Freelancer with bids ≤ this number (default: 30)
                </p>
              </div>

              {/* Max Connects for Upwork Jobs */}
              <div className="bg-gray-100 dark:bg-[#1e1e1e] rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <label className="block text-base font-semibold text-gray-900 dark:text-gray-300 mb-4">
                  Max Connects (Upwork Jobs)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={aiAgentSettings.maxConnectsUpwork}
                  onChange={(e) => {
                    const value = e.target.value
                    setAiAgentSettings(prev => ({
                      ...prev,
                      maxConnectsUpwork: value === '' ? '' : Math.max(1, Math.min(100, parseInt(value) || 20))
                    }))
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') {
                      setAiAgentSettings(prev => ({
                        ...prev,
                        maxConnectsUpwork: 20
                      }))
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold bg-white dark:bg-[#212121] text-gray-900 dark:text-gray-300"
                />
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  💡 Only fetch jobs from Upwork requiring ≤ this many connects (default: 20)
                </p>
              </div>

              {/* AI Model Selection */}
              <div className="bg-gray-100 dark:bg-[#1e1e1e] rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <label className="block text-base font-semibold text-gray-900 dark:text-gray-300 mb-4">
                  AI Model
                </label>
                <select
                  value={aiAgentSettings.model}
                  onChange={(e) => setAiAgentSettings(prev => ({
                    ...prev,
                    model: e.target.value
                  }))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent text-base bg-white dark:bg-[#212121] text-gray-900 dark:text-gray-300"
                  style={{ outlineColor: '#b59d32' }}
                >
                  <option value="gpt-4">GPT-5.1 (Most Accurate)</option>
                  <option value="gpt-4.1-mini">GPT-4.1 Mini (Budget)</option>
                  <option value="gemini-3">Gemeni 3</option>
                  <option value="claude-4.5-opus">Claude 4.5 Opus</option>
                  <option value="claude-4.5-sonnet">Claude 4.5 Sonnet</option>
                </select>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  💡 GPT-4 provides the best quality proposals but is slower and more expensive
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-gray-100 dark:bg-[#1e1e1e] rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <Bot className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-gray-300 mb-1">How AI Agent Works</h4>
                    <ul className="text-xs text-blue-800 dark:text-gray-400 space-y-1">
                      <li>• Analyzes incoming job leads automatically</li>
                      <li>• Scores leads based on relevance and quality (1-10)</li>
                      <li>• Only drafts proposals for leads with scores between {aiAgentSettings.minScore} and {aiAgentSettings.maxScore}</li>
                      <li>• Filters by max bids (Freelancer) and max connects (Upwork)</li>
                      <li>• Generates tailored proposals using your selected AI model</li>
                      <li>• Sends notifications for review and approval</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Save Button - Fixed at bottom of card */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 sm:px-8 py-4 bg-gray-50 dark:bg-[#1f1f1f]">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Changes will be applied immediately after saving
            </p>
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex items-center justify-center gap-2 px-6 py-2.5 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-md"
              style={{ backgroundColor: '#b59d32' }}
              onMouseEnter={(e) => !saving && (e.currentTarget.style.backgroundColor = '#9a8429')}
              onMouseLeave={(e) => !saving && (e.currentTarget.style.backgroundColor = '#b59d32')}
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

export default Settings
