import { X, DollarSign, Send, CheckCircle, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

const BidModal = ({ 
  isOpen, 
  onClose, 
  onPlaceBid, 
  lead, 
  suggestedAmount 
}) => {
  const [bidAmount, setBidAmount] = useState(suggestedAmount?.toString() || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [currentStep, setCurrentStep] = useState('form') // 'form', 'anti-ban', 'placing', 'success', 'error'

  // Update bid amount when suggested amount changes
  useEffect(() => {
    if (suggestedAmount) {
      setBidAmount(suggestedAmount.toString())
    }
  }, [suggestedAmount])

  // Reset states when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setError('')
      setSuccess(false)
      setIsSubmitting(false)
      setCurrentStep('form')
    }
  }, [isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const bidAmountNum = parseFloat(bidAmount)
    if (isNaN(bidAmountNum) || bidAmountNum <= 0) {
      setError('Please enter a valid bid amount')
      return
    }

    setIsSubmitting(true)
    setError('')
    setSuccess(false)
    
    // Step 1: Show "Activating Anti Ban" for 2 seconds
    setCurrentStep('anti-ban')
    
    setTimeout(async () => {
      // Step 2: Show "Placing Bid" with loading
      setCurrentStep('placing')
      
      try {
        await onPlaceBid(bidAmount)
        // Step 3: Show success
        setCurrentStep('success')
        setSuccess(true)
        setIsSubmitting(false)
        // Close modal after 5 seconds on success
        setTimeout(() => {
          handleClose()
        }, 5000)
      } catch (err) {
        // Step 3: Show error
        setCurrentStep('error')
        setError(err.message || 'Failed to place bid. Please try again.')
        setIsSubmitting(false)
      }
    }, 2000)
  }

  const handleClose = () => {
    setBidAmount(suggestedAmount?.toString() || '')
    setError('')
    setSuccess(false)
    setIsSubmitting(false)
    setCurrentStep('form')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/30 dark:bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={currentStep === 'form' ? handleClose : undefined}
    >
      <div 
        className="bg-white dark:bg-[#1f1f1f] rounded-2xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-300">
              {currentStep === 'form' ? 'Set Bid Amount' : 
               currentStep === 'anti-ban' ? 'Activating Anti Ban' :
               currentStep === 'placing' ? 'Placing Bid' :
               currentStep === 'success' ? 'Bid Placed Successfully!' :
               'Bid Failed'}
            </h3>
            {currentStep === 'form' && (
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X size={24} />
              </button>
            )}
          </div>
          
          {/* Form View */}
          {currentStep === 'form' && (
            <>
              {/* Project Budget Display */}
              <div className="mb-4 p-3 bg-gray-50 dark:bg-[#212121] rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={16} className="text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Project Budget</span>
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-300">
                  {lead?.budget || 'Not specified'}
                </p>
              </div>

              {/* Suggested Amount */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Suggested Amount
                </label>
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    ${suggestedAmount}
                  </div>
                  <button
                    onClick={() => setBidAmount(suggestedAmount?.toString() || '')}
                    className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    Use This Amount
                  </button>
                </div>
              </div>

              {/* Manual Bid Amount Input */}
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Bid Amount ($)
                  </label>
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    min="1"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-700 bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-gray-300"
                    placeholder="Enter bid amount"
                    autoFocus
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Enter the amount you want to bid for this project
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-[#212121] text-gray-700 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!bidAmount || parseFloat(bidAmount) <= 0}
                    className="flex-1 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Send size={16} />
                    Place Bid (${bidAmount})
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Anti-Ban Activation View */}
          {currentStep === 'anti-ban' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin border-t-blue-600 dark:border-t-blue-400"></div>
              </div>
              <p className="text-lg font-medium text-gray-900 dark:text-gray-300 mb-2">
                Activating Anti Ban Protection
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Preparing secure bid placement...
              </p>
            </div>
          )}

          {/* Placing Bid View */}
          {currentStep === 'placing' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <div className="w-16 h-16 border-4 border-green-200 dark:border-green-800 rounded-full animate-spin border-t-green-600 dark:border-t-green-400"></div>
              </div>
              <p className="text-lg font-medium text-gray-900 dark:text-gray-300 mb-2">
                Placing Your Bid
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Submitting bid of ${bidAmount} to Freelancer...
              </p>
            </div>
          )}

          {/* Success View */}
          {currentStep === 'success' && (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle size={48} className="text-green-600 dark:text-green-400" />
              </div>
              <p className="text-xl font-bold text-green-600 dark:text-green-400 mb-2">
                Bid Placed Successfully!
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Your bid of ${bidAmount} has been submitted to Freelancer.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Modal will close automatically in 5 seconds...
              </p>
              <button
                onClick={handleClose}
                className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Close Now
              </button>
            </div>
          )}

          {/* Error View */}
          {currentStep === 'error' && (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertCircle size={48} className="text-red-600 dark:text-red-400" />
              </div>
              <p className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
                Bid Failed
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                {error}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-[#212121] text-gray-700 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setCurrentStep('form')
                    setError('')
                    setIsSubmitting(false)
                  }}
                  className="flex-1 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BidModal