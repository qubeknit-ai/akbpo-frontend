import { useState, useEffect } from 'react'
import { Eye, ExternalLink, DollarSign, Clock, AlertCircle, RefreshCw, CheckCircle, XCircle, Hourglass, User, Star, Shield, CreditCard, Mail, Phone, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { logError } from '../../utils/logger'
import ReactCountryFlag from 'react-country-flag'
import StarRating from '../../components/StarRating'
import gif from '../../assets/gif.gif'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const FreelancerBids = () => {
  const [bids, setBids] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, pending, accepted, rejected
  const [connectionStatus, setConnectionStatus] = useState('loading')

  useEffect(() => {
    // Load data immediately
    loadBids()
  }, [])

  useEffect(() => {
    if (connectionStatus === 'connected') {
      loadBids()
    }
  }, [filter])

  const checkConnection = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/freelancer/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setConnectionStatus(data.connected ? 'connected' : 'disconnected')
      } else {
        setConnectionStatus('disconnected')
      }
    } catch (error) {
      logError('Failed to check connection', error)
      setConnectionStatus('error')
    }
  }

  const loadBids = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/freelancer/bids?filter=${filter}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('🔍 Raw API response:', data)
        
        // Handle both possible response formats  
        const bids = data.result?.bids || data.bids || []
        const projects = data.result?.projects || data.projects || {}
        const users = data.result?.users || data.users || {}
        
        console.log('📊 Bids array:', bids.slice(0, 2))
        console.log('📊 Projects object keys:', Object.keys(projects))
        console.log('📊 Users object keys:', Object.keys(users))
        console.log('📊 First project data:', projects[Object.keys(projects)[0]])
        console.log('📊 First user data:', users[Object.keys(users)[0]])
        
        // Merge project and user data with bids
        const enrichedBids = bids.map(bid => {
          const project = projects[bid.project_id] || bid.project
          
          // Debug: Log first bid to understand API structure
          if (bids.indexOf(bid) === 0) {
            console.log('🔍 First bid structure:', JSON.stringify(bid, null, 2))
            console.log('🔍 First bid project specifically:', JSON.stringify(project, null, 2))
            console.log('🔍 All bid keys:', Object.keys(bid))
            console.log('🔍 Looking for currency fields in bid:', {
              currency: bid.currency,
              currency_id: bid.currency_id,
              project_currency: project?.currency,
              project_currency_id: project?.currency_id,
              project_budget_currency: project?.budget?.currency,
              project_budget_currency_id: project?.budget?.currency_id
            })
          }
          
          // Try different possible field names for project owner
          let client = null
          if (project) {
            const possibleOwnerIds = [
              project.owner_id,
              project.owner?.id,
              project.user_id,
              project.client_id
            ]
            
            for (const ownerId of possibleOwnerIds) {
              if (ownerId && users[ownerId]) {
                client = users[ownerId]
                break
              }
            }
            
            // If no client found in users object, check if owner data is embedded in project
            if (!client && project.owner) {
              client = project.owner
            }
          }
          
          console.log(`🔗 Bid ${bid.id} -> Project ${bid.project_id}:`, project?.title || project?.name || 'NO TITLE')
          console.log(`📋 Project structure:`, project ? Object.keys(project) : 'NO PROJECT')
          console.log(`👤 Client for project ${bid.project_id}:`, client?.display_name || client?.username || 'NO CLIENT')
          console.log(`🔍 Looking for owner_id: ${project?.owner_id} in users:`, Object.keys(users))
          if (project?.owner_id) {
            console.log(`🔍 User ${project.owner_id} exists:`, !!users[project.owner_id])
          }
          if (client) {
            console.log(`👤 Client details:`, {
              name: client.display_name || client.username,
              id: client.id,
              country: client.location?.country?.name || client.country?.name
            })
          }
          
          return {
            ...bid,
            project: project,
            client: client
          }
        })
        
        console.log('✅ Loaded', enrichedBids.length, 'bids')
        setBids(enrichedBids)
        setConnectionStatus('connected')
      } else if (response.status === 404 || response.status === 401) {
        // Not connected to Freelancer
        setConnectionStatus('disconnected')
      } else {
        // Not connected to Freelancer
        setConnectionStatus('disconnected')
      }
    } catch (error) {
      logError('Failed to load bids', error)
      setConnectionStatus('error')
      toast.error('Please connect to Freelancer.com using the browser extension')
    } finally {
      setIsLoading(false)
    }
  }

  const retractBid = async (bidId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/freelancer/bids/${bidId}/retract`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast.success('Bid retracted successfully')
        loadBids() // Refresh the list
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to retract bid')
      }
    } catch (error) {
      logError('Failed to retract bid', error)
      toast.error(error.message || 'Failed to retract bid')
    }
  }

  const getBidStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
      case 'awarded':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'rejected':
      case 'declined':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'pending':
      case 'active':
      default:
        return <Hourglass className="w-5 h-5 text-yellow-500" />
    }
  }

  const getBidStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
      case 'awarded':
        return 'Accepted'
      case 'rejected':
      case 'declined':
        return 'Rejected'
      case 'pending':
      case 'active':
      default:
        return 'Pending'
    }
  }

  const getBidStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
      case 'awarded':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
      case 'rejected':
      case 'declined':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
      case 'pending':
      case 'active':
      default:
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300'
    }
  }

  const getProjectTitle = (bid) => {
    // Try multiple sources for project title
    const sources = [
      bid.project?.title,
      bid.project?.name,
      bid.title,
      bid.project_title,
      bid.name
    ]
    
    for (const source of sources) {
      if (source && source.trim()) {
        return source
      }
    }
    
    // Fallback to preview description or description
    if (bid.project?.preview_description) {
      return bid.project.preview_description.substring(0, 60) + '...'
    }
    
    if (bid.description) {
      return bid.description.split('\n')[0].substring(0, 50) + '...'
    }
    
    // Last resort
    return `Project #${bid.project_id}`
  }

  const getClientInfo = (bid) => {
    const client = bid.client
    if (!client) return null
    
    // Try to get country code from various possible locations
    let countryCode = null
    if (client.location?.country?.code) {
      countryCode = client.location.country.code.toUpperCase()
    } else if (client.country?.code) {
      countryCode = client.country.code.toUpperCase()
    } else if (client.location?.country?.name) {
      // Map common country names to codes as fallback
      const countryMap = {
        'United States': 'US',
        'United Kingdom': 'GB',
        'Canada': 'CA',
        'Australia': 'AU',
        'Germany': 'DE',
        'France': 'FR',
        'India': 'IN',
        'Pakistan': 'PK',
        'Bangladesh': 'BD',
        'Philippines': 'PH',
        'Ukraine': 'UA',
        'Poland': 'PL',
        'Romania': 'RO',
        'Serbia': 'RS',
        'Brazil': 'BR',
        'Argentina': 'AR',
        'Mexico': 'MX',
        'Egypt': 'EG',
        'Nigeria': 'NG',
        'South Africa': 'ZA',
        'Kenya': 'KE',
        'Morocco': 'MA',
        'Tunisia': 'TN',
        'Oman': 'OM',
        'United Arab Emirates': 'AE',
        'Italy': 'IT',
        'Indonesia': 'ID',
        'Qatar': 'QA',
        'Netherlands': 'NL',
        'Spain': 'ES',
        'Saudi Arabia' : 'SA',
        'Haiti':'HT'
      }
      countryCode = countryMap[client.location.country.name] || null
    }
    
    // Extract reputation data from various possible locations
    let reviewCount = 0
    let rating = 0
    let completionRate = null
    let onTimeRate = null
    let onBudgetRate = null
    
    // Try different paths for reputation data
    if (client.reputation) {
      // Method 1: entire_site.overall structure
      if (client.reputation.entire_site?.overall) {
        reviewCount = client.reputation.entire_site.overall.count || 0
        rating = client.reputation.entire_site.overall.rating || 0
        completionRate = client.reputation.entire_site.overall.completion_rate
        onTimeRate = client.reputation.entire_site.overall.on_time_rate
        onBudgetRate = client.reputation.entire_site.overall.on_budget_rate
      }
      // Method 2: Direct reputation properties
      else if (client.reputation.count !== undefined) {
        reviewCount = client.reputation.count || 0
        rating = client.reputation.rating || client.reputation.average_rating || 0
        completionRate = client.reputation.completion_rate
        onTimeRate = client.reputation.on_time_rate
        onBudgetRate = client.reputation.on_budget_rate
      }
      // Method 3: Check for other reputation structures
      else {
        // Try to extract any available data
        reviewCount = client.reputation.review_count || client.reputation.total_reviews || 0
        rating = client.reputation.overall_rating || client.reputation.avg_rating || 0
      }
    }
    
    // Fallback: check direct properties on client
    if (reviewCount === 0) {
      reviewCount = client.review_count || client.total_reviews || client.reviews_count || 0
    }
    if (rating === 0) {
      rating = client.rating || client.overall_rating || client.avg_rating || 0
    }
    
    return {
      name: client.display_name || client.username || 'Unknown Client',
      country: client.location?.country?.name || client.country?.name || 'Unknown',
      city: client.location?.city || null,
      countryCode: countryCode,
      reviewCount: reviewCount,
      rating: rating,
      completionRate: completionRate,
      onTimeRate: onTimeRate,
      onBudgetRate: onBudgetRate,
      avatar: client.avatar_large_url || client.avatar_url,
      memberSince: client.registration_date,
      // Check verification status from multiple possible locations in the API response
      isEmailVerified: client.status?.email_verified === true || client.email_verified === true,
      isPhoneVerified: client.status?.phone_verified === true || client.status?.mobile_verified === true || client.phone_verified === true || client.mobile_verified === true,
      isPaymentVerified: client.status?.payment_verified === true || client.status?.payment_method_verified === true || client.payment_verified === true || client.payment_method_verified === true || client.verification?.payment_verified === true,
      isIdentityVerified: client.status?.identity_verified === true || client.status?.kyc_verified === true || client.identity_verified === true || client.kyc_verified === true || client.verification?.identity_verified === true,
      isDepositMade: client.status?.deposit_made === true || client.status?.has_deposit === true || client.deposit_made === true || client.has_deposit === true || client.verification?.deposit_made === true,
      isProfileCompleted: client.registration_completed === true || client.profile_completed === true,
      // Additional checks for account status
      isLimitedAccount: client.limited_account || false,
      isAccountClosed: client.closed || false
    }
  }

  const formatBudget = (budget, project = null) => {
    if (!budget) return 'Not specified'
    
    // Debug: Log the budget structure to understand the API response
    console.log('💰 Budget structure:', JSON.stringify(budget, null, 2))
    if (project) {
      console.log('🔍 Full project for currency detection:', JSON.stringify({
        currency: project.currency,
        currency_id: project.currency_id,
        location: project.location,
        owner: project.owner
      }, null, 2))
    }
    
    const minBudget = budget.minimum || 0
    const maxBudget = budget.maximum || minBudget
    
    // Try multiple ways to get currency from the API response
    let currency = 'USD' // Default fallback
    
    // Method 1: Check budget.currency
    if (budget.currency) {
      if (typeof budget.currency === 'string') {
        currency = budget.currency
      } else if (budget.currency.code) {
        currency = budget.currency.code
      } else if (budget.currency.id) {
        // Freelancer API currency mapping based on common IDs
        const currencyMap = {
          1: 'USD', 2: 'EUR', 3: 'GBP', 4: 'AUD', 5: 'CAD', 6: 'INR', 7: 'JPY', 8: 'CNY',
          9: 'BRL', 10: 'MXN', 11: 'ZAR', 12: 'SGD', 13: 'NZD', 14: 'HKD', 15: 'SEK',
          16: 'NOK', 17: 'DKK', 18: 'PLN', 19: 'CHF', 20: 'RUB', 21: 'TRY', 22: 'THB',
          23: 'PHP', 24: 'IDR', 25: 'MYR', 26: 'VND', 27: 'KRW', 28: 'AED', 29: 'SAR',
          30: 'PKR', 31: 'BDT', 32: 'NGN', 33: 'EGP', 34: 'ARS', 35: 'CLP', 36: 'COP',
          37: 'PEN', 38: 'UAH', 39: 'ILS', 40: 'CZK', 41: 'HUF', 42: 'RON'
        }
        currency = currencyMap[budget.currency.id] || budget.currency.code || 'USD'
      }
    } 
    // Method 2: Check budget.currency_id
    else if (budget.currency_id) {
      const currencyMap = {
        1: 'USD', 2: 'EUR', 3: 'GBP', 4: 'AUD', 5: 'CAD', 6: 'INR', 7: 'JPY', 8: 'CNY'
      }
      currency = currencyMap[budget.currency_id] || 'USD'
    }
    // Method 3: Check project-level currency fields
    else if (project) {
      if (project.currency) {
        if (typeof project.currency === 'string') {
          currency = project.currency
        } else if (project.currency.code) {
          currency = project.currency.code
        } else if (project.currency.id) {
          const currencyMap = {
            1: 'USD', 2: 'EUR', 3: 'GBP', 4: 'AUD', 5: 'CAD', 6: 'INR', 7: 'JPY', 8: 'CNY'
          }
          currency = currencyMap[project.currency.id] || 'USD'
        }
      } else if (project.currency_id) {
        const currencyMap = {
          1: 'USD', 2: 'EUR', 3: 'GBP', 4: 'AUD', 5: 'CAD', 6: 'INR', 7: 'JPY', 8: 'CNY'
        }
        currency = currencyMap[project.currency_id] || 'USD'
      }
      // Check owner/client currency info
      else if (project.owner?.currency) {
        if (typeof project.owner.currency === 'string') {
          currency = project.owner.currency
        } else if (project.owner.currency.code) {
          currency = project.owner.currency.code
        }
      }
    }
    
    // Method 4: Try to detect from client location as fallback
    if (currency === 'USD' && project?.client) {
      const clientCountry = project.client.location?.country?.code || project.client.country?.code
      const countryCurrencyMap = {
        'GB': 'GBP', 'UK': 'GBP',
        'CA': 'CAD',
        'AU': 'AUD',
        'IN': 'INR',
        'JP': 'JPY',
        'CN': 'CNY',
        'BR': 'BRL',
        'MX': 'MXN',
        'ZA': 'ZAR',
        'SG': 'SGD',
        'NZ': 'NZD',
        'HK': 'HKD',
        'SE': 'SEK',
        'NO': 'NOK',
        'DK': 'DKK',
        'PL': 'PLN',
        'CH': 'CHF',
        'RU': 'RUB',
        'TR': 'TRY',
        'TH': 'THB',
        'PH': 'PHP',
        'ID': 'IDR',
        'MY': 'MYR',
        'VN': 'VND',
        'KR': 'KRW',
        'AE': 'AED',
        'SA': 'SAR',
        'PK': 'PKR',
        'BD': 'BDT',
        'NG': 'NGN',
        'EG': 'EGP'
      }
      if (clientCountry && countryCurrencyMap[clientCountry]) {
        console.log('🌍 Detected currency from client country:', clientCountry, '->', countryCurrencyMap[clientCountry])
        currency = countryCurrencyMap[clientCountry]
      }
    }
    
    console.log('💱 Final detected currency:', currency)
    
    // Get currency symbol
    const getCurrencySymbol = (currencyCode) => {
      const symbols = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'AUD': 'A$',
        'CAD': 'C$',
        'INR': '₹',
        'JPY': '¥',
        'CNY': '¥',
        'BRL': 'R$',
        'MXN': 'MX$',
        'ZAR': 'R',
        'SGD': 'S$',
        'NZD': 'NZ$',
        'HKD': 'HK$',
        'SEK': 'kr',
        'NOK': 'kr',
        'DKK': 'kr',
        'PLN': 'zł',
        'CHF': 'CHF',
        'RUB': '₽',
        'TRY': '₺',
        'THB': '฿',
        'PHP': '₱',
        'IDR': 'Rp',
        'MYR': 'RM',
        'VND': '₫',
        'KRW': '₩',
        'AED': 'AED',
        'SAR': 'SAR',
        'PKR': 'Rs',
        'BDT': '৳',
        'NGN': '₦',
        'EGP': 'E£',
        'ARS': 'AR$',
        'CLP': 'CLP$',
        'COP': 'COL$',
        'PEN': 'S/',
        'UAH': '₴',
        'ILS': '₪',
        'CZK': 'Kč',
        'HUF': 'Ft',
        'RON': 'lei'
      }
      return symbols[currencyCode] || '$' // Default to $ if currency not found
    }
    
    const symbol = getCurrencySymbol(currency)
    
    if (minBudget === maxBudget) {
      return `${symbol}${minBudget}`
    }
    return `${symbol}${minBudget} - ${symbol}${maxBudget}`
  }

  const formatBidAmount = (amount, bid) => {
    if (!amount) return 'Not specified'
    
    // Use the same currency detection logic as formatBudget for the project
    // Since bid amount should be in the same currency as the project budget
    if (!bid.project?.budget) {
      return `$${amount}` // Fallback to USD if no project budget info
    }
    
    // Get the currency from the project budget using the same logic as formatBudget
    const budget = bid.project.budget
    const project = bid.project
    
    // Try multiple ways to get currency from the API response (same as formatBudget)
    let currency = 'USD' // Default fallback
    
    // Method 1: Check budget.currency
    if (budget.currency) {
      if (typeof budget.currency === 'string') {
        currency = budget.currency
      } else if (budget.currency.code) {
        currency = budget.currency.code
      } else if (budget.currency.id) {
        // Freelancer API currency mapping based on common IDs
        const currencyMap = {
          1: 'USD', 2: 'EUR', 3: 'GBP', 4: 'AUD', 5: 'CAD', 6: 'INR', 7: 'JPY', 8: 'CNY',
          9: 'BRL', 10: 'MXN', 11: 'ZAR', 12: 'SGD', 13: 'NZD', 14: 'HKD', 15: 'SEK',
          16: 'NOK', 17: 'DKK', 18: 'PLN', 19: 'CHF', 20: 'RUB', 21: 'TRY', 22: 'THB',
          23: 'PHP', 24: 'IDR', 25: 'MYR', 26: 'VND', 27: 'KRW', 28: 'AED', 29: 'SAR',
          30: 'PKR', 31: 'BDT', 32: 'NGN', 33: 'EGP', 34: 'ARS', 35: 'CLP', 36: 'COP',
          37: 'PEN', 38: 'UAH', 39: 'ILS', 40: 'CZK', 41: 'HUF', 42: 'RON'
        }
        currency = currencyMap[budget.currency.id] || budget.currency.code || 'USD'
      }
    } 
    // Method 2: Check budget.currency_id
    else if (budget.currency_id) {
      const currencyMap = {
        1: 'USD', 2: 'EUR', 3: 'GBP', 4: 'AUD', 5: 'CAD', 6: 'INR', 7: 'JPY', 8: 'CNY'
      }
      currency = currencyMap[budget.currency_id] || 'USD'
    }
    // Method 3: Check project-level currency fields
    else if (project) {
      if (project.currency) {
        if (typeof project.currency === 'string') {
          currency = project.currency
        } else if (project.currency.code) {
          currency = project.currency.code
        } else if (project.currency.id) {
          const currencyMap = {
            1: 'USD', 2: 'EUR', 3: 'GBP', 4: 'AUD', 5: 'CAD', 6: 'INR', 7: 'JPY', 8: 'CNY'
          }
          currency = currencyMap[project.currency.id] || 'USD'
        }
      } else if (project.currency_id) {
        const currencyMap = {
          1: 'USD', 2: 'EUR', 3: 'GBP', 4: 'AUD', 5: 'CAD', 6: 'INR', 7: 'JPY', 8: 'CNY'
        }
        currency = currencyMap[project.currency_id] || 'USD'
      }
      // Check owner/client currency info
      else if (project.owner?.currency) {
        if (typeof project.owner.currency === 'string') {
          currency = project.owner.currency
        } else if (project.owner.currency.code) {
          currency = project.owner.currency.code
        }
      }
    }
    
    // Method 4: Try to detect from client location as fallback
    if (currency === 'USD' && bid.client) {
      const clientCountry = bid.client.location?.country?.code || bid.client.country?.code
      const countryCurrencyMap = {
        'GB': 'GBP', 'UK': 'GBP',
        'CA': 'CAD',
        'AU': 'AUD',
        'IN': 'INR',
        'JP': 'JPY',
        'CN': 'CNY',
        'BR': 'BRL',
        'MX': 'MXN',
        'ZA': 'ZAR',
        'SG': 'SGD',
        'NZ': 'NZD',
        'HK': 'HKD',
        'SE': 'SEK',
        'NO': 'NOK',
        'DK': 'DKK',
        'PL': 'PLN',
        'CH': 'CHF',
        'RU': 'RUB',
        'TR': 'TRY',
        'TH': 'THB',
        'PH': 'PHP',
        'ID': 'IDR',
        'MY': 'MYR',
        'VN': 'VND',
        'KR': 'KRW',
        'AE': 'AED',
        'SA': 'SAR',
        'PK': 'PKR',
        'BD': 'BDT',
        'NG': 'NGN',
        'EG': 'EGP'
      }
      if (clientCountry && countryCurrencyMap[clientCountry]) {
        console.log('🌍 Detected bid currency from client country:', clientCountry, '->', countryCurrencyMap[clientCountry])
        currency = countryCurrencyMap[clientCountry]
      }
    }
    
    console.log('💱 Final detected bid currency (using project budget):', currency)
    
    // Get currency symbol (same as formatBudget)
    const getCurrencySymbol = (currencyCode) => {
      const symbols = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'AUD': 'A$',
        'CAD': 'C$',
        'INR': '₹',
        'JPY': '¥',
        'CNY': '¥',
        'BRL': 'R$',
        'MXN': 'MX$',
        'ZAR': 'R',
        'SGD': 'S$',
        'NZD': 'NZ$',
        'HKD': 'HK$',
        'SEK': 'kr',
        'NOK': 'kr',
        'DKK': 'kr',
        'PLN': 'zł',
        'CHF': 'CHF',
        'RUB': '₽',
        'TRY': '₺',
        'THB': '฿',
        'PHP': '₱',
        'IDR': 'Rp',
        'MYR': 'RM',
        'VND': '₫',
        'KRW': '₩',
        'AED': 'AED',
        'SAR': 'SAR',
        'PKR': 'Rs',
        'BDT': '৳',
        'NGN': '₦',
        'EGP': 'E£',
        'ARS': 'AR$',
        'CLP': 'CLP$',
        'COP': 'COL$',
        'PEN': 'S/',
        'UAH': '₴',
        'ILS': '₪',
        'CZK': 'Kč',
        'HUF': 'Ft',
        'RON': 'lei'
      }
      return symbols[currencyCode] || '$' // Default to $ if currency not found
    }
    
    const symbol = getCurrencySymbol(currency)
    return `${symbol}${amount}`
  }

  const formatTimeAgo = (timestamp) => {
    const now = Date.now()
    const diff = now - (timestamp * 1000)
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  const filteredBids = bids.filter(bid => {
    if (filter === 'all') return true
    const status = bid.status?.toLowerCase() || 'pending'
    
    switch (filter) {
      case 'pending':
        return status === 'pending' || status === 'active'
      case 'accepted':
        return status === 'accepted' || status === 'awarded'
      case 'rejected':
        return status === 'rejected' || status === 'declined'
      default:
        return true
    }
  })

  if (connectionStatus === 'disconnected') {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Not Connected to Freelancer.com
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please connect to Freelancer.com using the browser extension to view your bids.
          </p>
          <button
            onClick={loadBids}
            className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Filter Tabs */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {filteredBids.length} bid{filteredBids.length !== 1 ? 's' : ''}
        </span>
        <div className="bg-white dark:bg-[#1f1f1f] rounded-lg border border-gray-200 dark:border-gray-700 p-1 inline-flex">
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'accepted', label: 'Accepted' },
            { key: 'rejected', label: 'Rejected' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bids List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <img
                          src={gif}
                          alt="AK BPO AI Logo"
                          className="h-12 object-contain mx-auto mb-4"
                        />
            <p className="text-gray-600 dark:text-gray-400">Loading bids...</p>
          </div>
        ) : filteredBids.length === 0 ? (
          <div className="text-center py-8">
            <Eye className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No bids found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'all' 
                ? "You haven't placed any bids yet." 
                : `No ${filter} bids found.`}
            </p>
          </div>
        ) : (
          filteredBids.map((bid) => (
            <div key={bid.id} className="bg-white dark:bg-[#1f1f1f] rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex gap-6">
                {/* Main Content - 3/4 width */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {getProjectTitle(bid)}
                        </h3>
                        <div className="flex items-center gap-2">
                          {getBidStatusIcon(bid.status)}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getBidStatusColor(bid.status)}`}>
                            {getBidStatusText(bid.status)}
                          </span>
                        </div>
                      </div>
                      
                      {bid.description && (
                        <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {bid.description}
                        </p>
                      )}
                    </div>
                    
                    {bid.project?.seo_url && (
                      <a
                        href={`https://www.freelancer.com/projects/${bid.project.seo_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm ml-4"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Project
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Bid Amount</p>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {formatBidAmount(bid.amount, bid)}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Delivery Time</p>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {bid.period || 7} days
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Submitted</p>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatTimeAgo(bid.time_submitted)}
                      </span>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Project Budget</p>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {bid.project?.budget ? formatBudget(bid.project.budget, bid.project) : 'Not specified'}
                      </span>
                    </div>
                  </div>

                  {bid.project?.jobs && bid.project.jobs.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Skills Required:</p>
                      <div className="flex flex-wrap gap-2">
                        {bid.project.jobs.slice(0, 5).map((skill) => (
                          <span
                            key={skill.id}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs rounded-full"
                          >
                            {skill.name}
                          </span>
                        ))}
                        {bid.project.jobs.length > 5 && (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                            +{bid.project.jobs.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Project ID: {bid.project_id} • Bid ID: {bid.id}
                    </div>
                    
                    {(bid.status?.toLowerCase() === 'pending' || bid.status?.toLowerCase() === 'active') && (
                      <button
                        onClick={() => retractBid(bid.id)}
                        className="px-4 py-2 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        Retract Bid
                      </button>
                    )}
                  </div>
                </div>

                {/* Client Information - 1/4 width */}
                {(() => {
                  const clientInfo = getClientInfo(bid)
                  if (!clientInfo) return null
                  
                  return (
                    <div className="w-64 flex-shrink-0 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Client Details</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          {clientInfo.avatar ? (
                            <img 
                              src={clientInfo.avatar} 
                              alt="Client" 
                              className="w-12 h-12 rounded-full"
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.nextSibling.style.display = 'flex'
                              }}
                            />
                          ) : null}
                          <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center" style={{display: clientInfo.avatar ? 'none' : 'flex'}}>
                            <User className="w-6 h-6 text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                              {clientInfo.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {clientInfo.countryCode ? (
                                <ReactCountryFlag 
                                  countryCode={clientInfo.countryCode} 
                                  svg 
                                  style={{
                                    width: '16px',
                                    height: '12px',
                                  }}
                                  title={clientInfo.country}
                                />
                              ) : (
                                <div className="w-4 h-3 bg-gray-300 dark:bg-gray-600 rounded-sm flex items-center justify-center">
                                  <span className="text-xs text-gray-500">?</span>
                                </div>
                              )}
                              <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {clientInfo.city ? `${clientInfo.city}, ${clientInfo.country}` : clientInfo.country}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          {/* Rating with stars and review count */}
                          <div className="space-y-1">
                            {clientInfo.rating > 0 ? (
                              <div className="flex items-center gap-2">
                                <StarRating 
                                  rating={clientInfo.rating} 
                                  size="w-3 h-3" 
                                  showValue={true}
                                />
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-3 h-3 text-gray-300 fill-current" />
                                  ))}
                                </div>
                                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">No rating</span>
                              </div>
                            )}
                            
                            {clientInfo.reviewCount > 0 && (
                              <div className="text-gray-600 dark:text-gray-400">
                                {clientInfo.reviewCount} review{clientInfo.reviewCount !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                          
                          {/* Completion stats */}
                          {(clientInfo.completionRate !== null || clientInfo.onTimeRate !== null || clientInfo.onBudgetRate !== null) && (
                            <div className="space-y-1">
                              {clientInfo.completionRate !== null && (
                                <div className="text-gray-600 dark:text-gray-400">
                                  {Math.round(clientInfo.completionRate * 100)}% completion rate
                                </div>
                              )}
                              {clientInfo.onTimeRate !== null && (
                                <div className="text-gray-600 dark:text-gray-400">
                                  {Math.round(clientInfo.onTimeRate * 100)}% on time
                                </div>
                              )}
                              {clientInfo.onBudgetRate !== null && (
                                <div className="text-gray-600 dark:text-gray-400">
                                  {Math.round(clientInfo.onBudgetRate * 100)}% on budget
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Verification badges */}
                          <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Client Verification</p>
                            <div className="grid grid-cols-3 gap-2">
                              {/* Identity Verification */}
                              <div 
                                className="flex items-center justify-center p-2 rounded-lg cursor-help transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                                title={clientInfo.isIdentityVerified ? "Identity verified - Client has verified their identity" : "Identity not verified - Client has not verified their identity"}
                              >
                                <UserCheck className={`w-4 h-4 ${clientInfo.isIdentityVerified ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`} />
                              </div>
                              
                              {/* Payment Verification */}
                              <div 
                                className="flex items-center justify-center p-2 rounded-lg cursor-help transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                                title={clientInfo.isPaymentVerified ? "Payment verified - Client has verified their payment method" : "Payment not verified - Client has not verified their payment method"}
                              >
                                <Shield className={`w-4 h-4 ${clientInfo.isPaymentVerified ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`} />
                              </div>
                              
                              {/* Deposit Made */}
                              <div 
                                className="flex items-center justify-center p-2 rounded-lg cursor-help transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                                title={clientInfo.isDepositMade ? "Deposit made - Client has made a deposit on their account" : "No deposit - Client has not made a deposit"}
                              >
                                <CreditCard className={`w-4 h-4 ${clientInfo.isDepositMade ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`} />
                              </div>
                              
                              {/* Email Verification */}
                              <div 
                                className="flex items-center justify-center p-2 rounded-lg cursor-help transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                                title={clientInfo.isEmailVerified ? "Email verified - Client has verified their email address" : "Email not verified - Client has not verified their email address"}
                              >
                                <Mail className={`w-4 h-4 ${clientInfo.isEmailVerified ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`} />
                              </div>
                              
                              {/* Profile Completed */}
                              <div 
                                className="flex items-center justify-center p-2 rounded-lg cursor-help transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                                title={clientInfo.isProfileCompleted ? "Profile completed - Client has completed their profile" : "Profile incomplete - Client has not completed their profile"}
                              >
                                <CheckCircle className={`w-4 h-4 ${clientInfo.isProfileCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`} />
                              </div>
                              
                              {/* Phone Verification */}
                              <div 
                                className="flex items-center justify-center p-2 rounded-lg cursor-help transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                                title={clientInfo.isPhoneVerified ? "Phone verified - Client has verified their phone number" : "Phone not verified - Client has not verified their phone number"}
                              >
                                <Phone className={`w-4 h-4 ${clientInfo.isPhoneVerified ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`} />
                              </div>
                            </div>
                          </div>
                          
                          {/* Member since */}
                          {clientInfo.memberSince && (
                            <div className="text-gray-600 dark:text-gray-400 pt-1 border-t border-gray-200 dark:border-gray-600">
                              Member since {new Date(clientInfo.memberSince * 1000).getFullYear()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default FreelancerBids