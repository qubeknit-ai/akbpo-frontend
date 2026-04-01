// API utilities with debouncing and caching to prevent request storms

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Request cache to prevent duplicate requests
const requestCache = new Map()
const CACHE_DURATION = 30000 // 30 seconds

// Debounce utility
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Request deduplication - prevents multiple identical requests
function createCacheKey(url, options = {}) {
  return `${url}_${JSON.stringify(options.headers || {})}`
}

// Cached fetch function
export async function cachedFetch(url, options = {}) {
  const cacheKey = createCacheKey(url, options)
  const now = Date.now()
  
  // Check if we have a recent cached response
  if (requestCache.has(cacheKey)) {
    const cached = requestCache.get(cacheKey)
    if (now - cached.timestamp < CACHE_DURATION) {
      console.log(`🚀 Using cached response for ${url}`)
      return cached.response
    }
  }
  
  // Make the request
  console.log(`📡 Making API request to ${url}`)
  const response = await fetch(url, options)
  
  // Cache successful responses
  if (response.ok) {
    const clonedResponse = response.clone()
    requestCache.set(cacheKey, {
      response: clonedResponse,
      timestamp: now
    })
  }
  
  return response
}

// Debounced API calls
export const debouncedApiCalls = {
  // Debounced fetch limits (prevents spam when user clicks multiple buttons)
  fetchLimits: debounce(async () => {
    const token = localStorage.getItem('token')
    if (!token) return null
    
    try {
      const response = await cachedFetch(`${API_URL}/api/fetch-limits`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.error('Failed to fetch limits:', error)
    }
    return null
  }, 1000), // 1 second debounce
  
  // Debounced profile fetch
  fetchProfile: debounce(async () => {
    const token = localStorage.getItem('token')
    if (!token) return null
    
    try {
      const response = await cachedFetch(`${API_URL}/api/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    }
    return null
  }, 2000), // 2 second debounce
  
  // Debounced notifications fetch
  fetchNotifications: debounce(async () => {
    const token = localStorage.getItem('token')
    if (!token) return null
    
    try {
      const response = await cachedFetch(`${API_URL}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
    return null
  }, 3000) // 3 second debounce
}

// Clear cache utility
export function clearApiCache() {
  requestCache.clear()
  console.log('🧹 API cache cleared')
}

// Get cache stats
export function getCacheStats() {
  return {
    size: requestCache.size,
    keys: Array.from(requestCache.keys())
  }
}

export default {
  cachedFetch,
  debouncedApiCalls,
  clearApiCache,
  getCacheStats
}