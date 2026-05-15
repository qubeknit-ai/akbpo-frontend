// API utilities — persistent cache (survives page reloads) + in-flight deduplication

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ─── Persistent Cache ────────────────────────────────────────────────────────
// Stores parsed JSON + timestamp in localStorage so data survives page reloads.
// TTLs are per-cache-key (in milliseconds).

const CACHE_TTL = {
  profile:       10 * 60 * 1000, // 10 minutes
  notifications:  2 * 60 * 1000, //  2 minutes
  fetchLimits:   10 * 60 * 1000, // 10 minutes
  freelancerProfile: 5 * 60 * 1000, //  5 minutes
  truelancerStatus: 5 * 60 * 1000,  //  5 minutes
  adminUsers:    10 * 60 * 1000, // 10 minutes
  adminLeads:     5 * 60 * 1000, //  5 minutes
  adminStats:     2 * 60 * 1000, //  2 minutes
  adminSettings: 10 * 60 * 1000, // 10 minutes
  talents:        10 * 60 * 1000, // 10 minutes
  chatHistory:     2 * 60 * 1000, //  2 minutes
  settings:       10 * 60 * 1000, // 10 minutes
  freelancerStatus: 5 * 60 * 1000, //  5 minutes
}

const LS_PREFIX = 'apicache__'

function lsKey(name) {
  return `${LS_PREFIX}${name}`
}

/** Read a cached entry from localStorage. Returns { data, timestamp } or null. */
function readCache(name) {
  try {
    const raw = localStorage.getItem(lsKey(name))
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/** Write data to localStorage cache with current timestamp. */
function writeCache(name, data) {
  try {
    localStorage.setItem(lsKey(name), JSON.stringify({ data, timestamp: Date.now() }))
  } catch {
    // Ignore storage quota errors
  }
}

/** Returns cached data if it's still within TTL, otherwise null. */
export function getCached(name) {
  const ttl = CACHE_TTL[name]
  if (!ttl) return null
  const entry = readCache(name)
  if (!entry) return null
  if (Date.now() - entry.timestamp < ttl) return entry.data
  return null
}

/** Manually update a named cache entry (e.g. after a mutation). */
export function setCache(name, data) {
  writeCache(name, data)
}

/** Invalidate a specific cache entry so the next call re-fetches. */
export function invalidateCache(name) {
  try {
    localStorage.removeItem(lsKey(name))
  } catch {}
}

/** Clear ALL api cache entries from localStorage. */
export function clearApiCache() {
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith(LS_PREFIX))
      .forEach(k => localStorage.removeItem(k))
  } catch {}
}

// ─── In-Flight Deduplication ─────────────────────────────────────────────────
// If two callers request the same thing simultaneously, the second waits for
// the first instead of making a duplicate network request.

const inflightRequests = new Map()

// ─── Core: persistentFetch ────────────────────────────────────────────────────
/**
 * Fetch with persistent localStorage caching.
 *  1. If localStorage has fresh data → return immediately (no network call).
 *  2. If a request is already in-flight for this key → wait for it.
 *  3. Otherwise → fetch, cache result, return data.
 *
 * @param {string} cacheName  - Key in CACHE_TTL map
 * @param {string} url
 * @param {object} options    - fetch options
 * @returns {Promise<any>}    - parsed JSON data (or null on failure)
 */
export async function persistentFetch(cacheName, url, options = {}) {
  // 1. Serve from localStorage cache if still fresh
  const cached = getCached(cacheName)
  if (cached !== null) return cached

  // 2. Deduplicate parallel requests for the same key
  if (inflightRequests.has(cacheName)) {
    return inflightRequests.get(cacheName)
  }

  // 3. Make the real network request
  const requestPromise = fetch(url, options)
    .then(async (res) => {
      if (res.ok) {
        const data = await res.json()
        writeCache(cacheName, data)
        return data
      }
      return null
    })
    .catch(() => null)
    .finally(() => inflightRequests.delete(cacheName))

  inflightRequests.set(cacheName, requestPromise)
  return requestPromise
}

// ─── Named API helpers ────────────────────────────────────────────────────────

function token() {
  return localStorage.getItem('token') || ''
}

function authHeaders() {
  return { 'Authorization': `Bearer ${token()}` }
}

export const apiCache = {
  /** Fetch /api/profile — cached 10 min, instant on reload */
  async fetchProfile() {
    if (!token()) return null
    return persistentFetch('profile', `${API_URL}/api/profile`, {
      headers: authHeaders()
    })
  },

  /** Fetch /api/notifications — cached 2 min */
  async fetchNotifications() {
    if (!token()) return null
    return persistentFetch('notifications', `${API_URL}/api/notifications`, {
      headers: authHeaders()
    })
  },

  /** Fetch /api/fetch-limits — cached 10 min */
  async fetchLimits() {
    if (!token()) return null
    return persistentFetch('fetchLimits', `${API_URL}/api/fetch-limits`, {
      headers: authHeaders()
    })
  },

  /** Fetch /api/freelancer/profile — cached 5 min (makes external HTTP call) */
  async fetchFreelancerProfile() {
    if (!token()) return null
    return persistentFetch('freelancerProfile', `${API_URL}/api/freelancer/profile`, {
      headers: authHeaders()
    })
  },

  /** Fetch /api/truelancer/status — cached 5 min */
  async fetchTruelancerStatus() {
    if (!token()) return null
    return persistentFetch('truelancerStatus', `${API_URL}/api/truelancer/status`, {
      headers: authHeaders()
    })
  },

  /** Fetch /api/admin/users — cached 10 min */
  async fetchAdminUsers() {
    if (!token()) return null
    return persistentFetch('adminUsers', `${API_URL}/api/admin/users`, {
      headers: authHeaders()
    })
  },

  /** Fetch /api/admin/leads — cached 5 min */
  async fetchAdminLeads() {
    if (!token()) return null
    return persistentFetch('adminLeads', `${API_URL}/api/admin/leads`, {
      headers: authHeaders()
    })
  },

  /** Fetch /api/admin/stats — cached 2 min */
  async fetchAdminStats() {
    if (!token()) return null
    return persistentFetch('adminStats', `${API_URL}/api/admin/stats`, {
      headers: authHeaders()
    })
  },

  /** Fetch /api/admin/settings — cached 10 min */
  async fetchAdminSettings() {
    if (!token()) return null
    return persistentFetch('adminSettings', `${API_URL}/api/admin/settings`, {
      headers: authHeaders()
    })
  },

  /** Fetch /api/talents — cached 10 min */
  async fetchTalents() {
    if (!token()) return null
    return persistentFetch('talents', `${API_URL}/api/talents`, {
      headers: authHeaders()
    })
  },

  /** Fetch /api/chat/history/:leadId — cached 2 min */
  async fetchChatHistory(leadId) {
    if (!token() || !leadId) return null
    return persistentFetch(`chatHistory_${leadId}`, `${API_URL}/api/chat/history/${leadId}`, {
      headers: authHeaders()
    })
  },

  /** Fetch /api/settings — cached 10 min */
  async fetchSettings() {
    if (!token()) return null
    return persistentFetch('settings', `${API_URL}/api/settings`, {
      headers: authHeaders()
    })
  },

  /** Fetch /api/freelancer/status — cached 5 min */
  async fetchFreelancerStatus() {
    if (!token()) return null
    return persistentFetch('freelancerStatus', `${API_URL}/api/freelancer/status`, {
      headers: authHeaders()
    })
  },
}

// ─── Backwards-compat shim for old debouncedApiCalls callers ─────────────────
export const debouncedApiCalls = {
  fetchLimits:       () => apiCache.fetchLimits(),
  fetchProfile:      () => apiCache.fetchProfile(),
  fetchNotifications:() => apiCache.fetchNotifications(),
}

// ─── Legacy cachedFetch shim (kept so nothing breaks) ────────────────────────
export async function cachedFetch(url, options = {}) {
  // Derive a simple cache name from the URL path
  const path = url.replace(API_URL, '').replace(/\//g, '_').replace(/^_/, '')
  return persistentFetch(path, url, options)
}

export function getCacheStats() {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(LS_PREFIX))
  return { size: keys.length, keys }
}

export default {
  persistentFetch,
  apiCache,
  getCached,
  setCache,
  invalidateCache,
  clearApiCache,
  debouncedApiCalls,
  cachedFetch,
  getCacheStats,
}