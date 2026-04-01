import { X, Edit2, TrendingUp, Calendar } from 'lucide-react'

const ProfileModal = ({ 
  isOpen, 
  onClose, 
  userProfile, 
  upworkRemaining, 
  upworkLimit, 
  freelancerRemaining, 
  freelancerLimit, 
  freelancerPlusRemaining, 
  freelancerPlusLimit,
  onEditProfile,
  freelancerProfile 
}) => {
  if (!isOpen) return null

  // Better handling for missing userProfile data
  if (!userProfile) {
    return (
      <div 
        className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl max-w-md w-full shadow-2xl p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  // Safe extraction of user data
  const userEmail = userProfile.email || 'No email'
  const userName = userProfile.name || (userProfile.email ? userProfile.email.split('@')[0].charAt(0).toUpperCase() + userProfile.email.split('@')[0].slice(1) : 'User')
  
  // Get freelancer avatar URL using the same logic as Navbar
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
  const displayName = freelancerProfile?.display_name || freelancerProfile?.username || userName

  return (
    <div 
      className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#1f1f1f] rounded-2xl max-w-md w-full mx-4 shadow-2xl overflow-hidden animate-fadeIn max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className="relative px-4 sm:px-6 py-6 sm:py-8" style={{ background: 'linear-gradient(to bottom right, #1e3a8a, #1e40af)' }}>
          <button
            onClick={onClose}
            className="absolute top-3 sm:top-4 right-3 sm:right-4 text-white/80 hover:text-white transition-colors p-1"
          >
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>
          
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white/30 shadow-lg overflow-hidden bg-white/20 backdrop-blur-sm flex items-center justify-center">
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
                    className="w-full h-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-2xl sm:text-3xl absolute top-0 left-0"
                    style={{ display: 'none' }}
                  >
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-bold text-2xl sm:text-3xl">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-4 text-center px-2">{displayName}</h2>
            <p className="text-blue-100 text-sm mt-1 text-center px-2 break-all">{userEmail}</p>
            
            {userProfile.role === 'admin' && (
              <span className="mt-3 px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full border border-white/30">
                Admin
              </span>
            )}
          </div>
        </div>

        {/* Profile Details */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* User Info Section */}
          <div className="bg-gray-50 dark:bg-[#1e1e1e] rounded-xl p-3 sm:p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-300 flex items-center gap-2">
              <Calendar size={16} style={{ color: '#b59d32' }} />
              Profile Information
            </h3>
            
            {/* Always show name and email */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Name</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-300 break-words">{userName}</span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Email</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-300 break-all">{userEmail}</span>
            </div>
            
            {userProfile.country && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Country</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-300">{userProfile.country}</span>
              </div>
            )}
            
            {userProfile.telegram_chat_id && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Telegram</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-300">Connected</span>
              </div>
            )}
          </div>

          {/* Daily Limits Section */}
          

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => {
                onClose()
                onEditProfile()
              }}
              className="flex-1 text-white px-4 py-3 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
              style={{ backgroundColor: '#b59d32' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#9a8429'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#b59d32'}
            >
              <Edit2 size={16} />
              <span className="text-sm sm:text-base">Edit Profile</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 sm:px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
            >
              <span className="text-sm sm:text-base">Close</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileModal
