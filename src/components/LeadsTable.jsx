import { Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import LeadDetailsModal from '../modals/LeadDetailsModal'
import { logDebug, logError } from '../utils/logger'

const LeadsTable = ({ leads, isLoading, currentPage, totalPages, onPageChange, onLeadUpdate }) => {
  const [selectedLead, setSelectedLead] = useState(null)

  const getTimeAgo = (postedTime) => {
    if (!postedTime) return 'Unknown'

    try {
      // Parse the UTC time string
      const posted = new Date(postedTime)

      // Check if date is valid
      if (isNaN(posted.getTime())) {
        return 'Unknown'
      }

      // Get current UTC time explicitly
      const now = new Date()
      const nowUtc = Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        now.getUTCHours(),
        now.getUTCMinutes(),
        now.getUTCSeconds(),
        now.getUTCMilliseconds()
      )

      // Calculate difference in milliseconds
      const diffMs = nowUtc - posted.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      // Handle negative time (future dates)
      if (diffMs < 0) {
        return 'Just now'
      }

      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 30) return `${diffDays}d ago`
      return posted.toLocaleDateString()
    } catch (error) {
      logError('Error parsing lead posted time', { error, postedTime })
      return 'Unknown'
    }
  }

  const handleViewDetails = (lead) => {
    setSelectedLead(lead)
  }

  const handleCloseModal = () => {
    setSelectedLead(null)
  }

  const handleApprove = (lead) => {
    logDebug('Approve lead from table', lead)
    // Add your approve logic here
    setSelectedLead(null)
  }

  const handleEdit = (lead) => {
    logDebug('Edit lead from table', lead)
    // Store lead in localStorage and navigate to proposals page
    localStorage.setItem('editingLead', JSON.stringify(lead))
    // Store callback to refresh leads when returning
    localStorage.setItem('shouldRefreshLeads', 'true')
    // Trigger navigation to proposals page
    window.dispatchEvent(new CustomEvent('navigateToProposals'))
    setSelectedLead(null)
  }

  const handleReject = (lead) => {
    logDebug('Reject lead from table', lead)
    // Add your reject logic here
    setSelectedLead(null)
  }
  const getStatusColor = (status) => {
    const colors = {
      'AI Drafted': 'bg-blue-50 text-blue-700 border border-blue-200',
      'Drafted': 'bg-blue-50 text-blue-900 border border-blue-200',
      'Unqualified': 'bg-orange-50 text-orange-700 border border-orange-200',
      'Approved': 'bg-green-50 text-green-700 border border-green-200',
      'Rejected': 'bg-red-50 text-red-700 border border-red-200',
    }
    return colors[status] || 'bg-gray-50 text-gray-700 border border-gray-200'
  }

  const getPlatformColor = (platform) => {
    const colors = {
      'Upwork': 'bg-green-50 text-green-700 border border-green-200',
      'Freelancer': 'bg-blue-50 text-blue-700 border border-blue-200',
      'Internal': 'bg-blue-50 text-blue-900 border border-blue-200',
    }
    return colors[platform] || 'bg-gray-50 text-gray-700 border border-gray-200'
  }

  return (
    <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white dark:bg-[#212121] border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                Platform
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                Title
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                Budget
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                Posted
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                Status
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                Job Score
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                Actions
              </th>
            </tr>
          </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {isLoading ? (
            <tr>
              <td colSpan="7" className="px-6 py-8 text-center">
                <div className="text-gray-500 dark:text-gray-400 text-sm">Loading leads...</div>
              </td>
            </tr>
          ) : leads.length === 0 ? (
            <tr>
              <td colSpan="7" className="px-6 py-8 text-center">
                <div className="text-gray-500 dark:text-gray-400 text-sm">No leads found. Click "Sync Now" to fetch leads.</div>
              </td>
            </tr>
          ) : (
            leads.map((lead, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${getPlatformColor(lead.platform)}`}>
                    {lead.platform}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 dark:text-gray-300">{lead.title}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-gray-300">{lead.budget}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 dark:text-gray-400" title={lead.posted_time}>
                    {getTimeAgo(lead.posted_time)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${getStatusColor(lead.status)}`}>
                    {lead.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-gray-300">{lead.score || '—'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleViewDetails(lead)}
                    className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 transition-colors"
                    style={{ color: '#b59d32' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#9a8429'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#b59d32'}
                  >
                    <Eye size={16} />
                    <span>View Details</span>
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden">
        {/* Mobile Pagination - Top */}
        {!isLoading && leads.length > 0 && totalPages > 1 && (
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-[#212121]">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-400 bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft size={14} />
                Prev
              </button>
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-400 bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="px-4 py-8 text-center">
            <div className="text-gray-500 dark:text-gray-400 text-sm">Loading leads...</div>
          </div>
        ) : leads.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <div className="text-gray-500 dark:text-gray-400 text-sm">No leads found. Click "Sync Now" to fetch leads.</div>
          </div>
        ) : (
          <div className="space-y-3 p-3">
            {leads.map((lead, index) => (
              <div key={index} className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-gray-600 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${getPlatformColor(lead.platform)}`}>
                    {lead.platform}
                  </span>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${getStatusColor(lead.status)}`}>
                    {lead.status}
                  </span>
                </div>
                
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-300 mb-2 line-clamp-2">{lead.title}</h3>
                
                <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Budget:</span>
                    <span className="text-gray-900 dark:text-gray-300 ml-1 font-medium">{lead.budget}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Score:</span>
                    <span className="text-gray-900 dark:text-gray-300 ml-1 font-medium">{lead.score || '—'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500 dark:text-gray-400">Posted:</span>
                    <span className="text-gray-900 dark:text-gray-300 ml-1" title={lead.posted_time}>
                      {getTimeAgo(lead.posted_time)}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => handleViewDetails(lead)}
                  className="w-full flex items-center justify-center gap-2 text-sm transition-colors py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
                  style={{ color: '#b59d32' }}
                >
                  <Eye size={16} />
                  <span>View Details</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedLead && (
        <LeadDetailsModal
          lead={selectedLead}
          onClose={handleCloseModal}
          onApprove={handleApprove}
          onEdit={handleEdit}
          onReject={handleReject}
        />
      )}

      {/* Desktop Pagination - Bottom */}
      {!isLoading && leads.length > 0 && totalPages > 1 && (
        <div className="hidden lg:flex px-4 py-3 border-t border-gray-200 dark:border-gray-700 items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-400 bg-white dark:bg-[#212121] border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-400 bg-white dark:bg-[#212121] border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default LeadsTable
