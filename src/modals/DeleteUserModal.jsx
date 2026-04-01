import { X, AlertTriangle } from 'lucide-react'

const DeleteUserModal = ({ user, onClose, onConfirm }) => {
  if (!user) return null

  return (
    <div 
      className="fixed inset-0 bg-black/30 dark:bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#1f1f1f] rounded-2xl max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-300">Delete User</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">This action cannot be undone</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Warning Message */}
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-300 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold">{user.email}</span>?
            </p>
            <p className="text-sm text-red-700 dark:text-red-400 mt-2">
              This will permanently delete:
            </p>
            <ul className="text-sm text-red-700 dark:text-red-400 mt-2 ml-4 space-y-1 list-disc">
              <li>User account and profile</li>
              <li>All leads ({user.leads_count || 0} leads)</li>
              <li>User settings and preferences</li>
              <li>All notifications</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              className="flex-1 bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors font-medium"
            >
              Delete User
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-white text-gray-700 px-6 py-3 rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeleteUserModal
