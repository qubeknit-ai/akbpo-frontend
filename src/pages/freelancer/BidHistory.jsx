import { useState, useEffect } from 'react'
import { Clock, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react'

const BidHistory = () => {
    const [history, setHistory] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // In a real implementation this would fetch from API
        // const fetchHistory = async () => { ... }

        // Mock data for display purposes until backend endpoint is ready
        setHistory([
            {
                id: 1,
                project_title: "Build a React Dashboard",
                amount: 450,
                bid_time: new Date().toISOString(),
                status: "success",
                url: "https://freelancer.com/projects/123"
            },
            {
                id: 2,
                project_title: "Python Scraping Script",
                amount: 120,
                bid_time: new Date(Date.now() - 3600000).toISOString(),
                status: "failed",
                error: "Budget exceeded max limit",
                url: "https://freelancer.com/projects/456"
            }
        ])
        setIsLoading(false)
    }, [])

    const getStatusBadge = (status) => {
        switch (status) {
            case 'success':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Success</span>
            case 'failed':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Failed</span>
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">Pending</span>
        }
    }

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Auto-Bid History</h2>

            <div className="bg-white dark:bg-[#1f1f1f] shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Project
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Time
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Link
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-[#1f1f1f] divide-y divide-gray-200 dark:divide-gray-700">
                            {history.map((bid) => (
                                <tr key={bid.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{bid.project_title}</div>
                                        {bid.error && <div className="text-xs text-red-500 mt-1">{bid.error}</div>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 dark:text-gray-300">${bid.amount}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(bid.bid_time).toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(bid.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <a
                                            href={bid.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center gap-1"
                                        >
                                            View <ExternalLink size={14} />
                                        </a>
                                    </td>
                                </tr>
                            ))}

                            {history.length === 0 && !isLoading && (
                                <tr>
                                    <td colspan="5" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        No bids placed yet
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default BidHistory
