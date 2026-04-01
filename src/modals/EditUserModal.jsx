import { X, User, Shield } from 'lucide-react'

const EditUserModal = ({ user, onClose, onSave, onChange }) => {
  if (!user) return null

  return (
    <div 
      className="fixed inset-0 bg-black/30 dark:bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#1f1f1f] rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl scrollbar-hide"
        onClick={(e) => e.stopPropagation()}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit User</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Update user settings and permissions</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* User Info */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-[#2a2a2a] rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{user.name || 'No name'}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                <Shield size={16} className="text-purple-600 dark:text-purple-400" />
                User Role
              </label>
              <div className="relative">
                <select
                  value={user.role}
                  onChange={(e) => onChange({ ...user, role: e.target.value })}
                  className="w-full px-4 py-3 pr-10 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-gray-100 font-medium appearance-none cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 shadow-sm"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.75rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em'
                  }}
                >
                  <option value="user">👤 User</option>
                  <option value="admin">🛡️ Admin</option>
                </select>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Admins have full access to system management
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-8">
            <button
              onClick={onSave}
              className="flex-1 text-white px-6 py-3 rounded-xl transition-colors font-medium hover:opacity-90"
              style={{ backgroundColor: '#b59d32' }}
            >
              Save Changes
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-white dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-[#333333] transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditUserModal
