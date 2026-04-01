// Performance monitoring component to show API request reduction

import { useState, useEffect } from 'react'
import { getCacheStats } from '../utils/apiUtils'

const PerformanceMonitor = () => {
  const [stats, setStats] = useState({ size: 0, keys: [] })
  const [requestCount, setRequestCount] = useState(0)

  useEffect(() => {
    // Monitor API cache
    const updateStats = () => {
      setStats(getCacheStats())
    }

    // Update stats every 5 seconds
    const interval = setInterval(updateStats, 5000)
    updateStats() // Initial load

    // Monitor network requests (if available)
    if (typeof window !== 'undefined' && window.performance) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const apiRequests = entries.filter(entry => 
          entry.name.includes('/api/') && 
          entry.entryType === 'navigation' || entry.entryType === 'fetch'
        )
        setRequestCount(prev => prev + apiRequests.length)
      })
      
      try {
        observer.observe({ entryTypes: ['navigation', 'fetch'] })
      } catch (e) {
        // Fallback if fetch observation not supported
        console.log('Performance monitoring not fully supported')
      }

      return () => {
        observer.disconnect()
        clearInterval(interval)
      }
    }

    return () => clearInterval(interval)
  }, [])

  // Only show in development
  if (import.meta.env.PROD) return null

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white text-xs p-2 rounded-lg font-mono z-50">
      <div className="text-green-400">🚀 Performance Monitor</div>
      <div>Cache Size: {stats.size}</div>
      <div>Requests: {requestCount}</div>
      <div className="text-xs text-gray-400 mt-1">
        {stats.size > 0 ? '✅ Caching active' : '⚠️ No cache'}
      </div>
    </div>
  )
}

export default PerformanceMonitor