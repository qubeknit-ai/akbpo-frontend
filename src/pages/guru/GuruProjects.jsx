import { useState, useEffect } from 'react'
import { ExternalLink, DollarSign, Clock, Users, RefreshCw, AlertCircle, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { logError } from '../../utils/logger'
import BidModal from '../../modals/BidModal'
import gif from '../../assets/gif.gif'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const GURU_COLOR = '#f47c20'

const GuruProjects = () => {
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
    const saved = getGeneratedProposalsCookie()
    setGeneratedProposals(saved)
    checkConnection()
  }, [])

  useEffect(() => {
    if (connectionStatus === 'connected') loadProjects()
  }, [connectionStatus])

  const getGeneratedProposalsCookie = () => {
    try {
      const cookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('guru_generatedProposals='))
      if (cookie) {
        const value = cookie.split('=')[1]
        return new Set(JSON.parse(decodeURIComponent(value)))
      }
    } catch {}
    return new Set()
  }

  const setGeneratedProposalsCookie = (ids) => {
    try {
      const value = encodeURIComponent(JSON.stringify([...ids]))
      const expiry = new Date()
      expiry.setDate(expiry.getDate() + 30)
      document.cookie = `guru_generatedProposals=${value}; expires=${expiry.toUTCString()}; path=/; SameSite=Lax`
    } catch {}
  }

  const addGeneratedProposal = (id) => {
    setGeneratedProposals(prev => {
      const updated = new Set([...prev, id.toString()])
      setGeneratedProposalsCookie(updated)
      return updated
    })
  }

  const checkConnection = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/guru/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
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
    if (!force && lastLoadTime && Date.now() - lastLoadTime < 30000) return

    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/guru/recommended-jobs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error(`Failed to load jobs: ${res.status}`)
      const data = await res.json()
      setProjects(data.projects || [])
      setLastLoadTime(Date.now())
    } catch (error) {
      logError('Failed to load Guru jobs', error)
      toast.error('Failed to load jobs: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateBid = async (project) => {
    const pid = project.id.toString()
    setProcessingProposals(prev => new Set([...prev, pid]))
    const loadingToast = toast.loading('Generating AI proposal...')
    try {
      const token = localStorage.getItem('token')
      const genRes = await fetch(`${API_URL}/api/guru/generate-proposal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          id: project.id,
          title: project.title,
          description: project.description,
          url: project.url,
          budget: { amount: project.budget, currency: 'USD' },
          skills: project.skills || []
        })
      })
      if (!genRes.ok) throw new Error('Failed to generate AI proposal')
      const data = await genRes.json()

      let proposalText = ''
      if (Array.isArray(data)) proposalText = data[0]?.proposal || data[0]?.Proposal || ''
      else if (data.data) proposalText = data.data.proposal || data.data.Proposal || ''
      else proposalText = data.proposal || data.Proposal || ''

      // Save as lead
      await fetch(`${API_URL}/api/leads/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          leads: [{
            platform: 'Guru',
            title: project.title,
            budget: project.budget_str || String(project.budget),
            posted: 'Recently',
            posted_time: new Date().toISOString(),
            status: 'AI Drafted',
            score: '8',
            description: project.description,
            proposal: proposalText,
            url: project.url,
            project_id: project.id,
            project_type: project.job_type || 'Fixed'
          }]
        })
      })

      addGeneratedProposal(project.id)
      toast.success('Proposal generated!', { id: loadingToast })
    } catch (error) {
      logError('Guru generation failed', error)
      toast.error(error.message, { id: loadingToast })
    } finally {
      setProcessingProposals(prev => { const n = new Set(prev); n.delete(pid); return n })
    }
  }

  const handleViewProposal = async (project) => {
    const loadingToast = toast.loading('Loading proposal...')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/leads?platform=Guru&limit=500`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        const lead = (data.leads || []).find(l => {
          if (!l.url || !project.url) return false
          const clean = u => u.replace(/^https?:\/\/(www\.)?/, '').toLowerCase().trim()
          return clean(l.url).includes(clean(project.url)) || clean(project.url).includes(clean(l.url))
        })
        if (lead) {
          localStorage.setItem('editingLead', JSON.stringify({ ...lead, project_id: project.id }))
          toast.success('Proposal loaded!', { id: loadingToast })
          window.dispatchEvent(new CustomEvent('navigateToProposals'))
          return
        }
      }
      toast.error('Proposal not found', { id: loadingToast })
    } catch (error) {
      toast.error(error.message, { id: loadingToast })
    }
  }

  const handleBidOnProject = (project) => {
    setSelectedProject(project)
    // Don't suggest an amount for "Not Sure" jobs
    const suggested = (typeof project.budget === 'number' && project.budget > 0) 
      ? project.budget 
      : 0
    setSuggestedBidAmount(suggested)
    setShowBidModal(true)
  }

  const handlePlaceBid = async (manualAmount) => {
    if (!selectedProject) return
    const token = localStorage.getItem('token')
    let proposalText = ''
    try {
      const res = await fetch(`${API_URL}/api/leads?platform=Guru&limit=500`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        const lead = (data.leads || []).find(l => {
          if (!l.url || !selectedProject.url) return false
          const clean = u => u.replace(/^https?:\/\/(www\.)?/, '').toLowerCase().trim()
          return clean(l.url).includes(clean(selectedProject.url)) || clean(selectedProject.url).includes(clean(l.url))
        })
        proposalText = lead?.proposal || lead?.description || ''
      }
    } catch {}
    if (!proposalText || proposalText.length < 50) {
      proposalText = `I am very interested in your project: "${selectedProject.title}". I have the relevant skills and experience to deliver high-quality results. I would welcome the opportunity to discuss your requirements in detail.`
    }

    const bidRes = await fetch(`${API_URL}/api/guru/bid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        project_id: selectedProject.id,
        project_title: selectedProject.title,
        project_url: selectedProject.url,
        amount: manualAmount,
        description: proposalText,
      })
    })
    const result = await bidRes.json()
    if (!result.success) throw new Error(result.error || 'Failed to place bid')
  }

  const toggleDescription = (id) => {
    setExpandedDescriptions(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (connectionStatus === 'disconnected') {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-[60vh] text-center">
        <AlertCircle size={48} className="text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Guru Not Connected</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md">
          Please visit guru.com while the extension is active to connect your account.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">Live jobs from Guru.com</p>
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
          <p className="text-gray-500 animate-pulse">Fetching Guru jobs...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-2xl p-12 text-center">
          <p className="text-gray-500">No jobs found. Try refreshing or check your Guru connection.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => {
            const pid = project.id.toString()
            const isExpanded = expandedDescriptions.has(project.id)
            const isProcessing = processingProposals.has(pid)
            const isGenerated = generatedProposals.has(pid)

            return (
              <div key={project.id} className="bg-white dark:bg-[#1f1f1f] rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex gap-6">
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
                          className="flex items-center gap-1 text-sm font-medium transition-colors"
                          style={{ color: GURU_COLOR }}
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
                            {project.budget_str || `$${project.budget}`}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            String(project.job_type || '').toLowerCase().includes('hour')
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                          }`}>
                            {project.job_type || 'Fixed'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Quotes</p>
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
                          {project.posted_at ? (
                            (() => {
                              const d = new Date(isNaN(project.posted_at) ? project.posted_at : Number(project.posted_at));
                              return isNaN(d.getTime()) ? 'Recently' : d.toLocaleDateString();
                            })()
                          ) : 'Recently'}
                        </span>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
                            {project.status || 'Open'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {project.skills && project.skills.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {project.skills.slice(0, 8).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 text-xs rounded-full"
                            style={{ backgroundColor: '#fff7f0', color: GURU_COLOR, border: '1px solid #fcd9b5' }}
                          >
                            {typeof skill === 'string' ? skill : skill.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex flex-col gap-2">
                        {project.employer_name && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Posted by {project.employer_name}
                          </span>
                        )}
                        <a
                          href={project.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm transition-colors"
                          style={{ color: GURU_COLOR }}
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
                            className="px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: GURU_COLOR }}
                          >
                            Bid
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleGenerateBid(project)}
                          disabled={isProcessing}
                          className="px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          style={isProcessing ? { backgroundColor: '#9ca3af' } : { backgroundColor: GURU_COLOR }}
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

      <BidModal
        isOpen={showBidModal}
        onClose={() => { setShowBidModal(false); setSelectedProject(null) }}
        onPlaceBid={handlePlaceBid}
        lead={selectedProject ? {
          ...selectedProject,
          platform: 'Guru',
          budget: selectedProject.budget_str || String(selectedProject.budget),
          url: selectedProject.url,
        } : null}
        suggestedAmount={suggestedBidAmount}
      />
    </div>
  )
}

export default GuruProjects
