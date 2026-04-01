import { useState, useEffect } from 'react'
import { ExternalLink, DollarSign, Clock, RefreshCw, AlertCircle, Search, ChevronDown, ChevronUp, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import gif from '../../assets/gif.gif'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const UpworkProjects = () => {
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState('checking')
  const [isSyncing, setIsSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedDescriptions, setExpandedDescriptions] = useState(new Set())
  const [isPageLoaded, setIsPageLoaded] = useState(false)

  useEffect(() => {
    setIsPageLoaded(true)
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/upwork/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setConnectionStatus(data.connected ? 'connected' : 'disconnected')
        if (data.connected) loadProjects()
      } else {
        setConnectionStatus('disconnected')
      }
    } catch {
      setConnectionStatus('disconnected')
    } finally {
      setIsLoading(false)
    }
  }

  const loadProjects = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/upwork/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || data || [])
      }
    } catch {
      toast.error('Failed to load Upwork projects')
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/fetch-upwork`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        toast.success('Upwork sync started')
        setTimeout(() => loadProjects(), 3000)
      } else {
        toast.error('Sync failed')
      }
    } catch {
      toast.error('Sync failed')
    } finally {
      setIsSyncing(false)
    }
  }

  const toggleDescription = (id) => {
    setExpandedDescriptions(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const filtered = projects.filter(p =>
    !searchQuery || p.title?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isPageLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <img src={gif} alt="Loading" className="w-16 h-16 object-contain" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#14a800' }}>
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Available Projects</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{filtered.length} Upwork jobs found</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button
            onClick={handleSync}
            disabled={isSyncing || connectionStatus !== 'connected'}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 transition-colors"
            style={{ backgroundColor: '#14a800' }}
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Sync'}
          </button>
        </div>
      </div>

      {/* Not connected banner */}
      {connectionStatus === 'disconnected' && (
        <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
          <AlertCircle size={18} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Upwork not connected</p>
            <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">Visit Upwork.com while the extension is active to capture your token, then refresh.</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center h-48">
          <img src={gif} alt="Loading" className="w-12 h-12 object-contain" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && connectionStatus === 'connected' && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <Zap size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No projects found</p>
          <p className="text-sm mt-1">Click Sync to fetch the latest Upwork jobs</p>
        </div>
      )}

      {/* Project cards */}
      {!isLoading && filtered.map(project => {
        const isExpanded = expandedDescriptions.has(project.id)
        const desc = project.description || project.snippet || ''
        return (
          <div key={project.id} className="bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{project.title}</h3>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {project.budget && (
                    <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                      <DollarSign size={13} />
                      {project.budget}
                    </span>
                  )}
                  {project.posted_at && (
                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                      <Clock size={12} />
                      {project.posted_at}
                    </span>
                  )}
                  {project.skills && (
                    <div className="flex gap-1 flex-wrap">
                      {(Array.isArray(project.skills) ? project.skills : project.skills.split(',')).slice(0, 4).map((s, i) => (
                        <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                          {s.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <a
                href={project.url || project.link || `https://www.upwork.com/jobs/${project.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 p-2 text-gray-400 hover:text-green-600 transition-colors"
              >
                <ExternalLink size={16} />
              </a>
            </div>

            {desc && (
              <div>
                <p className={`text-sm text-gray-600 dark:text-gray-400 ${isExpanded ? '' : 'line-clamp-2'}`}>
                  {desc}
                </p>
                {desc.length > 120 && (
                  <button
                    onClick={() => toggleDescription(project.id)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mt-1"
                  >
                    {isExpanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Show more</>}
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default UpworkProjects
