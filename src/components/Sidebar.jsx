import { LayoutDashboard, Briefcase, FileText, BarChart3, Settings, LogOut, Menu, X, Shield, Users, Globe, TrendingUp, ChevronDown, ChevronRight, UserCircle2, FolderOpen, MessageSquare, Eye, Zap } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import logo from '../assets/logo-dark.png'
import { logError } from '../utils/logger'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const Sidebar = ({ currentPage, setCurrentPage, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [userRole, setUserRole] = useState(() => {
    // Load from cache immediately
    const cached = sessionStorage.getItem('userRole')
    return cached || 'user'
  })
  const [adminExpanded, setAdminExpanded] = useState(() => {
    // Remember admin menu state
    const cached = localStorage.getItem('adminMenuExpanded')
    return cached === 'true'
  })
  const [freelancerExpanded, setFreelancerExpanded] = useState(() => {
    // Remember freelancer menu state
    const cached = localStorage.getItem('freelancerMenuExpanded')
    return cached === 'true'
  })

  const sidebarRef = useRef(null)

  useEffect(() => {
    // Load user role and AI model with caching
    const loadUserData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        // Check cache first
        const cachedRole = sessionStorage.getItem('userRole')
        if (cachedRole) {
          setUserRole(cachedRole)
        }

        const response = await fetch(`${API_URL}/api/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          const data = await response.json()
          const role = data.role || 'user'
          setUserRole(role)
          // Cache the role
          sessionStorage.setItem('userRole', role)
        }
      } catch (error) {
        logError('Failed to load user data', error)
        toast.error('Load On server Plz try again Later')
      }
    }

    loadUserData()
  }, [])



  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only handle clicks when mobile menu is open
      if (isMobileMenuOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        // Check if the click is not on the menu button
        const menuButton = document.querySelector('[data-mobile-menu-button]')
        if (menuButton && !menuButton.contains(event.target)) {
          setIsMobileMenuOpen(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMobileMenuOpen])

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads', icon: Briefcase },
    { id: 'proposals', label: 'Proposals', icon: FileText },
    { id: 'talent', label: 'Talent', icon: UserCircle2 },
    { id: 'crm', label: 'CRM', icon: TrendingUp },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  // Freelancer sub-menu items
  const freelancerMenuItems = [
    { id: 'freelancer-projects', label: 'Projects', icon: FolderOpen },
    { id: 'freelancer-bids', label: 'Bids', icon: Briefcase },
    { id: 'freelancer-messages', label: 'Messages', icon: MessageSquare },
    { id: 'freelancer-logs', label: 'Auto Bid', icon: Zap },
    { id: 'freelancer-settings', label: 'Settings', icon: Settings },
  ]

  // Admin sub-menu items
  const adminMenuItems = [
    { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'admin-users', label: 'User Management', icon: Users },
    { id: 'admin-settings', label: 'System Settings', icon: Globe },
    { id: 'admin-analytics', label: 'Analytics', icon: TrendingUp },
  ]

  const handleMenuClick = (itemId) => {
    setCurrentPage(itemId)
    setIsMobileMenuOpen(false)
  }

  const toggleAdminMenu = () => {
    const newState = !adminExpanded
    setAdminExpanded(newState)
    localStorage.setItem('adminMenuExpanded', newState.toString())
  }

  const toggleFreelancerMenu = () => {
    const newState = !freelancerExpanded
    setFreelancerExpanded(newState)
    localStorage.setItem('freelancerMenuExpanded', newState.toString())
  }

  return (
    <>
      {/* Mobile Menu Toggle Button - Only show when menu is closed */}
      {!isMobileMenuOpen && (
        <button
          data-mobile-menu-button
          onClick={() => setIsMobileMenuOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center text-gray-700 dark:text-gray-300 shadow-sm"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-[240px] bg-white dark:bg-[#1a1a1a] flex flex-col h-screen border-r border-gray-200 dark:border-gray-800
        transform transition-transform duration-300 ease-in-out lg:transform-none
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo with Close Button */}
        <div className="px-6 py-6 relative">
          {/* Mobile Close Button - Only show when menu is open */}
          {isMobileMenuOpen && (
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <img
              src={logo}
              alt="AK BPO AI Logo"
              className="h-14 object-contain"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            const isActive = currentPage === item.id

            return (
              <div key={item.id}>
                <button
                  onClick={() => handleMenuClick(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all ${isActive
                    ? 'bg-gray-100 dark:bg-[#1e1e1e] text-gray-900 dark:text-gray-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                >
                  <Icon size={16} strokeWidth={2} />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>

                {/* Freelancer Section - Show after Leads */}
                {item.id === 'leads' && (
                  <div className="mt-1">
                    <button
                      onClick={toggleFreelancerMenu}
                      className="w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl transition-all text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                    >
                      <div className="flex items-center gap-2.5">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14.096 3.076l1.634 2.292L24 3.076M5.503 20.924l4.474-4.374-2.692-2.89m6.133-10.584L11.027 5.23l4.022.15M4.124 3.077l.857 1.76 4.734.294m-3.058 7.072l3.497-6.522L0 5.13" />
                        </svg>
                        <span className="text-sm font-medium">Freelancer</span>
                      </div>
                      {freelancerExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>

                    {/* Freelancer Sub-menu */}
                    {freelancerExpanded && (
                      <div className="ml-4 mt-1 space-y-1">
                        {freelancerMenuItems.map((item) => {
                          const Icon = item.icon
                          const isActive = currentPage === item.id
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleMenuClick(item.id)}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-sm ${isActive
                                ? 'bg-gray-100 dark:bg-[#1e1e1e] text-gray-900 dark:text-gray-300'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                                }`}
                            >
                              <Icon size={14} strokeWidth={2} />
                              <span>{item.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Admin Section - Only show for admin users */}
          {userRole === 'admin' && (
            <div className="mt-1">
              <button
                onClick={toggleAdminMenu}
                className="w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl transition-all text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
              >
                <div className="flex items-center gap-2.5">
                  <Shield size={16} strokeWidth={2} style={{ color: '#b59d32' }} />
                  <span className="text-sm font-medium">Admin</span>
                </div>
                {adminExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              {/* Admin Sub-menu */}
              {adminExpanded && (
                <div className="ml-4 mt-1 space-y-1">
                  {adminMenuItems.map((item) => {
                    const Icon = item.icon
                    const isActive = currentPage === item.id
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleMenuClick(item.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-sm ${isActive
                          ? 'text-white'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                          }`}
                        style={isActive ? { backgroundColor: '#b59d32' } : {}}
                      >
                        <Icon size={14} strokeWidth={2} />
                        <span>{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </nav>
        <hr className="border-gray-200 dark:border-gray-800" />
        {/* Logout */}
        <div className="p-6">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
          >
            <LogOut size={16} strokeWidth={2} />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>
    </>
  )
}

export default Sidebar
