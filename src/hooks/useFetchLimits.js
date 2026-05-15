// Custom hook for managing fetch limits — uses persistent localStorage cache

import { useState, useEffect, useCallback } from 'react'
import { apiCache, invalidateCache } from '../utils/apiUtils'

export function useFetchLimits() {
  // Load cached limits immediately from localStorage (instant, no network)
  const [limits, setLimits] = useState(() => ({
    upwork: {
      remaining: parseInt(localStorage.getItem('upworkRemaining') || '5'),
      limit: parseInt(localStorage.getItem('upworkLimit') || '5')
    },
    freelancer: {
      remaining: parseInt(localStorage.getItem('freelancerRemaining') || '5'),
      limit: parseInt(localStorage.getItem('freelancerLimit') || '5')
    },
    freelancer_plus: {
      remaining: parseInt(localStorage.getItem('freelancerPlusRemaining') || '3'),
      limit: parseInt(localStorage.getItem('freelancerPlusLimit') || '3')
    }
  }))

  // Fetch from server (served from persistent cache if < 10 min old)
  useEffect(() => {
    const loadLimits = async () => {
      const data = await apiCache.fetchLimits()
      if (data) {
        setLimits({
          upwork: data.upwork,
          freelancer: data.freelancer,
          freelancer_plus: data.freelancer_plus
        })
        // Keep individual keys in sync for other consumers
        localStorage.setItem('upworkRemaining', data.upwork.remaining.toString())
        localStorage.setItem('freelancerRemaining', data.freelancer.remaining.toString())
        localStorage.setItem('freelancerPlusRemaining', data.freelancer_plus.remaining.toString())
        localStorage.setItem('upworkLimit', data.upwork.daily_limit.toString())
        localStorage.setItem('freelancerLimit', data.freelancer.daily_limit.toString())
        localStorage.setItem('freelancerPlusLimit', data.freelancer_plus.daily_limit.toString())
      }
    }
    loadLimits()
  }, [])

  // Update limits after a fetch operation and bust the cache
  const updateLimits = useCallback((platform, newRemaining, newLimit) => {
    setLimits(prev => ({
      ...prev,
      [platform]: {
        remaining: newRemaining,
        limit: newLimit || prev[platform].limit
      }
    }))
    localStorage.setItem(`${platform}Remaining`, newRemaining.toString())
    if (newLimit) localStorage.setItem(`${platform}Limit`, newLimit.toString())
    // Bust cache so next mount re-fetches fresh limits
    invalidateCache('fetchLimits')
  }, [])

  // Force re-fetch from server
  const refreshLimits = useCallback(async () => {
    invalidateCache('fetchLimits')
    const data = await apiCache.fetchLimits()
    if (data) {
      setLimits({
        upwork: data.upwork,
        freelancer: data.freelancer,
        freelancer_plus: data.freelancer_plus
      })
    }
  }, [])

  return { limits, updateLimits, refreshLimits }
}