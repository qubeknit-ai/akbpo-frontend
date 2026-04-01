import toast from 'react-hot-toast'

// Utility to show only one toast at a time
export const showSingleToast = {
  success: (message, options = {}) => {
    toast.dismiss() // Clear all existing toasts
    return toast.success(message, options)
  },
  
  error: (message, options = {}) => {
    toast.dismiss() // Clear all existing toasts
    return toast.error(message, options)
  },
  
  loading: (message, options = {}) => {
    toast.dismiss() // Clear all existing toasts
    return toast.loading(message, options)
  },
  
  // For custom toasts
  custom: (message, options = {}) => {
    toast.dismiss() // Clear all existing toasts
    return toast(message, options)
  }
}

// Alternative: Show only one toast of each type
export const showTypedToast = {
  success: (message, options = {}) => {
    // Dismiss only success toasts
    toast.dismiss()
    return toast.success(message, { id: 'success-toast', ...options })
  },
  
  error: (message, options = {}) => {
    // Dismiss only error toasts
    toast.dismiss()
    return toast.error(message, { id: 'error-toast', ...options })
  },
  
  loading: (message, options = {}) => {
    // Dismiss only loading toasts
    toast.dismiss()
    return toast.loading(message, { id: 'loading-toast', ...options })
  }
}