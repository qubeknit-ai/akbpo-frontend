import { X, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const ProposalGeneratorModal = ({ 
  isOpen, 
  onClose, 
  onProposalGenerated 
}) => {
  const [jobDescription, setJobDescription] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [currentStep, setCurrentStep] = useState('form') // 'form', 'generating', 'success', 'error'

  // Reset states when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setJobDescription('')
      setError('')
      setIsGenerating(false)
      setCurrentStep('form')
    }
  }, [isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!jobDescription.trim()) {
      setError('Please enter a job description')
      return
    }

    setIsGenerating(true)
    setError('')
    setCurrentStep('generating')
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Please log in to generate proposals')
      }
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      
      const response = await fetch(`${API_URL}/api/proposal/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          job_description: jobDescription.trim()
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to generate proposal')
      }

      const data = await response.json()
      
      // Check if we got a proposal back
      if (data.proposal) {
        setCurrentStep('success')
        
        // Pass the generated proposal back to parent
        setTimeout(() => {
          onProposalGenerated(data.proposal)
          handleClose()
        }, 1500)
      } else {
        throw new Error('No proposal received from generator')
      }

    } catch (err) {
      console.error('Proposal generation error:', err)
      setCurrentStep('error')
      setError(err.message || 'Failed to generate proposal. Please try again.')
      setIsGenerating(false)
    }
  }

  const handleClose = () => {
    if (!isGenerating) {
      setJobDescription('')
      setError('')
      setIsGenerating(false)
      setCurrentStep('form')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/30 dark:bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={currentStep === 'form' ? handleClose : undefined}
    >
      <div 
        className="bg-white dark:bg-[#1f1f1f] rounded-2xl w-full max-w-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-300">
                {currentStep === 'form' ? 'Generate Proposal' : 
                 currentStep === 'generating' ? 'Generating Proposal' :
                 currentStep === 'success' ? 'Proposal Generated!' :
                 'Generation Failed'}
              </h3>
              {currentStep === 'form' && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Enter the job description to generate a custom proposal
                </p>
              )}
            </div>
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
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Job Description
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full h-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-700 bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-gray-300 resize-none"
                  placeholder="Paste the job description here..."
                  autoFocus
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Provide as much detail as possible for a better proposal
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

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
                  disabled={!jobDescription.trim()}
                  className="flex-1 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  Generate Proposal
                </button>
              </div>
            </form>
          )}

          {/* Generating View */}
          {currentStep === 'generating' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <Loader2 size={64} className="text-blue-600 dark:text-blue-400 animate-spin" />
              </div>
              <p className="text-lg font-medium text-gray-900 dark:text-gray-300 mb-2">
                Generating Your Proposal
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI is crafting a custom proposal based on the job description...
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
                Proposal Generated Successfully!
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Loading your proposal...
              </p>
            </div>
          )}

          {/* Error View */}
          {currentStep === 'error' && (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertCircle size={48} className="text-red-600 dark:text-red-400" />
              </div>
              <p className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
                Generation Failed
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
                    setIsGenerating(false)
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

export default ProposalGeneratorModal
