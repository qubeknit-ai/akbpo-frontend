import { Eye, LayoutGrid, Table } from 'lucide-react'
import { useState } from 'react'
import LeadDetailsModal from '../modals/LeadDetailsModal'
import { logDebug } from '../utils/logger'

const LeadsGrouped = ({ leads, isLoading, onLeadUpdate }) => {
  const [selectedLead, setSelectedLead] = useState(null)
  const [viewMode, setViewMode] = useState('card') // 'card' or 'table'
  const [currentPage, setCurrentPage] = useState(1)
  const [cardPages, setCardPages] = useState({}) // Track page for each score group
  const leadsPerPage = 10
  const cardsPerPage = 5

  const getTimeAgo = (postedTime) => {
    if (!postedTime) return 'Unknown'

    try {
      const posted = new Date(postedTime)
      if (isNaN(posted.getTime())) return 'Unknown'

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

      const diffMs = nowUtc - posted.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMs < 0) return 'Just now'
      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 30) return `${diffDays}d ago`
      return posted.toLocaleDateString()
    } catch (error) {
      return 'Unknown'
    }
  }

  const parseBudget = (budgetStr) => {
    if (!budgetStr) return 0
    const match = budgetStr.match(/[\d,]+/)
    if (!match) return 0
    return parseInt(match[0].replace(/,/g, ''), 10)
  }

  const getBidsColor = (bids) => {
  if (bids <= 10)
    return 'text-green-700 bg-green-50 border-green-200 dark:bg-[#25362B] dark:text-[#CDE7D4] dark:border-[#32463A]'

  if (bids <= 30)
    return 'text-yellow-700 bg-yellow-50 border-yellow-200 dark:bg-[#3A3627] dark:text-[#E7E0B8] dark:border-[#4A4530]'

  return 'text-red-700 bg-red-50 border-red-200 dark:bg-[#3A272A] dark:text-[#E3C1C4] dark:border-[#4A3437]'
}


const getCostColor = (cost) => {
  if (cost < 10)
    return 'text-green-700 bg-green-50 border-green-200 dark:bg-[#25362B] dark:text-[#CDE7D4] dark:border-[#32463A]'

  if (cost < 21)
    return 'text-yellow-700 bg-yellow-50 border-yellow-200 dark:bg-[#3A3627] dark:text-[#E7E0B8] dark:border-[#4A4530]'

  return 'text-red-700 bg-red-50 border-red-200 dark:bg-[#3A272A] dark:text-[#E3C1C4] dark:border-[#4A3437]'
}


  const getBidsLabel = (bids) => {
    const emoji = bids <= 10 ? '🟢' : bids <= 30 ? '🟡' : '🔴'
    return `${bids} bids`
  }

  const getCostLabel = (cost) => {
    const emoji = cost < 10 ? '🟢' : cost < 21 ? '🟡' : '🔴'
    return `${cost} connects`
  }

  const getBidsCostDisplay = (lead) => {
    if (lead.platform === 'Upwork') {
      return {
        label: getCostLabel(lead.cost || 0),
        color: getCostColor(lead.cost || 0)
      }
    } else {
      return {
        label: getBidsLabel(lead.bids || 0),
        color: getBidsColor(lead.bids || 0)
      }
    }
  }

  // Group leads by score
  const groupedLeads = leads.reduce((acc, lead) => {
    const score = lead.score || '0'
    if (!acc[score]) {
      acc[score] = []
    }
    acc[score].push(lead)
    return acc
  }, {})

  // Sort scores: 0 (Custom Added) first, then 10 to 1
  const sortedScores = Object.keys(groupedLeads).sort((a, b) => {
    // Put 0 (Custom Added Jobs) at the top
    if (a === '0' && b !== '0') return -1
    if (b === '0' && a !== '0') return 1
    // For non-zero scores, sort from 10 to 1
    return parseInt(b) - parseInt(a)
  })

  const handleViewDetails = (lead) => {
    setSelectedLead(lead)
  }

  const handleCloseModal = () => {
    setSelectedLead(null)
  }

  const handleApprove = (lead) => {
    logDebug('Approve lead clicked', lead)
    setSelectedLead(null)
  }

  const handleEdit = (lead) => {
    // Ensure the lead has project_id set to its id for consistency
    const leadWithProjectId = {
      ...lead,
      project_id: lead.project_id || lead.id // Use existing project_id or fallback to lead id
    }
    
    localStorage.setItem('editingLead', JSON.stringify(leadWithProjectId))
    localStorage.setItem('shouldRefreshLeads', 'true')
    window.dispatchEvent(new CustomEvent('navigateToProposals'))
    setSelectedLead(null)
  }

  const handleReject = (lead) => {
    logDebug('Reject lead clicked', lead)
    setSelectedLead(null)
  }

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




  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
        <div className="text-gray-500 dark:text-gray-400 text-sm">Loading leads...</div>
      </div>
    )
  }

  if (leads.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
        <div className="text-gray-500 dark:text-gray-400 text-sm">No leads found. Click "Sync Now" to fetch leads.</div>
      </div>
    )
  }

  // Pagination for table view
  const totalPages = Math.ceil(leads.length / leadsPerPage)
  const startIndex = (currentPage - 1) * leadsPerPage
  const paginatedLeads = leads.slice(startIndex, startIndex + leadsPerPage)

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex justify-end">
  <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#1e1e1e] p-1">
    <button
      onClick={() => setViewMode('card')}
      className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
        viewMode === 'card'
          ? 'bg-gray-800 text-gray-100 dark:bg-[#2a2a2a] dark:text-gray-200'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
      }`}
    >
      <LayoutGrid size={16} />
      <span className="hidden sm:inline">Card View</span>
      <span className="sm:hidden">Card</span>
    </button>
    <button
      onClick={() => setViewMode('table')}
      className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
        viewMode === 'table'
          ? 'bg-gray-800 text-gray-100 dark:bg-[#2a2a2a] dark:text-gray-200'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
      }`}
    >
      <Table size={16} />
      <span className="hidden sm:inline">Table View</span>
      <span className="sm:hidden">Table</span>
    </button>
  </div>
</div>


      {/* Content */}
      {viewMode === 'card' ? (
        /* Card View - Grouped by Score */
        sortedScores.map((score) => {
          const scoreLeads = groupedLeads[score]
          const totalValue = scoreLeads.reduce((sum, lead) => sum + parseBudget(lead.budget), 0)
          const formattedTotal = totalValue > 0 ? `$${totalValue.toLocaleString()}` : '$0'
          
          // Pagination for this score group
          const currentCardPage = cardPages[score] || 1
          const totalCardPages = Math.ceil(scoreLeads.length / cardsPerPage)
          const startIdx = (currentCardPage - 1) * cardsPerPage
          const paginatedScoreLeads = scoreLeads.slice(startIdx, startIdx + cardsPerPage)

          const handleCardPageChange = (newPage) => {
            setCardPages(prev => ({ ...prev, [score]: newPage }))
          }

          return (
            <div key={score} className="bg-white dark:bg-[#1f1f1f] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Score Header */}
              <div className="bg-blue-50 dark:bg-[#1f1f1f] px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-600" >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <h3 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-gray-300">
                      {score === '0' ? 'Custom Added Jobs' : `${score} Star Jobs`} - {formattedTotal}
                    </h3>
                  </div>
                  {totalCardPages > 1 && (
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        Page {currentCardPage} of {totalCardPages}
                      </span>
                      <div className="flex gap-1 sm:gap-2">
                        <button
                          onClick={() => handleCardPageChange(currentCardPage - 1)}
                          disabled={currentCardPage === 1}
                          className="px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-400 bg-white dark:bg-[#212121] border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Prev
                        </button>
                        <button
                          onClick={() => handleCardPageChange(currentCardPage + 1)}
                          disabled={currentCardPage === totalCardPages}
                          className="px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-400 bg-white dark:bg-[#212121] border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card-style layout (ClickUp style) */}
              <div className="p-2 sm:p-3 space-y-2">
                {paginatedScoreLeads.map((lead, index) => (
                  <div 
                    key={index} 
                    className="bg-white dark:bg-[#212121] rounded-lg p-2 sm:p-3 hover:shadow-md hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-all cursor-pointer"
                    onClick={() => handleViewDetails(lead)}
                  >
                    {/* Mobile: Stacked layout, Desktop: Single row */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      {/* First row on mobile: Platform + Title */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {/* Platform */}
                        <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${getPlatformColor(lead.platform)}`}>
                          {lead.platform}
                        </span>

                        {/* Title - takes remaining space */}
                        <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-300 truncate flex-1">
                          {lead.title}
                        </h4>
                      </div>

                      {/* Second row on mobile: Budget, Time, Bids/Cost */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Budget */}
                        <div className="text-xs">
                          <span className="text-gray-500 dark:text-gray-400 hidden sm:inline">Budget: </span>
                          <span className="text-gray-900 dark:text-gray-300 font-semibold">{lead.budget}</span>
                        </div>

                        {/* Posted Time */}
                        <div className="text-xs text-gray-500 dark:text-gray-400" title={lead.posted_time}>
                          {getTimeAgo(lead.posted_time)}
                        </div>

                        {/* Bids/Cost */}
                        <span className={`px-2 py-0.5 rounded text-xs font-medium border whitespace-nowrap ${getBidsCostDisplay(lead).color}`}>
                          {getBidsCostDisplay(lead).label}
                        </span>

                        {/* Status */}
                        <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>

                        {/* View button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewDetails(lead)
                          }}
                          className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors ml-auto sm:ml-0"
                        >
                          <Eye size={14} />
                          <span className="hidden sm:inline">View</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })
      ) : (
        /* Table View - Single Table with Pagination */
        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-[#212121] border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Platform</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Budget</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Connects/Bids</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Posted</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Job Score</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {paginatedLeads.map((lead, index) => (
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
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-300">{lead.budget}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${getBidsCostDisplay(lead).color}`}>
                        {getBidsCostDisplay(lead).label}
                      </span>
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
                        className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <Eye size={16} />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-400 bg-white dark:bg-[#212121] border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-400 bg-white dark:bg-[#212121] border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedLead && (
        <LeadDetailsModal
          lead={selectedLead}
          onClose={handleCloseModal}
          onApprove={handleApprove}
          onEdit={handleEdit}
          onReject={handleReject}
        />
      )}
    </div>
  )
}

export default LeadsGrouped
