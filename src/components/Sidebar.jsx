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
  const [expandedMenu, setExpandedMenu] = useState(() => {
    // Load last expanded menu from cache
    return localStorage.getItem('sidebarExpandedMenu') || null
  })

  const sidebarRef = useRef(null)

  useEffect(() => {
    // Load user role and AI model with caching
    const loadUserData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        // Use apiCache for persistent, deduplicated profile fetching
        const data = await apiCache.fetchProfile()

        if (data) {
          const role = data.role || 'user'
          setUserRole(role)
          // Cache the role in sessionStorage for immediate sub-second access
          sessionStorage.setItem('userRole', role)
        }
      } catch (error) {
        logError('Failed to load user data', error)
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

  // Upwork sub-menu items
  const upworkMenuItems = [
    { id: 'upwork-projects', label: 'Projects', icon: FolderOpen },
    { id: 'upwork-bids', label: 'Bids', icon: Briefcase },
    { id: 'upwork-autobid', label: 'Auto Bid', icon: Zap },
    { id: 'upwork-settings', label: 'Settings', icon: Settings },
  ]

  // Guru sub-menu items
  const guruMenuItems = [
    { id: 'guru-projects', label: 'Projects', icon: FolderOpen },
    { id: 'guru-bids', label: 'Quotes', icon: Briefcase },
    { id: 'guru-autobid', label: 'Auto Quote', icon: Zap },
    { id: 'guru-settings', label: 'Settings', icon: Settings },
  ]

  // Truelancer sub-menu items
  const truelancerMenuItems = [
    { id: 'truelancer-jobs', label: 'Jobs', icon: FolderOpen },
    { id: 'truelancer-bids', label: 'Bids', icon: Briefcase },
    { id: 'truelancer-logs', label: 'Auto Bid', icon: Zap },
    { id: 'truelancer-settings', label: 'Settings', icon: Settings },
  ]

  // Admin sub-menu items
  const adminMenuItems = [
    { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'admin-users', label: 'User Management', icon: Users },
  ]

  const handleMenuClick = (itemId) => {
    setCurrentPage(itemId)
    setIsMobileMenuOpen(false)
  }

  const toggleMenu = (menuName) => {
    setExpandedMenu(prev => {
      const newState = prev === menuName ? null : menuName
      if (newState) {
        localStorage.setItem('sidebarExpandedMenu', newState)
      } else {
        localStorage.removeItem('sidebarExpandedMenu')
      }
      return newState
    })
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
                  <div className="mt-2 space-y-1">
                    <div className="px-3 py-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Platforms</span>
                    </div>
                    {/* Freelancer */}
                    <div>
                      <button
                        onClick={() => toggleMenu('freelancer')}
                        className="w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl transition-all text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                      >
                        <div className="flex items-center gap-2.5">
                          <svg className="w-4 h-4" fill="#29b2fe" viewBox="0 0 24 24">
                            <path d="M14.096 3.076l1.634 2.292L24 3.076M5.503 20.924l4.474-4.374-2.692-2.89m6.133-10.584L11.027 5.23l4.022.15M4.124 3.077l.857 1.76 4.734.294m-3.058 7.072l3.497-6.522L0 5.13" />
                          </svg>
                          <span className="text-sm font-medium">Freelancer</span>
                        </div>
                        {expandedMenu === 'freelancer' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                      {expandedMenu === 'freelancer' && (
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

                    {/* Upwork */}
                    <div>
                      <button
                        onClick={() => toggleMenu('upwork')}
                        className="w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl transition-all text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                      >
                        <div className="flex items-center gap-2.5">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#14a800">
                            <path d="M18.561 13.158c-1.102 0-2.135-.467-3.074-1.227l.228-1.076.008-.042c.207-1.143.849-3.06 2.839-3.06 1.492 0 2.703 1.212 2.703 2.703-.001 1.489-1.212 2.702-2.704 2.702zm0-8.14c-2.539 0-4.51 1.649-5.31 4.366-1.22-1.834-2.148-4.036-2.687-5.892H7.828v7.112c-.002 1.406-1.141 2.546-2.547 2.546-1.405 0-2.543-1.14-2.545-2.546V3.492H0v7.112c0 2.914 2.37 5.303 5.281 5.303 2.913 0 5.283-2.389 5.283-5.303v-1.19c.529 1.107 1.182 2.229 1.974 3.221l-1.673 7.873h2.797l1.213-5.71c1.063.679 2.285 1.109 3.686 1.109 3 0 5.439-2.452 5.439-5.45 0-3-2.439-5.439-5.439-5.439z" />
                          </svg>
                          <span className="text-sm font-medium">Upwork</span>
                        </div>
                        {expandedMenu === 'upwork' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                      {expandedMenu === 'upwork' && (
                        <div className="ml-4 mt-1 space-y-1">
                          {upworkMenuItems.map((item) => {
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

                    {/* Guru */}
                    <div>
                      <button
                        onClick={() => toggleMenu('guru')}
                        className="w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl transition-all text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                      >
                        <div className="flex items-center gap-2.5">
                          <svg className="w-5 h-5" viewBox="0 0 238 238" xmlns="http://www.w3.org/2000/svg">
                            <path fill="#050505" d="M36.278374,198.709946 C39.302551,198.490875 42.204060,199.245712 44.889595,196.276215 C84.154289,152.859818 147.062164,153.030792 186.724182,196.492966 C187.473984,197.314621 188.409912,198.573776 189.276337,198.588211 C198.464539,198.741272 207.656281,198.683105 217.947845,198.683105 C200.253876,170.843063 177.055069,152.379593 145.662949,143.902298 C146.714951,143.035233 146.933243,142.732300 147.220764,142.635941 C164.344452,136.896744 179.700287,128.168015 193.023621,115.889122 C194.025284,114.965981 195.948608,114.750404 197.454727,114.717331 C204.258667,114.567932 210.361160,112.818947 214.659683,107.186935 C220.445831,99.605774 220.827133,90.404587 215.892380,82.945892 C211.581161,76.429642 202.471725,73.226021 194.174698,75.308189 C185.357712,77.520844 180.586670,83.965546 179.606339,94.318481 C179.409195,96.400604 178.424103,98.955475 176.914825,100.284676 C150.247604,123.770164 119.814690,129.648056 86.136772,118.945045 C73.299767,114.865387 62.319546,107.613312 52.414749,97.615494 C54.554279,95.707306 56.376743,94.092773 58.187187,92.464874 C61.539600,89.450462 64.643127,87.716347 69.953987,88.600006 C81.051056,90.446457 89.673843,83.116280 91.501488,71.925812 C92.939423,63.121494 85.130882,52.324333 75.244759,50.353199 C67.478233,48.804680 57.222710,53.149452 53.607578,64.649506 C52.927612,66.812553 51.049038,68.723442 49.396645,70.435081 C41.224560,78.900169 32.866077,87.187210 24.806677,95.756508 C23.905632,96.714546 23.711155,99.635139 24.487881,100.680878 C39.119873,120.380524 58.082092,134.140030 81.544769,141.572403 C83.146210,142.079697 84.721161,142.670593 87.702347,143.707367 C55.607216,153.066284 31.284952,170.205978 14.564740,198.709381 C22.084806,198.709381 28.707325,198.709381 36.278374,198.709946 M142.155869,75.127945 C151.012360,79.205475 159.868835,83.283012 168.256973,87.144920 C171.924576,81.423080 175.893814,75.230629 180.146378,68.596161 C155.742218,52.352467 129.210724,44.473030 99.911049,51.207211 C101.339226,57.937042 102.764801,64.654587 104.253784,71.670944 C116.543259,70.628128 129.082397,71.433266 142.155869,75.127945 z" />
                            <path fill="#3178BF" d="M141.764648,75.021698 C129.082397,71.433266 116.543259,70.628128 104.253784,71.670944 C102.764801,64.654587 101.339226,57.937042 99.911049,51.207211 C129.210724,44.473030 155.742218,52.352467 180.146378,68.596161 C175.893814,75.230629 171.924576,81.423080 168.256973,87.144920 C159.868835,83.283012 151.012360,79.205475 141.764648,75.021698 z" />
                            <path fill="#030303" d="M130.022858,114.043686 C126.263618,115.672546 122.504379,117.301414 118.187592,118.630127 C116.766716,118.483833 115.903397,118.637695 115.040070,118.791557 C114.600655,118.797615 114.161232,118.803673 113.381935,118.442734 C112.370094,118.005028 111.698135,117.934303 111.026176,117.863571 C101.725960,114.246651 96.987877,106.844254 98.029854,97.559181 C98.930756,89.531242 106.811203,81.735176 115.177399,80.595276 C124.089882,79.380943 132.014648,84.238144 135.693954,93.792946 C135.836227,94.884262 136.199463,95.488220 136.562698,96.092186 C136.634460,98.085846 136.706207,100.079514 136.391876,102.517395 C135.974304,103.635201 135.942795,104.308792 135.911285,104.982376 C135.138184,106.861046 134.365082,108.739716 132.976028,110.829468 C131.581009,112.041595 130.801941,113.042641 130.022858,114.043686 z" />
                          </svg>
                          <span className="text-sm font-medium">Guru</span>
                        </div>
                        {expandedMenu === 'guru' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                      {expandedMenu === 'guru' && (
                        <div className="ml-4 mt-1 space-y-1">
                          {guruMenuItems.map((item) => {
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

                    {/* Truelancer */}
                    <div>
                      <button
                        onClick={() => toggleMenu('truelancer')}
                        className="w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl transition-all text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-4 h-4 rounded-sm text-xs font-bold flex items-center justify-center text-white bg-blue-600" style={{ fontSize: '10px' }}>T</span>
                          <span className="text-sm font-medium">Truelancer</span>
                        </div>
                        {expandedMenu === 'truelancer' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                      {expandedMenu === 'truelancer' && (
                        <div className="ml-4 mt-1 space-y-1">
                          {truelancerMenuItems.map((item) => {
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
                    <div className="h-4"></div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Admin Section - Only show for admin users */}
          {userRole === 'admin' && (
            <div className="mt-4">
              <button
                onClick={() => toggleMenu('admin')}
                className="w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl transition-all text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
              >
                <div className="flex items-center gap-2.5">
                  <Shield size={16} strokeWidth={2} style={{ color: '#b59d32' }} />
                  <span className="text-sm font-medium">Admin</span>
                </div>
                {expandedMenu === 'admin' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              {/* Admin Sub-menu */}
              {expandedMenu === 'admin' && (
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
