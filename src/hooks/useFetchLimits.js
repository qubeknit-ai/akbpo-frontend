// Custom hook for managing fetch limits without excessive polling

import { useState, useEffect, useCallback } from 'react'
import { debouncedApiCalls } from '../utils/apiUtils'

export function useFetchLimits() {
  // Load cached limits immediately
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

  // Load limits from server (only once on mount)
  useEffect(() => {
    const loadLimits = async () => {
      const data = await debouncedApiCalls.fetchLimits()
      if (data) {
        const newLimits = {
          upwork: data.upwork,
          freelancer: data.freelancer,
          freelancer_plus: data.freelancer_plus
        }
        
        setLimits(newLimits)
        
        // Cache in localStorage
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

  // Update limits after a fetch operation
  const updateLimits = useCallback((platform, newRemaining, newLimit) => {
    setLimits(prev => ({
      ...prev,
      [platform]: {
        remaining: newRemaining,
        limit: newLimit || prev[platform].limit
      }
    }))
    
    // Update localStorage
    localStorage.setItem(`${platform}Remaining`, newRemaining.toString())
    if (newLimit) {
      localStorage.setItem(`${platform}Limit`, newLimit.toString())
    }
  }, [])

  // Refresh limits (use sparingly)
  const refreshLimits = useCallback(async () => {
    const data = await debouncedApiCalls.fetchLimits()
    if (data) {
      setLimits({
        upwork: data.upwork,
        freelancer: data.freelancer,
        freelancer_plus: data.freelancer_plus
      })
    }
  }, [])

  return {
    limits,
    updateLimits,
    refreshLimits
  }
}