import { useState, useEffect, useMemo, useCallback } from 'react'
import { Search, Edit2, Trash2, Shield, User, Filter, ArrowUpDown, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { logError } from '../utils/logger'
import EditUserModal from '../modals/EditUserModal'
import DeleteUserModal from '../modals/DeleteUserModal'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const AdminUsers = () => {
  const [users, setUsers] = useState(() => {
    // PERFORMANCE: Load from cache immediately
    const cached = sessionStorage.getItem('adminUsers')
    if (cached) {
      try {
        return JSON.parse(cached)
      } catch (e) {
        return []
      }
    }
    return []
  })
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState(() => {
    const cached = sessionStorage.getItem('adminUsersTimestamp')
    return cached ? new Date(parseInt(cached)) : null
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [editingUser, setEditingUser] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [deletingUser, setDeletingUser] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  
  // Filtering and sorting states
  const [roleFilter, setRoleFilter] = useState('all')
  const [sortBy, setSortBy] = useState('email')
  
  // PERFORMANCE: Load system limits from cache
  const [systemLimits] = useState(() => {
    const cached = sessionStorage.getItem('systemLimits')
    if (cached) {
      try {
        return JSON.parse(cached)
      } catch (e) {
        return { upwork: 5, freelancer: 5, freelancer_plus: 3 }
      }
    }
    return { upwork: 5, freelancer: 5, freelancer_plus: 3 }
  })

  // PERFORMANCE: Memoize expensive operations
  const normalizeStatus = useCallback((status = '') => {
    if (status === null || status === undefined) return ''
    return status.toString().trim().toLowerCase()
  }, [])

  const getAdminLeadsForCounts = useCallback(async (headers) => {
    const cached = sessionStorage.getItem('adminLeadsData')
    const timestamp = sessionStorage.getItem('adminLeadsTimestamp')
    const cacheAge = timestamp ? Date.now() - parseInt(timestamp) : Infinity
    
    // PERFORMANCE: Use 5-minute cache instead of 2 minutes
    if (cached && cacheAge < 300000) {
      try {
        return JSON.parse(cached)
      } catch (error) {
        logError('Failed to parse cached admin leads', error)
      }
    }

    if (!headers) {
      return []
    }

    try {
      const response = await fetch(`${API_URL}/api/admin/leads`, { headers })
      if (response.ok) {
        const payload = await response.json()
        const leads = payload.leads || []
        sessionStorage.setItem('adminLeadsData', JSON.stringify(leads))
        sessionStorage.setItem('adminLeadsTimestamp', Date.now().toString())
        return leads
      }
      logError('Failed to fetch admin leads', response.status)
    } catch (error) {
      logError('Error fetching admin leads', error)
    }

    if (cached) {
      try {
        return JSON.parse(cached)
      } catch (error) {
        logError('Failed to parse fallback admin leads cache', error)
      }
    }

    return []
  }, [])

  useEffect(() => {
    loadUsers()
    
    // PERFORMANCE: Increase auto-refresh to 60 seconds (was 30)
    const interval = setInterval(() => {
      loadUsers(true)
    }, 60000)
    
    return () => clearInterval(interval)
  }, [])

  const loadUsers = useCallback(async (isBackgroundSync = false) => {
    try {
      if (!isBackgroundSync) {
        setLoading(true)
      } else {
        setSyncing(true)
      }
      
      const token = localStorage.getItem('token')
      
      // PERFORMANCE: Use 5-minute cache instead of 2 minutes
      const cacheTimestamp = sessionStorage.getItem('adminUsersTimestamp')
      const cacheAge = cacheTimestamp ? Date.now() - parseInt(cacheTimestamp) : Infinity
      
      if (cacheAge < 300000 && users.length > 0 && !isBackgroundSync) {
        setLoading(false)
        return
      }

      const headers = { 'Authorization': `Bearer ${token}` }
      const response = await fetch(`${API_URL}/api/admin/users`, { headers })

      if (response.ok) {
        const data = await response.json()
        const adminLeads = await getAdminLeadsForCounts(headers)
        
        // PERFORMANCE: Use Map for O(1) lookup instead of reduce
        const approvedCounts = new Map()
        for (const lead of adminLeads) {
          if (normalizeStatus(lead.status) === 'approved') {
            approvedCounts.set(lead.user_id, (approvedCounts.get(lead.user_id) || 0) + 1)
          }
        }

        const enrichedUsers = data.users.map((user) => ({
          ...user,
          approved_leads_count: approvedCounts.get(user.id) ?? user.approved_leads_count ?? 0
        }))

        setUsers(enrichedUsers)
        const now = Date.now()
        sessionStorage.setItem('adminUsers', JSON.stringify(enrichedUsers))
        sessionStorage.setItem('adminUsersTimestamp', now.toString())
        setLastSync(new Date(now))
      }
    } catch (error) {
      logError('Failed to load users', error)
      if (!isBackgroundSync) {
        toast.error('Load On server Plz try again Later')
      }
    } finally {
      setLoading(false)
      setSyncing(false)
    }
  }, [users.length, getAdminLeadsForCounts, normalizeStatus])

  const handleEditUser = useCallback((user) => {
    setEditingUser({ ...user })
    setShowEditModal(true)
  }, [])

  const handleSaveUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          role: editingUser.role
        })
      })

      if (response.ok) {
        toast.success('User updated successfully')
        setShowEditModal(false)
        sessionStorage.removeItem('adminUsers')
        sessionStorage.removeItem('adminUsersTimestamp')
        loadUsers()
      } else {
        toast.error('Failed to update user')
      }
    } catch (error) {
      logError('Failed to update user', error)
      toast.error('Load On server Plz try again Later')
    }
  }, [editingUser, loadUsers])

  const handleDeleteClick = useCallback((user) => {
    setDeletingUser(user)
    setShowDeleteModal(true)
  }, [])

  const handleDeleteUser = useCallback(async () => {
    if (!deletingUser) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/admin/users/${deletingUser.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        toast.success('User deleted successfully')
        setShowDeleteModal(false)
        setDeletingUser(null)
        sessionStorage.removeItem('adminUsers')
        sessionStorage.removeItem('adminUsersTimestamp')
        loadUsers()
      } else {
        toast.error('Failed to delete user')
      }
    } catch (error) {
      logError('Failed to delete user', error)
      toast.error('Load On server Plz try again Later')
    }
  }, [deletingUser, loadUsers])

  // PERFORMANCE: Memoize filtered and sorted users to avoid recalculation on every render
  const filteredAndSortedUsers = useMemo(() => {
    return users
      .filter(user => {
        const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
        const matchesRole = roleFilter === 'all' || user.role === roleFilter
        return matchesSearch && matchesRole
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'leads_asc':
            return (a.leads_count || 0) - (b.leads_count || 0)
          case 'leads_desc':
            return (b.leads_count || 0) - (a.leads_count || 0)
          case 'bids_today_asc':
            return (a.bids_today || 0) - (b.bids_today || 0)
          case 'bids_today_desc':
            return (b.bids_today || 0) - (a.bids_today || 0)
          case 'bids_week_asc':
            return (a.bids_week || 0) - (b.bids_week || 0)
          case 'bids_week_desc':
            return (b.bids_week || 0) - (a.bids_week || 0)
          case 'email':
          default:
            return a.email.localeCompare(b.email)
        }
      })
  }, [users, searchTerm, roleFilter, sortBy])

  if (loading) {
    return (
      <div className="p-8 min-h-full">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 min-h-full relative">
      {/* Page Header with Status Indicators */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 dark:text-gray-100">User Management</h1>
        </div>
        
        {/* Status Indicators - Page Level */}
        <div className="flex items-center gap-3">
          {syncing ? (
            <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-lg shadow-sm border border-blue-200 dark:border-blue-800">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Syncing...</span>
            </div>
          ) : lastSync ? (
            <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-2 rounded-lg shadow-sm border border-green-200 dark:border-green-800">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Live</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search users by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className=" bg-white dark:bg-[#2a2a2a] text-gray-900 text-gray-900 dark:text-gray-100 w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
            style={{ outlineColor: '#b59d32' }}
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent text-sm bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-gray-100 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
              style={{ outlineColor: '#b59d32' }}
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <ArrowUpDown size={18} className="text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent text-sm bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-gray-100 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
              style={{ outlineColor: '#b59d32' }}
            >
              <option value="email">Email (A-Z)</option>
              <option value="leads_asc">Leads (Low to High)</option>
              <option value="leads_desc">Leads (High to Low)</option>
              <option value="bids_today_asc">Bids Today (Low to High)</option>
              <option value="bids_today_desc">Bids Today (High to Low)</option>
              <option value="bids_week_asc">Bids Week (Low to High)</option>
              <option value="bids_week_desc">Bids Week (High to Low)</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="ml-auto text-sm text-gray-600 dark:text-gray-400">
            Showing <span className="font-semibold">{filteredAndSortedUsers.length}</span> of <span className="font-semibold">{users.length}</span> users
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 dark:bg-[#1f1f1f]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auto-Bid Stats</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leads</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAndSortedUsers.map((user) => (
                <tr key={user.id} className="">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
  className="w-10 h-10 rounded-full flex items-center justify-center bg-[#f0e9d2] dark:bg-[#3A3220]"
>
  <User className="w-5 h-5 text-[#b59d32] dark:text-[#D6C68B]" />
</div>

                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-300">{user.name || 'No name'}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-300">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}
                    style={user.role === 'admin' ? { backgroundColor: '#b59d32' } : {}}>
                      {user.role === 'admin' && <Shield size={12} />}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm space-y-1.5">
                      {/* Bids Today */}
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400 w-20">Today:</span>
                        <span className="font-medium px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700 dark:bg-[#2A3441] dark:text-[#B8D4F0]">
                          {user.bids_today || 0} bids
                        </span>
                      </div>

                      {/* Bids Week */}
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400 w-20">Week:</span>
                        <span className="font-medium px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-700 dark:bg-[#3A2F41] dark:text-[#D4C4F0]">
                          {user.bids_week || 0} bids
                        </span>
                      </div>

                      {/* Success Today */}
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400 w-20">Success:</span>
                        <div className="flex items-center gap-1">
                          <span className="font-medium px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700 dark:bg-[#2A3441] dark:text-[#B8D4F0]">
                            {user.success_today || 0}
                          </span>
                          <span className="text-gray-400 dark:text-gray-500 text-xs">:</span>
                          <span className="font-medium px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-700 dark:bg-[#3A2F41] dark:text-[#D4C4F0]">
                            {user.success_week || 0}
                          </span>
                        </div>
                      </div>

                      {/* Profit */}
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400 w-20">Profit:</span>
                        <span className="font-medium px-2 py-0.5 rounded text-xs bg-green-100 text-green-700 dark:bg-[#2A3F2F] dark:text-[#B8F0C4]">
                          ${(user.total_profit || 0).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-300">{user.leads_count || 0}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Edit user"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(user)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete user"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveUser}
          onChange={setEditingUser}
        />
      )}

      {/* Delete User Modal */}
      {showDeleteModal && deletingUser && (
        <DeleteUserModal
          user={deletingUser}
          onClose={() => {
            setShowDeleteModal(false)
            setDeletingUser(null)
          }}
          onConfirm={handleDeleteUser}
        />
      )}
    </div>
  )
}

export default AdminUsers
