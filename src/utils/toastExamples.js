// Example usage of the new toast utilities

import { showSingleToast, showTypedToast } from './toastUtils'

// Example 1: Using showSingleToast (recommended)
// This will dismiss all existing toasts before showing the new one

const handleSaveSettings = async () => {
  try {
    // Show loading toast
    const loadingToast = showSingleToast.loading('Saving settings...')
    
    // Simulate API call
    await saveSettingsAPI()
    
    // Show success toast (this will replace the loading toast)
    showSingletoast.success('Settings saved successfully!')
    
  } catch (error) {
    // Show error toast (this will replace any existing toast)
    showSingletoast.error('Failed to save settings')
  }
}

// Example 2: Using showTypedToast
// This allows one toast of each type (success, error, loading)

const handleMultipleOperations = async () => {
  try {
    // These won't stack - each type replaces the previous toast of the same type
    showTypedToast.loading('Processing...')
    
    await operation1()
    showTypedtoast.success('Operation 1 completed!')
    
    await operation2()
    showTypedtoast.success('Operation 2 completed!')
    
  } catch (error) {
    showTypedtoast.error('Operation failed!')
  }
}

// Example 3: For loading states with proper cleanup
const handleAsyncOperation = async () => {
  const loadingToast = showSingleToast.loading('Processing...')
  
  try {
    const result = await someAsyncOperation()
    
    // Replace loading toast with success
    showSingletoast.success('Operation completed!', { id: loadingToast })
    
  } catch (error) {
    // Replace loading toast with error
    showSingletoast.error('Operation failed!', { id: loadingToast })
  }
}

export { handleSaveSettings, handleMultipleOperations, handleAsyncOperation }