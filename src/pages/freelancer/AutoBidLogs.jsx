import { useState, useEffect } from 'react'
import { FileText, RefreshCw, AlertCircle, CheckCircle, ExternalLink, Clock, XCircle, DollarSign, Hourglass, Play, Square, Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const AutoBidLogs = () => {
    const [logs, setLogs] = useState(() => {
        try {
            const cached = localStorage.getItem('autoBidLogs')
            if (cached) {
                return JSON.parse(cached)
            }
        } catch (error) {
            console.error('Error loading cached logs:', error)
        }
        return []
    })
    const [isLoading, setIsLoading] = useState(true)
    const [isPageLoaded, setIsPageLoaded] = useState(false)
    const [currentPage, setCurrentPage] = useState(() => {
        try {
            const cached = localStorage.getItem('autoBidLogsPage')
            if (cached) {
                return parseInt(cached)
            }
        } catch (error) {
            console.error('Error loading cached page:', error)
        }
        return 1
    })
    const [totalPages, setTotalPages] = useState(() => {
        try {
            const cached = localStorage.getItem('autoBidLogsTotalPages')
            if (cached) {
                return parseInt(cached)
            }
        } catch (error) {
            console.error('Error loading cached total pages:', error)
        }
        return 1
    })
    const [totalLogs, setTotalLogs] = useState(() => {
        try {
            const cached = localStorage.getItem('autoBidLogsTotalLogs')
            if (cached) {
                return parseInt(cached)
            }
        } catch (error) {
            console.error('Error loading cached total logs:', error)
        }
        return 0
    })
    const logsPerPage = 10
    const [stats, setStats] = useState(() => {
        try {
            const cached = localStorage.getItem('autoBidStats')
            if (cached) {
                return JSON.parse(cached)
            }
        } catch (error) {
            console.error('Error loading cached stats:', error)
        }
        return {
            bids_today: 0,
            bids_week: 0,
            success_week: 0,
            failed_week: 0,
            bid_amount_today: 0,
            bid_amount_week: 0,
            is_running: false
        }
    })
    const [isToggling, setIsToggling] = useState(false)
    const [isLoadingStats, setIsLoadingStats] = useState(true)

    useEffect(() => {
        const initializePage = async () => {
            // Show page immediately with cached data
            setIsPageLoaded(true)
            
            // Then fetch fresh data from database
            await Promise.all([
                fetchLogs(currentPage),
                fetchStats()
            ])
        }
        
        initializePage()
        
        // Only set up polling if this is the active tab
        let interval = null
        
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // Tab is hidden, clear interval
                if (interval) {
                    clearInterval(interval)
                    interval = null
                }
            } else {
                // Tab is visible, start polling if not already running
                if (!interval) {
                    interval = setInterval(() => {
                        fetchLogs(currentPage)
                        fetchStats()
                    }, 30000)
                }
            }
        }
        
        // Start polling after initial load
        setTimeout(() => {
            interval = setInterval(() => {
                fetchLogs(currentPage)
                fetchStats()
            }, 30000)
        }, 2000) // Wait 2 seconds after initial load
        
        // Listen for tab visibility changes
        document.addEventListener('visibilitychange', handleVisibilityChange)
        
        return () => {
            if (interval) clearInterval(interval)
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [])

    const saveToCaches = (data) => {
        try {
            if (data.logs !== undefined) {
                localStorage.setItem('autoBidLogs', JSON.stringify(data.logs))
            }
            if (data.currentPage !== undefined) {
                localStorage.setItem('autoBidLogsPage', data.currentPage.toString())
            }
            if (data.totalPages !== undefined) {
                localStorage.setItem('autoBidLogsTotalPages', data.totalPages.toString())
            }
            if (data.totalLogs !== undefined) {
                localStorage.setItem('autoBidLogsTotalLogs', data.totalLogs.toString())
            }
            if (data.stats !== undefined) {
                localStorage.setItem('autoBidStats', JSON.stringify(data.stats))
            }
        } catch (error) {
            console.error('Error saving to cache:', error)
        }
    }

    const fetchLogs = async (page = 1) => {
        try {
            const token = localStorage.getItem('token')
            const offset = (page - 1) * logsPerPage
            const response = await fetch(`${API_URL}/api/autobid/history?limit=${logsPerPage}&offset=${offset}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (response.ok) {
                const data = await response.json()
                const newLogs = data.history || []
                const newTotalLogs = data.total || 0
                const newTotalPages = Math.ceil(newTotalLogs / logsPerPage)
                
                setLogs(newLogs)
                setTotalLogs(newTotalLogs)
                setTotalPages(newTotalPages)
                setCurrentPage(page)
                
                // Save to cache
                saveToCaches({
                    logs: newLogs,
                    currentPage: page,
                    totalPages: newTotalPages,
                    totalLogs: newTotalLogs
                })
            }
        } catch (error) {
            console.error('Failed to fetch logs', error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`${API_URL}/api/autobid/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (response.ok) {
                const data = await response.json()
                setStats(data)
                
                // Save to cache
                saveToCaches({ stats: data })
            }
        } catch (error) {
            console.error('Failed to fetch stats', error)
        } finally {
            setIsLoadingStats(false)
        }
    }

    const toggleAutoBidder = async () => {
        setIsToggling(true)
        try {
            const token = localStorage.getItem('token')
            const action = stats.is_running ? 'stop' : 'start'

            const response = await fetch(`${API_URL}/api/autobid/${action}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (response.ok) {
                const result = await response.json()
                
                // Wait for database confirmation before updating UI
                if (result.success) {
                    const newStats = { ...stats, is_running: action === 'start' }
                    setStats(newStats)
                    
                    // Save to cache
                    saveToCaches({ stats: newStats })
                    
                    toast.success(`Auto-bidder ${action === 'start' ? 'started' : 'stopped'} successfully`)
                    
                    // Reload stats to get updated data from database
                    await fetchStats()
                } else {
                    throw new Error(result.message || 'Failed to toggle')
                }
            } else {
                const errorData = await response.json()
                throw new Error(errorData.detail || 'Failed to toggle')
            }
        } catch (error) {
            console.error('Toggle error:', error)
            toast.error(`Failed to ${stats.is_running ? 'stop' : 'start'} auto-bidder: ${error.message}`)
        } finally {
            setIsToggling(false)
        }
    }

    // Helper from FreelancerBids.jsx (adapted)
    const formatFullTime = (timestamp) => {
        if (!timestamp) return '-'
        return new Date(timestamp).toLocaleString()
    }

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'success':
            case 'accepted':
            case 'awarded':
                return <CheckCircle className="w-4 h-4 text-green-500" />
            case 'failed':
            case 'rejected':
            case 'declined':
                return <XCircle className="w-4 h-4 text-red-500" />
            case 'pending':
            case 'active':
            default:
                return <Hourglass className="w-4 h-4 text-yellow-500" />
        }
    }

    const getStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'success':
            case 'accepted':
            case 'awarded':
                return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
            case 'failed':
            case 'rejected':
            case 'declined':
                return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
            case 'pending':
            case 'active':
            default:
                return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300'
        }
    }

    return (
        <div className="p-6 space-y-6">
            {/* Loading overlay */}
            {!isPageLoaded && (
                <div className="fixed inset-0 bg-white dark:bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="flex flex-col items-center gap-4">
                        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                        <p className="text-gray-600 dark:text-gray-400">Loading auto-bid data...</p>
                    </div>
                </div>
            )}
        

            {/* Auto-Bid Stats Section */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Auto-Bid Stats</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Side - Stats Cards (2x3 Grid) */}
                    <div className="lg:col-span-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                            {/* Bids Today */}
                            <div className="bg-white dark:bg-[#1e1e1e] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Bids Today</p>
                                    <Clock className="w-4 h-4 text-blue-500" />
                                </div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.bids_today}</p>
                            </div>

                            {/* Bids This Week */}
                            <div className="bg-white dark:bg-[#1e1e1e] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Bids This Week</p>
                                    <FileText className="w-4 h-4 text-purple-500" />
                                </div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.bids_week}</p>
                            </div>

                            {/* Success Week */}
                            <div className="bg-white dark:bg-[#1e1e1e] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Success (Week)</p>
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                </div>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.success_week}</p>
                            </div>

                            {/* Failed Week */}
                            <div className="bg-white dark:bg-[#1e1e1e] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Failed (Week)</p>
                                    <XCircle className="w-4 h-4 text-red-500" />
                                </div>
                                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.failed_week}</p>
                            </div>

                            {/* Bid Amount Today */}
                            <div className="bg-white dark:bg-[#1e1e1e] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount Today</p>
                                    <DollarSign className="w-4 h-4 text-emerald-500" />
                                </div>
                                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${stats.bid_amount_today.toFixed(0)}</p>
                            </div>

                            {/* Bid Amount This Week */}
                            <div className="bg-white dark:bg-[#1e1e1e] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount (Week)</p>
                                    <DollarSign className="w-4 h-4 text-emerald-500" />
                                </div>
                                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${stats.bid_amount_week.toFixed(0)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Control Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 h-full flex flex-col">
                            {/* Header */}
                            <div className="text-center mb-6">
                                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Auto-Bidder Control</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">System Management</p>
                            </div>

                            {/* Status Display */}
                            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                                {/* Loading State for Control Card */}
                                {isLoadingStats ? (
                                    <div className="flex flex-col items-center space-y-4">
                                        <div className="w-20 h-20 rounded-full border-4 border-gray-200 dark:border-gray-700 flex items-center justify-center">
                                            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
                                        </div>
                                        <div className="text-center space-y-2">
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                                                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse"></div>
                                                Loading Status...
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[180px] mx-auto leading-relaxed">
                                                Checking system status...
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {/* Status Indicator with Animation */}
                                        <div className="relative">
                                            {/* Outer Ring - Shows when running */}
                                            <div className={`w-20 h-20 rounded-full border-4 transition-all duration-300 ${
                                                stats.is_running 
                                                    ? 'border-green-200 dark:border-green-800 animate-pulse' 
                                                    : 'border-gray-200 dark:border-gray-700'
                                            }`}>
                                                {/* Processing Ring - Shows when toggling */}
                                                {isToggling && (
                                                    <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
                                                )}
                                                
                                                {/* Inner Circle with Play/Pause Button */}
                                                <button
                                                    onClick={toggleAutoBidder}
                                                    disabled={isToggling}
                                                    className={`w-full h-full rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 ${
                                                        stats.is_running
                                                            ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg'
                                                            : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                                                    }`}
                                                >
                                                    {isToggling ? (
                                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    ) : stats.is_running ? (
                                                        <Square className="w-6 h-6 fill-current" />
                                                    ) : (
                                                        <Play className="w-6 h-6 fill-current ml-1" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Status Text */}
                                        <div className="text-center space-y-2">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                                                stats.is_running
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                            }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${
                                                    stats.is_running ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                                                }`}></div>
                                                {isToggling ? (
                                                    stats.is_running ? 'Stopping System...' : 'Starting System...'
                                                ) : (
                                                    stats.is_running ? 'System Active' : 'System Inactive'
                                                )}
                                            </div>
                                            
                                            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[180px] mx-auto leading-relaxed">
                                                {isToggling ? (
                                                    stats.is_running 
                                                        ? 'Shutting down automated bidding...'
                                                        : 'Initializing automated bidding...'
                                                ) : (
                                                    stats.is_running 
                                                        ? 'Monitoring and bidding on projects'
                                                        : 'Click to start automated bidding'
                                                )}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Quick Stats */}
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                {isLoadingStats ? (
                                    <div className="grid grid-cols-2 gap-3 text-center">
                                        <div>
                                            <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto mb-1"></div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Today</p>
                                        </div>
                                        <div>
                                            <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto mb-1"></div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Success</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3 text-center">
                                        <div>
                                            <p className="text-base font-bold text-gray-900 dark:text-white">{stats.bids_today}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Today</p>
                                        </div>
                                        <div>
                                            <p className="text-base font-bold text-green-600 dark:text-green-400">{stats.success_week}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Success</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Auto-Bid Logs Section */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Latest Auto-Bid Logs</h2>
                
                <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-[#252525] border-b border-gray-200 dark:border-gray-800">
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-40">Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Project</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Message</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">Link</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                {isLoading && logs.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                            Loading logs...
                                        </td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                            <div className="flex flex-col items-center gap-3">
                                                <FileText size={48} className="text-gray-300 dark:text-gray-600" />
                                                <p>No activity logs found yet</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors">
                                            {/* Status */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusClass(log.status)}`}>
                                                    {getStatusIcon(log.status)}
                                                    {log.status?.toUpperCase() || 'UNKNOWN'}
                                                </span>
                                            </td>

                                            {/* Time */}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {formatFullTime(log.bid_time)}
                                            </td>

                                            {/* Project Title */}
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[300px]" title={log.project_title}>
                                                    {log.project_title}
                                                </div>
                                            </td>

                                            {/* Amount */}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                <div className="flex items-center gap-1 font-medium text-green-600 dark:text-green-400">
                                                    <DollarSign size={14} />
                                                    {log.amount}
                                                </div>
                                            </td>

                                            {/* Error/Message */}
                                            <td className="px-6 py-4">
                                                <div className="text-sm max-w-[350px] truncate">
                                                    {log.error ? (
                                                        <span className="text-red-500 flex items-center gap-1.5" title={log.error}>
                                                            <AlertCircle size={14} className="flex-shrink-0" />
                                                            <span className="truncate">{log.error}</span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-green-500 flex items-center gap-1.5">
                                                            <CheckCircle size={14} />
                                                            Success
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Link */}
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                {log.project_url && (
                                                    <a
                                                        href={log.project_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                                                        title="View on Freelancer.com"
                                                    >
                                                        <ExternalLink size={16} />
                                                    </a>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Showing {((currentPage - 1) * logsPerPage) + 1} to {Math.min(currentPage * logsPerPage, totalLogs)} of {totalLogs} logs
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => fetchLogs(currentPage - 1)}
                                    disabled={currentPage <= 1}
                                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Previous
                                </button>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => fetchLogs(currentPage + 1)}
                                    disabled={currentPage >= totalPages}
                                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AutoBidLogs
