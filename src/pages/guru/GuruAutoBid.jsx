import { useState, useEffect } from 'react'
import { FileText, RefreshCw, AlertCircle, CheckCircle, ExternalLink, Clock, XCircle, DollarSign, Hourglass, Play, Square, ChevronLeft, ChevronRight, Target } from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'https://backend-testing-ashy.vercel.app'
const GURU_COLOR = '#f47c20'

const GuruAutoBid = () => {
    const [logs, setLogs] = useState(() => {
        try {
            const cached = localStorage.getItem('guruAutoBidLogs')
            if (cached) return JSON.parse(cached)
        } catch { }
        return []
    })
    const [isLoading, setIsLoading] = useState(true)
    const [isPageLoaded, setIsPageLoaded] = useState(false)
    const [currentPage, setCurrentPage] = useState(() => {
        try {
            const cached = localStorage.getItem('guruAutoBidLogsPage')
            if (cached) return parseInt(cached)
        } catch { }
        return 1
    })
    const [totalPages, setTotalPages] = useState(() => {
        try {
            const cached = localStorage.getItem('guruAutoBidLogsTotalPages')
            if (cached) return parseInt(cached)
        } catch { }
        return 1
    })
    const [totalLogs, setTotalLogs] = useState(() => {
        try {
            const cached = localStorage.getItem('guruAutoBidLogsTotalLogs')
            if (cached) return parseInt(cached)
        } catch { }
        return 0
    })
    const logsPerPage = 10
    const [stats, setStats] = useState(() => {
        try {
            const cached = localStorage.getItem('guruAutoBidStats')
            if (cached) return JSON.parse(cached)
        } catch { }
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
    const [connectionStatus, setConnectionStatus] = useState('checking')

    useEffect(() => {
        const initializePage = async () => {
            setIsPageLoaded(true)
            await checkConnection()
            await Promise.all([
                fetchLogs(currentPage),
                fetchStats()
            ])
        }
        initializePage()

        let interval = setInterval(() => {
            fetchLogs(currentPage)
            fetchStats()
            checkConnection()
        }, 30000)

        return () => clearInterval(interval)
    }, [currentPage])

    const saveToCaches = (data) => {
        try {
            if (data.logs !== undefined) localStorage.setItem('guruAutoBidLogs', JSON.stringify(data.logs))
            if (data.currentPage !== undefined) localStorage.setItem('guruAutoBidLogsPage', data.currentPage.toString())
            if (data.totalPages !== undefined) localStorage.setItem('guruAutoBidLogsTotalPages', data.totalPages.toString())
            if (data.totalLogs !== undefined) localStorage.setItem('guruAutoBidLogsTotalLogs', data.totalLogs.toString())
            if (data.stats !== undefined) localStorage.setItem('guruAutoBidStats', JSON.stringify(data.stats))
        } catch { }
    }

    const checkConnection = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`${API_URL}/api/guru/status`, {
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

    const fetchLogs = async (page = 1) => {
        try {
            const token = localStorage.getItem('token')
            const offset = (page - 1) * logsPerPage
            const response = await fetch(`${API_URL}/api/guru/autobid/history?limit=${logsPerPage}&offset=${offset}`, {
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
            const response = await fetch(`${API_URL}/api/guru/autobid/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (response.ok) {
                const data = await response.json()
                setStats(data)
                saveToCaches({ stats: data })
            }
        } catch (error) {
            console.error('Failed to fetch stats', error)
        } finally {
            setIsLoadingStats(false)
        }
    }

    const toggleAutoBidder = async () => {
        if (connectionStatus !== 'connected') {
            toast.error('Guru not connected. Please connect first.')
            return
        }
        setIsToggling(true)
        try {
            const token = localStorage.getItem('token')
            const action = stats.is_running ? 'stop' : 'start'

            const response = await fetch(`${API_URL}/api/guru/autobid/${action}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (response.ok) {
                const result = await response.json()
                if (result.success) {
                    const newStats = { ...stats, is_running: action === 'start' }
                    setStats(newStats)
                    saveToCaches({ stats: newStats })
                    toast.success(`Guru auto-quoter ${action === 'start' ? 'started' : 'stopped'} successfully`)
                    await fetchStats()
                } else {
                    throw new Error(result.message || 'Failed to toggle')
                }
            } else {
                throw new Error('Failed to toggle')
            }
        } catch (error) {
            toast.error(`Failed to toggle: ${error.message}`)
        } finally {
            setIsToggling(false)
        }
    }

    const formatFullTime = (timestamp) => {
        if (!timestamp) return '-'
        return new Date(timestamp).toLocaleString()
    }

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'success':
            case 'submitted': return <CheckCircle className="w-4 h-4 text-green-500" />
            case 'failed':
            case 'error': return <XCircle className="w-4 h-4 text-red-500" />
            default: return <Hourglass className="w-4 h-4 text-yellow-500" />
        }
    }

    const getStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'success':
            case 'submitted': return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
            case 'failed':
            case 'error': return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
            default: return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300'
        }
    }

    const formatErrorMessage = (error) => {
        if (!error) return 'Success'
        let message = error
        try {
            const parsed = JSON.parse(error)
            message = parsed.Message || parsed.message || parsed.error || error
        } catch { }
        return message.length > 30 ? message.substring(0, 30) + '...' : message
    }

    return (
        <div className="p-6 space-y-6">
            {!isPageLoaded && (
                <div className="fixed inset-0 bg-white dark:bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="flex flex-col items-center gap-4">
                        <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
                        <p className="text-gray-600 dark:text-gray-400">Loading Guru logs...</p>
                    </div>
                </div>
            )}

            {connectionStatus === 'disconnected' && (
                <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl animate-in fade-in slide-in-from-top-4 duration-300">
                    <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-red-800 dark:text-red-300">Guru Not Connected</p>
                        <p className="text-xs text-red-700/80 dark:text-red-400/80">Please visit guru.com with the extension active to sync your credentials.</p>
                    </div>
                    <a href="https://www.guru.com" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1.5">
                        Connect Now <ExternalLink size={12} />
                    </a>
                </div>
            )}

            <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Guru Auto-Bid Stats</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                            <div className="bg-white dark:bg-[#1e1e1e] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Quotes Today</p>
                                    <Clock className="w-4 h-4 text-orange-500" />
                                </div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.bids_today}</p>
                            </div>
                            <div className="bg-white dark:bg-[#1e1e1e] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Quotes This Week</p>
                                    <FileText className="w-4 h-4 text-purple-500" />
                                </div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.bids_week}</p>
                            </div>
                            <div className="bg-white dark:bg-[#1e1e1e] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Success (Week)</p>
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                </div>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.success_week}</p>
                            </div>
                            <div className="bg-white dark:bg-[#1e1e1e] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Failed (Week)</p>
                                    <XCircle className="w-4 h-4 text-red-500" />
                                </div>
                                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.failed_week}</p>
                            </div>
                            <div className="bg-white dark:bg-[#1e1e1e] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount Today</p>
                                    <DollarSign className="w-4 h-4 text-orange-500" />
                                </div>
                                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">${(stats.bid_amount_today ?? 0).toFixed(0)}</p>
                            </div>
                            <div className="bg-white dark:bg-[#1e1e1e] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount (Week)</p>
                                    <DollarSign className="w-4 h-4 text-orange-500" />
                                </div>
                                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">${(stats.bid_amount_week ?? 0).toFixed(0)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 h-full flex flex-col">
                            <div className="text-center mb-6">
                                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Auto-Bidder Control</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Guru Management</p>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                                <div className="relative">
                                    <div className={`w-20 h-20 rounded-full border-4 transition-all duration-300 ${stats.is_running ? 'border-orange-200 dark:border-orange-800 animate-pulse' : 'border-gray-200 dark:border-gray-700'}`}>
                                        {isToggling && <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-orange-500 animate-spin"></div>}
                                        <button
                                            onClick={toggleAutoBidder}
                                            disabled={isToggling}
                                            className={`w-full h-full rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 ${stats.is_running ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                                        >
                                            {isToggling ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : stats.is_running ? <Square className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="text-center space-y-2">
                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${stats.is_running ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${stats.is_running ? 'bg-orange-500 animate-pulse' : 'bg-gray-400'}`}></div>
                                        {isToggling ? (stats.is_running ? 'Stopping...' : 'Starting...') : (stats.is_running ? 'System Active' : 'System Inactive')}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[180px] mx-auto leading-relaxed">
                                        {stats.is_running ? 'Monitoring and bidding on Guru projects' : 'Click to start automated quoting'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Latest Guru Quotes</h2>
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
                                    <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">Loading logs...</td></tr>
                                ) : logs.length === 0 ? (
                                    <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"><div className="flex flex-col items-center gap-3"><FileText size={48} className="text-gray-300 dark:text-gray-600" /><p>No activity logs found</p></div></td></tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusClass(log.status)}`}>{getStatusIcon(log.status)}{log.status?.toUpperCase()}</span></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatFullTime(log.bid_time)}</td>
                                            <td className="px-6 py-4"><div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[300px]" title={log.project_title}>{log.project_title}</div></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"><div className="flex items-center gap-1 font-medium text-orange-600 dark:text-orange-400"><DollarSign size={14} />{log.bid_amount}</div></td>
                                            <td className="px-6 py-4"><div className="text-sm max-w-[350px] truncate">{log.error ? <span className="text-red-500 flex items-center gap-1.5" title={log.error}><AlertCircle size={14} className="flex-shrink-0" /><span className="truncate">{formatErrorMessage(log.error)}</span></span> : <span className="text-green-500 flex items-center gap-1.5"><CheckCircle size={14} />Success</span>}</div></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                {log.project_url && (
                                                    <a
                                                        href={log.project_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                                                        title="View on Guru"
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
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Showing {((currentPage - 1) * logsPerPage) + 1} to {Math.min(currentPage * logsPerPage, totalLogs)} of {totalLogs} logs</div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage <= 1} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg disabled:opacity-50"><ChevronLeft className="w-4 h-4" />Prev</button>
                                <span className="text-sm">Page {currentPage} of {totalPages}</span>
                                <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage >= totalPages} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg disabled:opacity-50">Next<ChevronRight className="w-4 h-4" /></button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default GuruAutoBid
