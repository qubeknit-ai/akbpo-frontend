import { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import Leads from './pages/Leads'
import Dashboard from './pages/Dashboard'
import Proposals from './pages/Proposals'
import Talent from './pages/Talent'
import Settings from './pages/Settings'
import Analytics from './pages/Analytics'
import CRM from './pages/CRM'
import AdminDashboard from './pages/AdminDashboard'
import AdminUsers from './pages/AdminUsers'
import AdminSettings from './pages/AdminSettings'
import AdminAnalytics from './pages/AdminAnalytics'

import FreelancerProjects from './pages/freelancer/FreelancerProjects'
import FreelancerBids from './pages/freelancer/FreelancerBids'
import FreelancerMessages from './pages/freelancer/FreelancerMessages'
import AutoBidLogs from './pages/freelancer/AutoBidLogs'
import FreelancerSettings from './pages/freelancer/FreelancerSettings'
import Login from './pages/Login'
import Signup from './pages/Signup'

import MatrixRain from './components/MatrixRain'
import logo from './assets/logo.png'
import gif from './assets/gif.gif'
import { logError } from './utils/logger'
import freelancerSync from './utils/freelancerSync'


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Create a client for React Query with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    return localStorage.getItem('currentPage') || 'dashboard'
  })
  const [refreshLeads, setRefreshLeads] = useState(0)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState(() => {
    // Load from cache immediately
    const cached = sessionStorage.getItem('userRole')
    return cached || 'user'
  })

  useEffect(() => {
    verifyToken()
  }, [])

  // Auto-sync Freelancer credentials when user is authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // Check if we already have credentials before trying to sync
      const existingCredentials = freelancerSync.getStoredCredentials()
      if (!existingCredentials) {
        // Only auto-sync if we don't have any stored credentials
        console.log('🔄 No stored credentials found, attempting auto-sync...')
        freelancerSync.syncCredentials().then(result => {
          if (result.success) {
            console.log('✅ Auto-synced Freelancer credentials on app load')
          } else {
            console.log('ℹ️ No valid Freelancer credentials found for auto-sync')
          }
        }).catch(error => {
          console.warn('⚠️ Auto-sync failed:', error.message)
        })
      } else {
        console.log('ℹ️ Existing credentials found, skipping auto-sync')
      }
    }
  }, [isAuthenticated, isLoading])

  useEffect(() => {
    // Listen for navigation events from modals
    const handleNavigateToProposals = () => {
      setCurrentPage('proposals')
    }

    const handleNavigateToLeads = () => {
      setCurrentPage('leads')
    }

    const handleNavigateToSettings = () => {
      setCurrentPage('settings')
    }

    const handleNavigateToAdmin = () => {
      setCurrentPage('admin')
    }

    const handleNavigateToFreelancer = (event) => {
      setCurrentPage(event.detail)
    }

    window.addEventListener('navigateToProposals', handleNavigateToProposals)
    window.addEventListener('navigateToLeads', handleNavigateToLeads)
    window.addEventListener('navigateToSettings', handleNavigateToSettings)
    window.addEventListener('navigateToAdmin', handleNavigateToAdmin)
    window.addEventListener('navigateToFreelancer', handleNavigateToFreelancer)

    return () => {
      window.removeEventListener('navigateToProposals', handleNavigateToProposals)
      window.removeEventListener('navigateToLeads', handleNavigateToLeads)
      window.removeEventListener('navigateToSettings', handleNavigateToSettings)
      window.removeEventListener('navigateToAdmin', handleNavigateToAdmin)
      window.removeEventListener('navigateToFreelancer', handleNavigateToFreelancer)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('currentPage', currentPage)
  }, [currentPage])

  const verifyToken = async () => {
    const token = localStorage.getItem('token')

    if (!token) {
      setIsLoading(false)
      setIsAuthenticated(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setIsAuthenticated(true)

        // Load and cache user role
        const role = data.role || 'user'
        setUserRole(role)
        sessionStorage.setItem('userRole', role)
      } else if (response.status === 401) {
        // Only logout on 401 (unauthorized) - token is actually invalid
        localStorage.removeItem('token')
        localStorage.removeItem('rememberMe')
        sessionStorage.removeItem('userRole')
        setIsAuthenticated(false)
        // Silent logout - no toast message
      } else {
        // For other errors (500, 503, etc), keep the user logged in
        // They might just be temporary server issues
        setIsAuthenticated(true)
        logError('Token verification failed with status', response.status)
      }
    } catch (error) {
      // Network errors - keep user logged in, it's likely a temporary issue
      logError('Token verification network error', error)
      setIsAuthenticated(true)
      // Don't show error toast on refresh - it's annoying
    } finally {
      setIsLoading(false)
    }
  }

  const handleSyncComplete = () => {
    setRefreshLeads(prev => prev + 1)
  }

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
  }

  const handleSignupSuccess = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('rememberMe')
    localStorage.removeItem('currentPage')
    sessionStorage.removeItem('userRole')
    sessionStorage.removeItem('userProfileData')
    setIsAuthenticated(false)
    setUserRole('user')
    setCurrentPage('dashboard')
  }

  const getPageInfo = () => {
    switch (currentPage) {
      case 'dashboard':
        return { title: 'Dashboard', description: 'Overview of your lead management' }
      case 'leads':
        return { title: 'Leads', description: 'Manage incoming job opportunities' }
      case 'proposals':
        return { title: 'Edit Proposal', description: 'Review and edit your AI-generated proposal' }
      case 'talent':
        return { title: 'Talent', description: 'Search and review freelancers from your n8n talent feed' }
      case 'analytics':
        return { title: 'Analytics', description: 'Comprehensive insights into your lead management performance' }
      case 'crm':
        return { title: 'CRM', description: 'Manage closed deals and track revenue' }
      case 'settings':
        return { title: 'Settings', description: 'Configure your job scraping preferences' }
      case 'admin-dashboard':
        return { title: 'Admin', description: 'System-wide statistics and metrics' }
      case 'admin-users':
        return { title: 'Admin', description: 'Manage users, roles, and stats' }
      case 'admin-settings':
        return { title: 'Admin', description: 'Configure global system settings' }
      case 'admin-analytics':
        return { title: 'Admin', description: 'System performance and usage insights' }

      case 'freelancer-projects':
        return { title: 'Available Projects', description: '' }
      case 'freelancer-bids':
        return { title: 'My Bids', description: '' }
      case 'freelancer-messages':
        return { title: 'Messages', description: '' }
      case 'freelancer-settings':
        return { title: 'Freelancer Settings', description: 'Manage your Freelancer.com connection and automation' }
      case 'freelancer-logs':
        return { title: 'Auto Bidding', description: '' }
      default:
        return { title: 'Dashboard', description: 'Overview of your lead management' }
    }
  }

  const renderPage = () => {
    // Check if trying to access admin pages without admin role
    const isAdminPage = currentPage.startsWith('admin-')
    if (isAdminPage && userRole !== 'admin') {
      // Redirect to dashboard if non-admin tries to access admin pages
      setCurrentPage('dashboard')
      return <Dashboard />
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'leads':
        return <Leads refreshTrigger={refreshLeads} />
      case 'proposals':
        return <Proposals onNavigateToLeads={() => setCurrentPage('leads')} />
      case 'talent':
        return <Talent />
      case 'analytics':
        return <Analytics />
      case 'crm':
        return <CRM />
      case 'settings':
        return <Settings />
      case 'admin-dashboard':
        return <AdminDashboard />
      case 'admin-users':
        return <AdminUsers />
      case 'admin-settings':
        return <AdminSettings />
      case 'admin-analytics':
        return <AdminAnalytics />

      case 'freelancer-projects':
        return <FreelancerProjects />
      case 'freelancer-bids':
        return <FreelancerBids />
      case 'freelancer-messages':
        return <FreelancerMessages />
      case 'freelancer-logs':
        return <AutoBidLogs />
      case 'freelancer-settings':
        return <FreelancerSettings />
      default:
        return <Leads refreshTrigger={refreshLeads} />
    }
  }

  const pageInfo = getPageInfo()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen relative overflow-hidden">
        <MatrixRain />
        <div className="text-center relative z-20">
          <div className="mb-6">
            <img
              src={gif}
              alt="AK BPO AI Logo"
              className="w-25 h-25 object-contain mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold mb-2 drop-shadow-lg">AK BPO AI</h1>
            <p className="text-sm drop-shadow-md">Loading your workspace...</p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full animate-bounce bg-green-400" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 rounded-full animate-bounce bg-green-400" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 rounded-full animate-bounce bg-green-400" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return showSignup ? (
      <Signup
        onSignupSuccess={handleSignupSuccess}
        onSwitchToLogin={() => setShowSignup(false)}
      />
    ) : (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onSwitchToSignup={() => setShowSignup(true)}
      />
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen overflow-hidden relative">
        <MatrixRain />
        <Toaster
          position="top-center"
          containerStyle={{
            top: 20,
          }}
          toastOptions={{
            // Default options
            duration: 3000,
            style: {
              background: '#fff',
              color: '#363636',
            },
            // Success toast
            success: {
              style: {
                background: '#10b981',
                color: '#fff',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#10b981',
              },
            },
            // Error toast
            error: {
              style: {
                background: '#ef4444',
                color: '#fff',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#ef4444',
              },
            },
            // Loading toast
            loading: {
              style: {
                background: '#3b82f6',
                color: '#fff',
              },
            },
            // Dark mode styles
            className: 'dark:!bg-[#2a2a2a] dark:!text-gray-100',
          }}
          // Limit to 1 toast at a time
          limit={1}
          // Remove toasts when new ones appear
          reverseOrder={false}
        />
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} onLogout={handleLogout} />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative z-20">
          <Navbar
            onSyncComplete={handleSyncComplete}
            pageTitle={pageInfo.title}
            pageDescription={pageInfo.description}
          />
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            {renderPage()}
          </main>
        </div>

      </div>
    </QueryClientProvider>
  )
}

export default App
