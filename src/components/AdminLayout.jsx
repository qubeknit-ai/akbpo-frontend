import { useState } from 'react'
import { LayoutDashboard, Users, Settings, BarChart3, ArrowLeft, Shield } from 'lucide-react'
import AdminDashboard from '../pages/AdminDashboard'
import AdminUsers from '../pages/AdminUsers'
import AdminSettings from '../pages/AdminSettings'
import AdminAnalytics from '../pages/AdminAnalytics'

const AdminLayout = ({ onNavigateBack }) => {
  const [currentSection, setCurrentSection] = useState('dashboard')

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { id: 'users', label: 'User Management', icon: Users, path: '/admin/users' },
    { id: 'settings', label: 'System Settings', icon: Settings, path: '/admin/settings' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/admin/analytics' }
  ]

  const renderSection = () => {
    switch (currentSection) {
      case 'dashboard':
        return <AdminDashboard />
      case 'users':
        return <AdminUsers />
      case 'settings':
        return <AdminSettings />
      case 'analytics':
        return <AdminAnalytics />
      default:
        return <AdminDashboard />
    }
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* Admin Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Admin Panel</h2>
              <p className="text-xs text-gray-500">System Management</p>
            </div>
          </div>
          
          <button
            onClick={onNavigateBack}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors w-full"
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = currentSection === item.id
              
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentSection(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'text-gray-900 font-medium' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  style={isActive ? { backgroundColor: '#b59d32', color: 'white' } : {}}
                >
                  <Icon size={20} className={isActive ? 'text-white' : 'text-gray-400'} />
                  <span className="text-sm">{item.label}</span>
                </button>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="bg-blue-100 rounded-lg p-3">
            <p className="text-xs font-medium text-blue-900 mb-1">Admin Access</p>
            <p className="text-xs text-blue-800">
              You have full system privileges
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {renderSection()}
      </div>
    </div>
  )
}

export default AdminLayout
