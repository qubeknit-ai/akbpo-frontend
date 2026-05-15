import { useState, useEffect } from 'react'
import { ExternalLink, DollarSign, Clock, Users, RefreshCw, AlertCircle, RotateCcw, User, Search, ChevronDown, ChevronUp, Star, Shield, CreditCard, Mail, Phone, UserCheck, CheckCircle, Zap, FileText, FolderOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { logError } from '../../utils/logger'
import { apiCache, invalidateCache } from '../../utils/apiUtils'
import BidModal from '../../modals/BidModal'
import gif from '../../assets/gif.gif'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const TruelancerJobs = () => {
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState('checking')
  const [lastLoadTime, setLastLoadTime] = useState(null)
  const [generatedProposals, setGeneratedProposals] = useState(new Set())
  const [processingProposals, setProcessingProposals] = useState(new Set())
  const [expandedDescriptions, setExpandedDescriptions] = useState(new Set())
  const [showBidModal, setShowBidModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [suggestedBidAmount, setSuggestedBidAmount] = useState(0)
  const [enrichedData, setEnrichedData] = useState({}) // { projectId: { native_budget, native_currency } }
  const [isEnriching, setIsEnriching] = useState(false)
  const [currentlyEnrichingId, setCurrentlyEnrichingId] = useState(null)

  useEffect(() => {
    // Load generated proposals from cookies
    const savedProposals = getGeneratedProposalsCookie()
    setGeneratedProposals(savedProposals)

    checkConnection()
  }, [])

  useEffect(() => {
    if (connectionStatus === 'connected') {
      loadProjects()
    }
  }, [connectionStatus])

  const getGeneratedProposalsCookie = () => {
    try {
      const cookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('truelancer_generatedProposals='))
      if (cookie) {
        const value = cookie.split('=')[1]
        const decoded = JSON.parse(decodeURIComponent(value))
        return new Set(decoded)
      }
    } catch (error) {
      console.error('Error reading generated proposals cookie:', error)
    }
    return new Set()
  }

  const setGeneratedProposalsCookie = (proposalIds) => {
    try {
      const value = encodeURIComponent(JSON.stringify([...proposalIds]))
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + 30)
      document.cookie = `truelancer_generatedProposals=${value}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`
    } catch (error) {
      console.error('Error setting generated proposals cookie:', error)
    }
  }

  const addGeneratedProposal = (projectId) => {
    setGeneratedProposals(prev => {
      const updatedSet = new Set([...prev, projectId.toString()])
      setGeneratedProposalsCookie(updatedSet)
      return updatedSet
    })
  }

  const checkConnection = async () => {
    // Served from localStorage cache (5 min TTL) — no network on reload
    const data = await apiCache.fetchTruelancerStatus()
    if (data !== null) {
      const status = data.connected ? 'connected' : 'disconnected'
      setConnectionStatus(status)
    } else {
      setConnectionStatus('disconnected')
    }
  }


  const loadProjects = async (force = false) => {
    if (connectionStatus !== 'connected') return

    if (!force && lastLoadTime) {
      const timeSinceLoad = Date.now() - lastLoadTime
      if (timeSinceLoad < 30000) return
    }

    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/truelancer/recommended-jobs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to load jobs: ${response.status}`)
      }

      const data = await response.json()
      console.log("📡 [TRUELANCER] Recommended Jobs API Data:", data)
      if (data.projects && data.projects.length > 0) {
        console.log("🔍 [TRUELANCER] First Project Full Object:", data.projects[0])
        console.log("💰 [TRUELANCER] Budget Fields:", {
          budget: data.projects[0].budget,
          currency: data.projects[0].currency,
          currency_code: data.projects[0].currency_code,
          currency_symbol: data.projects[0].currency_symbol,
          job_currency: data.projects[0].job_currency,
          native_currency: data.projects[0].native_currency
        })
      }
      setProjects(data.projects || [])
      setLastLoadTime(Date.now())
      
      // Start enriching projects one by one
      if (data.projects && data.projects.length > 0) {
        enrichProjectsSequentially(data.projects)
      }
    } catch (error) {
      logError('Failed to load Truelancer jobs', error)
      toast.error('Failed to load jobs: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const enrichProjectsSequentially = async (projectList) => {
    setIsEnriching(true)
    const token = localStorage.getItem('token')
    
    for (const project of projectList) {
      setCurrentlyEnrichingId(project.id)
      try {
        const response = await fetch(`${API_URL}/api/truelancer/project-native-budget?id=${project.id}&slug=${project.slug}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setEnrichedData(prev => ({
              ...prev,
              [project.id]: {
                budget: data.native_budget,
                currency: data.native_currency
              }
            }))
          }
        }
      } catch (e) {
        console.error(`Failed to enrich project ${project.id}:`, e)
      }
      setCurrentlyEnrichingId(null)
      // Small delay to prevent hammering
      await new Promise(r => setTimeout(r, 500))
    }
    setIsEnriching(false)
  }

  const handleGenerateBid = async (project) => {
    const projectId = project.id
    setProcessingProposals(prev => new Set([...prev, projectId.toString()]))

    const loadingToast = toast.loading('Generating AI proposal...')

    try {
      const token = localStorage.getItem('token')

      const genResponse = await fetch(`${API_URL}/api/truelancer/generate-proposal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: project.id,
          title: project.title,
          description: project.description,
          url: project.link || `https://www.truelancer.com/freelance-project/${project.slug}`,
          budget: {
            amount: project.budget,
            currency: project.currency_symbol || project.currency_code || 'USD'
          },
          skills: project.skills || []
        })
      })

      if (!genResponse.ok) {
        throw new Error('Failed to generate AI proposal')
      }

      const data = await genResponse.json()

      // Handle both object and array responses from n8n
      let proposalText = ''
      if (Array.isArray(data)) {
        proposalText = data[0]?.proposal || data[0]?.Proposal || ''
      } else if (data.data) {
        proposalText = data.data.proposal || data.data.Proposal || ''
      } else {
        proposalText = data.proposal || data.Proposal || ''
      }

      if (!proposalText) {
        console.warn('⚠️ No proposal text found in AI response:', data)
      }

      // Create a lead entry in the database
      const leadData = {
        platform: 'Truelancer',
        title: project.title,
        budget: `${project.currency_symbol || '$'}${project.budget}`,
        posted: 'Recently',
        posted_time: new Date().toISOString(),
        status: 'AI Drafted',
        score: '8',
        description: project.description,
        proposal: proposalText,
        url: project.link || `https://www.truelancer.com/freelance-project/${project.slug}`,
        project_id: project.id,
        project_type: project.jobtype == 3 ? 'Hourly' : 'Fixed'
      }

      await fetch(`${API_URL}/api/leads/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ leads: [leadData] })
      })

      addGeneratedProposal(project.id)
      toast.success('Proposal generated successfully!', { id: loadingToast })
    } catch (error) {
      logError('Truelancer generation failed', error)
      toast.error(error.message, { id: loadingToast })
    } finally {
      setProcessingProposals(prev => {
        const next = new Set(prev)
        next.delete(projectId.toString())
        return next
      })
    }
  }

  const handleViewProposal = async (project) => {
    const loadingToast = toast.loading('Loading proposal...')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/leads?platform=Truelancer&limit=500`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      let existingLead = null;
      // Get all possible URL variations from the project object
      const possibleUrls = [
        project.link,
        project.url,
        project.slug ? `https://www.truelancer.com/freelance-project/${project.slug}` : null,
        project.slug ? `https://truelancer.com/freelance-project/${project.slug}` : null
      ].filter(Boolean)

      if (response.ok) {
        const data = await response.json()
        const leads = data.leads || []

        // Clean all possible project URLs for comparison
        const cleanProjectUrls = possibleUrls.map(u => u.replace(/^https?:\/\/(www\.)?/, '').toLowerCase().trim())

        // Match primarily by URL
        existingLead = leads.find(l => {
          if (!l.url) return false
          const cleanLUrl = l.url.replace(/^https?:\/\/(www\.)?/, '').toLowerCase().trim()

          // Check if any variation of the project URL matches the lead URL
          return cleanProjectUrls.some(cleanPUrl =>
            cleanLUrl === cleanPUrl ||
            cleanLUrl.includes(cleanPUrl) ||
            cleanPUrl.includes(cleanLUrl)
          )
        })

        if (existingLead) {
          console.log('✅ [VIEW] Found Match in DB:', existingLead.url || existingLead.title)
          localStorage.setItem('editingLead', JSON.stringify({
            ...existingLead,
            project_id: project.id,
            proposal: existingLead.proposal || existingLead.Proposal || existingLead.description,
            Proposal: existingLead.proposal || existingLead.Proposal || existingLead.description // Backward compatibility
          }))
          toast.success('Proposal loaded!', { id: loadingToast })
          window.dispatchEvent(new CustomEvent('navigateToProposals'))
          return
        }
      }

      // FALLBACK: If no existing lead found, create a new lead data structure (mirroring Freelancer pattern)
      console.log('⚠️ [VIEW] No existing lead found in DB, creating fallback lead data for project:', project.id)

      const leadData = {
        id: project.id,
        project_id: project.id,
        platform: 'Truelancer',
        title: project.title || 'UNTITLED_PROJECT',
        description: project.description || 'NO_DESCRIPTION_AVAILABLE',
        budget: `${project.currency_symbol || '$'}${project.budget}`,
        posted: project.created_at ? new Date(project.created_at).toLocaleDateString() : 'Recently',
        posted_time: project.created_at || new Date().toISOString(),
        status: 'AI Drafted',
        score: '8',
        url: projectUrl,
        proposal: 'Proposal will be generated when you open the Proposals page...',
        Proposal: 'Proposal will be generated when you open the Proposals page...', // Placeholder
        project_type: project.jobtype == 3 ? 'Hourly' : 'Fixed'
      }

      localStorage.setItem('editingLead', JSON.stringify(leadData))
      toast.success('Opening proposal editor...', { id: loadingToast })
      window.dispatchEvent(new CustomEvent('navigateToProposals'))

    } catch (error) {
      toast.error(error.message, { id: loadingToast })
    }
  }

  const handleBidOnProject = (project) => {
    const enriched = enrichedData[project.id]
    setSelectedProject(project)
    setSuggestedBidAmount(enriched ? enriched.budget : (project.budget || 500))
    setShowBidModal(true)
  }

  const handlePlaceBid = async (manualAmount) => {
    if (!selectedProject) return

    const token = localStorage.getItem('token')

    let proposalText = ''
    try {
      const response = await fetch(`${API_URL}/api/leads?platform=Truelancer&limit=500`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()

        // Get all possible URL variations from the project object
        const possibleUrls = [
          selectedProject.link,
          selectedProject.url,
          selectedProject.slug ? `https://www.truelancer.com/freelance-project/${selectedProject.slug}` : null,
          selectedProject.slug ? `https://truelancer.com/freelance-project/${selectedProject.slug}` : null
        ].filter(Boolean)

        const cleanProjectUrls = possibleUrls.map(u => u.replace(/^https?:\/\/(www\.)?/, '').toLowerCase().trim())

        const existingLead = (data.leads || []).find(l => {
          if (!l.url) return false
          const cleanLUrl = l.url.replace(/^https?:\/\/(www\.)?/, '').toLowerCase().trim()

          return cleanProjectUrls.some(cleanPUrl =>
            cleanLUrl === cleanPUrl ||
            cleanLUrl.includes(cleanPUrl) ||
            cleanPUrl.includes(cleanLUrl)
          )
        })

        proposalText = existingLead?.proposal || existingLead?.Proposal || existingLead?.description

        if (!proposalText || proposalText.length < 100) {
          console.log('⚠️ [BID] No valid proposal text found in DB, using professional fallback');
          proposalText = `I am very interested in your project: "${selectedProject.title}". I have the relevant skills and experience to deliver high-quality results for you. I would welcome the opportunity to discuss your requirements in more detail and demonstrate how I can help you achieve your goals successfully. Thank you for your consideration.`
        }
      }
    } catch (e) {
      console.log('❌ [BID] Error fetching proposal from DB, using default');
      proposalText = 'I am interested in this project.'
    }

    const bidResponse = await fetch(`${API_URL}/api/truelancer/bid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        project_id: selectedProject.id,
        project_title: selectedProject.title,
        project_url: selectedProject.link || `https://www.truelancer.com/freelance-project/${selectedProject.slug}`,
        amount: manualAmount,
        description: proposalText,
        currency: selectedProject.currency || selectedProject.currency_code || 'USD'
      })
    })

    const result = await bidResponse.json()
    if (!result.success) {
      throw new Error(result.error || 'Failed to place bid')
    }
  }

  const toggleDescription = (id) => {
    setExpandedDescriptions(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (connectionStatus === 'disconnected') {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-[60vh] text-center">
        <AlertCircle size={48} className="text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Truelancer Not Connected</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md">
          Please connect your Truelancer account in the settings to view recommended jobs.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Personalized opportunities based on your skills</p>
          </div>
        </div>
        <button
          onClick={() => loadProjects(true)}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <img src={gif} alt="Loading" className="w-12 h-12 mb-4" />
          <p className="text-gray-500 animate-pulse">Scanning for recommended jobs...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-2xl p-12 text-center">
          <p className="text-gray-500">No recommended jobs found. Try refreshing or updating your skills on Truelancer.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => {
            const isExpanded = expandedDescriptions.has(project.id)
            const isProcessing = processingProposals.has(project.id.toString())
            const isGenerated = generatedProposals.has(project.id.toString())
            // Prioritize USD symbol if currency is USD, even if native code is INR
            const symbol = project.currency === 'USD' ? '$' : (project.currency_symbol || (project.currency_code === 'INR' ? '₹' : '$'))

            return (
              <div key={project.id} className="bg-white dark:bg-[#1f1f1f] rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex gap-6">
                  {/* Main Content - 3/4 width */}
                  <div className="flex-1">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {project.title}
                      </h3>
                      <div>
                        <p
                          className="text-gray-600 dark:text-gray-400 mb-2 whitespace-pre-wrap text-sm leading-relaxed"
                          style={!isExpanded ? {
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          } : {}}
                        >
                          {project.description}
                        </p>
                        <button
                          onClick={() => toggleDescription(project.id)}
                          className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium transition-colors"
                        >
                          {isExpanded ? <><ChevronUp size={16} /> Show less</> : <><ChevronDown size={16} /> Show more</>}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Budget</p>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {symbol}{project.budget}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${project.jobtype == 3 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'}`}>
                              {project.jobtype == 3 ? 'Hourly' : 'Fixed'}
                            </span>
                          </div>
                          {enrichedData[project.id] ? (
                            <div className="text-xs font-bold text-orange-600 dark:text-orange-400 mt-1">
                              Real: {enrichedData[project.id].currency} {enrichedData[project.id].budget}
                            </div>
                          ) : isEnriching ? (
                            <div className="text-[10px] text-gray-400 animate-pulse mt-1">Fetching real currency...</div>
                          ) : null}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Proposals</p>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {project.total_proposals || 0}
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Posted</p>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'Recently'}
                        </span>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                        <div className="flex items-center gap-1">
                          <CheckCircle className={`w-4 h-4 ${project.status == 2 ? 'text-green-500' : 'text-gray-400'}`} />
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {project.status == 2 ? 'Active' : 'Closed'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {project.skills && project.skills.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {project.skills.slice(0, 8).map((skill, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                              {typeof skill === 'string' ? skill : skill.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex flex-col gap-2">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {project.fname && <span>Posted by {project.fname} {project.lname}</span>}
                        </div>
                        <a
                          href={project.link || `https://www.truelancer.com/freelance-project/${project.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Project
                        </a>
                      </div>

                      {isGenerated ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewProposal(project)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleBidOnProject(project)}
                            disabled={isProcessing}
                            className={`px-4 py-2 text-white rounded-lg transition-colors ${isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                          >
                            Bid
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleGenerateBid(project)}
                          disabled={isProcessing || !enrichedData[project.id]}
                          className={`px-4 py-2 text-white rounded-lg transition-colors ${
                            (isProcessing || !enrichedData[project.id]) 
                              ? 'bg-gray-400 cursor-not-allowed' 
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          {isProcessing ? 'Processing...' : 
                           currentlyEnrichingId === project.id ? 'Fetching...' :
                           enrichedData[project.id] ? 'Generate Bid' : 'Waiting...'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Bid Modal */}
      <BidModal
        isOpen={showBidModal}
        onClose={() => {
          setShowBidModal(false)
          setSelectedProject(null)
        }}
        onPlaceBid={handlePlaceBid}
        lead={selectedProject ? {
          ...selectedProject,
          platform: 'Truelancer',
          budget: enrichedData[selectedProject.id] 
            ? `${enrichedData[selectedProject.id].currency}${enrichedData[selectedProject.id].budget}`
            : `${selectedProject.currency === 'USD' ? '$' : (selectedProject.currency_symbol || (selectedProject.currency_code === 'INR' ? '₹' : '$'))}${selectedProject.budget}`,
          url: selectedProject.link || `https://www.truelancer.com/freelance-project/${selectedProject.slug}`,
          // Pass native info for modal to use
          native_currency: enrichedData[selectedProject.id]?.currency,
          native_budget: enrichedData[selectedProject.id]?.budget
        } : null}
        suggestedAmount={suggestedBidAmount}
      />
    </div>
  )
}

export default TruelancerJobs
