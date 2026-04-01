import { X, Eye, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { logDebug } from '../utils/logger'

const LeadDetailsModal = ({ lead, onClose, onApprove, onEdit, onReject }) => {
  const [showFullDescription, setShowFullDescription] = useState(false)

  if (!lead) return null

  // Debug: Log the lead data during development
  logDebug('Lead modal opened', { id: lead.id, status: lead.status })


  const getStatusColor = (status) => {
    const colors = {
      'AI Drafted': 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-[#2A2F3A] dark:text-[#D0D7E2] dark:border-[#3A404C]',
      'Drafted': 'bg-blue-50 text-blue-900 border border-blue-200 dark:bg-[#2E3340] dark:text-[#D6D9E0] dark:border-[#3C4150]',
      'Unqualified': 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-[#3A2F27] dark:text-[#E3C9B1] dark:border-[#4A3A30]',
      'Approved': 'bg-green-50 text-green-700 border border-green-200 dark:bg-[#25362B] dark:text-[#CDE7D4] dark:border-[#32463A]',
      'Rejected': 'bg-red-50 text-red-700 border border-red-200 dark:bg-[#3A272A] dark:text-[#E3C1C4] dark:border-[#4A3437]',
    }

    return colors[status] || 'bg-gray-50 text-gray-700 border border-gray-200 dark:bg-[#2A2A2A] dark:text-[#D1D1D1] dark:border-[#3A3A3A]'
  }

  const getPlatformColor = (platform) => {
    const colors = {
      'Upwork': 'bg-green-50 text-green-700 border border-green-200 dark:bg-[#25362B] dark:text-[#BFEBD0] dark:border-[#32463A]',
      'Freelancer': 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-[#2A2F3A] dark:text-[#C6D7EE] dark:border-[#3A404C]',
      'Freelancer Plus': 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-[#3A2F27] dark:text-[#E3C9B1] dark:border-[#4A3A30]',
      'Internal': 'bg-blue-50 text-blue-900 border border-blue-200 dark:bg-[#2E3340] dark:text-[#D6D9E0] dark:border-[#3C4150]',
    }

    return colors[platform] || 'bg-gray-50 text-gray-700 border border-gray-200 dark:bg-[#2A2A2A] dark:text-[#D1D1D1] dark:border-[#3A3A3A]'
  }


  const handleView = () => {
    // Ensure the lead has project_id set to its id for consistency
    const leadWithProjectId = {
      ...lead,
      project_id: lead.project_id || lead.id // Use existing project_id or fallback to lead id
    }
    
    // Store lead in localStorage and navigate to proposals page
    localStorage.setItem('editingLead', JSON.stringify(leadWithProjectId))
    // Store callback to refresh leads when returning
    localStorage.setItem('shouldRefreshLeads', 'true')
    // Trigger navigation to proposals page
    window.dispatchEvent(new CustomEvent('navigateToProposals'))
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/30 dark:bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1f1f1f] rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl scrollbar-hide"
        onClick={(e) => e.stopPropagation()}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 pr-8 dark:text-gray-300">{lead.title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-3 mb-8">
            {/* Platform Chip */}
            <span
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${getPlatformColor(lead.platform)}`}
            >
              {lead.platform}
            </span>

            {/* Status Chip */}
            <span
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusColor(lead.status)}`}
            >
              {lead.status}
            </span>

            {/* Budget Chip */}
            <span className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
              {lead.budget}
            </span>

            {/* Avg Bid Chip */}
            {lead.avg_bid_price && (
              <span className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700">
                Avg Bid: {lead.avg_bid_price}
              </span>
            )}
          </div>



          {/* Job Description */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 dark:text-gray-300">Job Description</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap dark:text-gray-500">
              {lead.description && lead.description.length > 150 && !showFullDescription
                ? lead.description.substring(0, 150) + '...'
                : lead.description || 'No description available.'}
            </p>
            {lead.description && lead.description.length > 150 && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="mt-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium text-sm transition-colors"
              >
                {showFullDescription ? 'Show Less' : 'Show More'}
              </button>

            )}
          </div>

          {/* Go to Job Button */}
          {lead.url && (
            <div className="mb-6">
              <a
                href={lead.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-grays-700 transition-colors font-medium text-sm"
              >
                Go to Job
                <ExternalLink size={16} />
              </a>
            </div>
          )}

          {/* AI-Generated Proposal */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 dark:text-gray-100">AI-Generated Proposal</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 dark:bg-[#212121] ">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap dark:text-gray-100">
                {lead.Proposal || 'No proposal available yet.'}
              </p>
            </div>
          </div>


          {/* Action Buttons */}
          <div className="flex gap-2 mt-8">
            <button
              onClick={handleView}
              className="flex-1 text-white px-4 py-2 rounded-xl text-sm transition-colors whitespace-nowrap flex items-center justify-center gap-2"
              style={{ backgroundColor: '#b59d32' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#9a8429'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#b59d32'}
            >
              <Eye size={16} />
              View
            </button>
            <button
              onClick={() => onEdit(lead)}
              className="flex-1 bg-white text-gray-700 px-4 py-2 rounded-xl text-sm border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Edit Draft
            </button>
            <button
              onClick={() => onReject(lead)}
              className="flex-1 bg-white text-gray-700 px-4 py-2 rounded-xl text-sm border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LeadDetailsModal
