import { useState, useEffect } from 'react'
import { ExternalLink, DollarSign, Clock, Users, RefreshCw, AlertCircle, RotateCcw, User, Search, ChevronDown, ChevronUp, Star, Shield, CreditCard, Mail, Phone, UserCheck, CheckCircle, Zap, FileText, FolderOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { logError } from '../../utils/logger'
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
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/truelancer/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setConnectionStatus(data.connected ? 'connected' : 'disconnected')
      } else {
        setConnectionStatus('disconnected')
      }
    } catch {
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
      setProjects(data.projects || [])
      setLastLoadTime(Date.now())
    } catch (error) {
      logError('Failed to load Truelancer jobs', error)
      toast.error('Failed to load jobs: ' + error.message)
    } finally {
      setIsLoading(false)
    }
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
      const proposalText = data.data?.proposal || data.proposal

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
      const response = await fetch(`${API_URL}/api/leads?platform=Truelancer&limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        const leads = data.leads || []

        // Match by title (primary) or by checking if project ID/slug is in the URL
        const existingLead = leads.find(l => {
          const titleMatch = l.title === project.title
          const idInUrl = l.url && (l.url.includes(String(project.id)) || (project.slug && l.url.includes(project.slug)))
          return titleMatch || idInUrl
        })

        if (existingLead) {
          localStorage.setItem('editingLead', JSON.stringify({
            ...existingLead,
            project_id: project.id,
            Proposal: existingLead.proposal || existingLead.description
          }))
          toast.success('Proposal loaded!', { id: loadingToast })
          window.dispatchEvent(new CustomEvent('navigateToProposals'))
          return
        }
      }
      throw new Error('Could not find the generated proposal.')
    } catch (error) {
      toast.error(error.message, { id: loadingToast })
    }
  }

  const handleBidOnProject = (project) => {
    setSelectedProject(project)
    setSuggestedBidAmount(project.budget || 500)
    setShowBidModal(true)
  }

  const handlePlaceBid = async (manualAmount) => {
    if (!selectedProject) return

    const token = localStorage.getItem('token')

    let proposalText = ''
    try {
      const response = await fetch(`${API_URL}/api/leads?platform=Truelancer&limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        const existingLead = (data.leads || []).find(l => {
          const titleMatch = l.title === selectedProject.title
          const idInUrl = l.url && (l.url.includes(String(selectedProject.id)) || (selectedProject.slug && l.url.includes(selectedProject.slug)))
          return titleMatch || idInUrl
        })
        proposalText = existingLead?.proposal || existingLead?.description || 'I am interested in this project.'
      }
    } catch (e) {
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
        currency: selectedProject.currency_code || 'USD'
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
          <img src={gif} alt="Loading" className="w-16 h-16 mb-4" />
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
            const symbol = project.currency_symbol || (project.currency_code === 'INR' ? '₹' : '$')

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
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {symbol}{project.budget}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${project.jobtype == 3 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'}`}>
                            {project.jobtype == 3 ? 'Hourly' : 'Fixed'}
                          </span>
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
                          disabled={isProcessing}
                          className={`px-4 py-2 text-white rounded-lg transition-colors ${isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                          {isProcessing ? 'Processing...' : 'Generate Bid'}
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
          budget: `${selectedProject.currency_symbol || '$'}${selectedProject.budget}`,
          url: selectedProject.link || `https://www.truelancer.com/freelance-project/${selectedProject.slug}`
        } : null}
        suggestedAmount={suggestedBidAmount}
      />
    </div>
  )
}

export default TruelancerJobs
