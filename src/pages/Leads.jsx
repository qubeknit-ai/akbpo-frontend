import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Filters from '../components/Filters'
import LeadsGrouped from '../components/LeadsGrouped'
import { logError, logWarn } from '../utils/logger'
import { useQuery, useQueryClient } from '@tanstack/react-query'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const Leads = ({ refreshTrigger = 0 }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  // Fetch leads with React Query and pagination
  const { data: leadsResponse, isLoading, error } = useQuery({
    queryKey: ['leads', page, selectedPlatform, selectedStatus],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No token')
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50'
      })
      
      if (selectedPlatform) params.append('platform', selectedPlatform)
      if (selectedStatus) params.append('status', selectedStatus)
      
      const response = await fetch(`${API_URL}/api/leads?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error('Failed to fetch leads')
      return response.json()
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!localStorage.getItem('token')
  })

  const leadsData = leadsResponse?.leads || []

  useEffect(() => {
    // Invalidate queries when refresh is triggered
    if (refreshTrigger > 0) {
      queryClient.invalidateQueries(['leads'])
    }
  }, [refreshTrigger, queryClient])

  useEffect(() => {
    // Check if we should refresh leads when returning from Proposals page
    const shouldRefresh = localStorage.getItem('shouldRefreshLeads')
    if (shouldRefresh === 'true') {
      localStorage.removeItem('shouldRefreshLeads')
      queryClient.invalidateQueries(['leads'])
    }
  }, [queryClient])

  useEffect(() => {
    if (error) {
      logError('Error fetching leads', error)
      toast.error('Failed to load leads')
    }
  }, [error])

  // Get unique platforms and statuses
  const platforms = [...new Set(leadsData.map(lead => lead.platform).filter(Boolean))]
  const statuses = [...new Set(leadsData.map(lead => lead.status).filter(Boolean))]
  
  // Handle lead updates
  const handleLeadUpdate = () => {
    queryClient.invalidateQueries(['leads'])
  }

  const filteredLeads = leadsData.filter(lead => {
    // Search filter
    const matchesSearch = !searchTerm || 
      lead.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.platform?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Platform filter
    const matchesPlatform = !selectedPlatform || lead.platform === selectedPlatform
    
    // Status filter
    const matchesStatus = !selectedStatus || lead.status === selectedStatus
    
    // Time filter - only show leads posted within last 24 hours
    const now = new Date().getTime()
    const postedTime = lead.posted_time ? new Date(lead.posted_time).getTime() : 0
    const hoursDiff = (now - postedTime) / (1000 * 60 * 60)
    const isWithin24Hours = postedTime === 0 || hoursDiff <= 24
    
    return matchesSearch && matchesPlatform && matchesStatus && isWithin24Hours
  }).sort((a, b) => {
    // Apply sorting based on sortBy value
    if (sortBy === 'bids-low' || sortBy === 'bids-high') {
      // When sorting by Bids, put Freelancer jobs first, Upwork jobs last
      const aHasBids = a.platform !== 'Upwork' && (a.bids || 0) > 0
      const bHasBids = b.platform !== 'Upwork' && (b.bids || 0) > 0
      
      if (aHasBids && !bHasBids) return -1
      if (!aHasBids && bHasBids) return 1
      
      // Both have bids or both don't, sort by bids value
      if (sortBy === 'bids-low') {
        return (a.bids || 0) - (b.bids || 0)
      } else {
        return (b.bids || 0) - (a.bids || 0)
      }
    } else if (sortBy === 'connects-low' || sortBy === 'connects-high') {
      // When sorting by Connects, put Upwork jobs first, Freelancer jobs last
      const aHasConnects = a.platform === 'Upwork' && (a.cost || 0) > 0
      const bHasConnects = b.platform === 'Upwork' && (b.cost || 0) > 0
      
      if (aHasConnects && !bHasConnects) return -1
      if (!aHasConnects && bHasConnects) return 1
      
      // Both have connects or both don't, sort by connects value
      if (sortBy === 'connects-low') {
        return (a.cost || 0) - (b.cost || 0)
      } else {
        return (b.cost || 0) - (a.cost || 0)
      }
    } else {
      // Default: Sort by posted_time, newest first
      const timeA = a.posted_time ? new Date(a.posted_time).getTime() : 0
      const timeB = b.posted_time ? new Date(b.posted_time).getTime() : 0
      return timeB - timeA
    }
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8  min-h-full">
      <Filters 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm}
        selectedPlatform={selectedPlatform}
        setSelectedPlatform={setSelectedPlatform}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        sortBy={sortBy}
        setSortBy={setSortBy}
        platforms={platforms}
        statuses={statuses}
      />

      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-300">
          Job Leads ({filteredLeads.length})
        </h2>
      </div>

      <LeadsGrouped
        leads={filteredLeads}
        isLoading={isLoading}
        onLeadUpdate={handleLeadUpdate}
      />
      

    </div>
  )
}

export default Leads
