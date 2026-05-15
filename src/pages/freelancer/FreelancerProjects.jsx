import { useState, useEffect, useRef } from 'react'
import { ExternalLink, DollarSign, Clock, Users, RefreshCw, AlertCircle, RotateCcw, User, Search, ChevronDown, ChevronUp, Star, Shield, CreditCard, Mail, Phone, UserCheck, CheckCircle, Briefcase } from 'lucide-react'
import toast from 'react-hot-toast'
import { logError } from '../../utils/logger'
import freelancerSync from '../../utils/freelancerSync'
import ReactCountryFlag from 'react-country-flag'
import BidModal from '../../modals/BidModal'
import StarRating from '../../components/StarRating'
import gif from '../../assets/gif.gif'



const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const FreelancerProjects = () => {
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState('checking')
  const [syncStatus, setSyncStatus] = useState(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastLoadTime, setLastLoadTime] = useState(null)
  const [maxBids, setMaxBids] = useState(() => {
    // Get saved max bids from cookies, default to 35
    const savedMaxBids = document.cookie
      .split('; ')
      .find(row => row.startsWith('maxBids='))
    
    if (savedMaxBids) {
      const value = savedMaxBids.split('=')[1]
      return value || '35'
    }
    return '35'
  })
  const [generatedProposals, setGeneratedProposals] = useState(new Set())
  const [processingProposals, setProcessingProposals] = useState(new Set())
  const [expandedDescriptions, setExpandedDescriptions] = useState(new Set())
  const [fullDescriptions, setFullDescriptions] = useState({})
  const [enrichedClients, setEnrichedClients] = useState({})
  const [loadingDescriptions, setLoadingDescriptions] = useState(false)
  const [showBidModal, setShowBidModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [suggestedBidAmount, setSuggestedBidAmount] = useState(0)
  const [fetchingDetails, setFetchingDetails] = useState(new Set())
  const [projectOwnerMap, setProjectOwnerMap] = useState({})
  const abortControllerRef = useRef(null)
  const isMountedRef = useRef(true)

  // Save max bids to cookies whenever it changes
  const handleMaxBidsChange = (value) => {
    setMaxBids(value)
    
    // Save to cookies with 30 day expiry
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + 30)
    document.cookie = `maxBids=${value}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`
  }
  const getGeneratedProposalsCookie = () => {
    try {
      const cookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('generatedProposals='))
      if (cookie) {
        const value = cookie.split('=')[1]
        const decoded = JSON.parse(decodeURIComponent(value))
        return new Set(decoded)
      }
    } catch (error) {
      console.error('Error reading generated proposals cookie:', error)
    }
    return new Set()
  }

  const setGeneratedProposalsCookie = (proposalIds) => {
    try {
      const value = encodeURIComponent(JSON.stringify([...proposalIds]))
      // Set cookie to expire in 30 days
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + 30)
      const cookieString = `generatedProposals=${value}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`
      document.cookie = cookieString
    } catch (error) {
      console.error('Error setting generated proposals cookie:', error)
    }
  }

  const addGeneratedProposal = (projectId) => {
    setGeneratedProposals(prev => {
      const updatedSet = new Set([...prev, projectId.toString()])
      setGeneratedProposalsCookie(updatedSet)
      return updatedSet
    })
  }

  const isProposalGenerated = (projectId) => {
    return generatedProposals.has(projectId.toString())
  }

  const addProcessingProposal = (projectId) => {
    setProcessingProposals(prev => new Set([...prev, projectId.toString()]))
  }

  const removeProcessingProposal = (projectId) => {
    setProcessingProposals(prev => {
      const newSet = new Set(prev)
      newSet.delete(projectId.toString())
      return newSet
    })
  }

  const isProposalProcessing = (projectId) => {
    return processingProposals.has(projectId.toString())
  }

  // Description expansion helper functions
  const toggleDescriptionExpansion = (projectId) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(projectId.toString())) {
        newSet.delete(projectId.toString())
      } else {
        newSet.add(projectId.toString())
      }
      return newSet
    })
  }

  const isDescriptionExpanded = (projectId) => {
    return expandedDescriptions.has(projectId.toString())
  }

  // Fetch full descriptions for projects
  const fetchFullDescriptions = async (projectsToFetch) => {
    if (projectsToFetch.length === 0) return
    
    setLoadingDescriptions(true)
    const token = localStorage.getItem('token')
    
    // Add projects to fetching set
    setFetchingDetails(prev => {
      const newSet = new Set(prev)
      projectsToFetch.forEach(p => newSet.add(p.id.toString()))
      return newSet
    })
    
    console.log('🔍 Fetching full descriptions for', projectsToFetch.length, 'projects...')
    
    try {
      // Fetch descriptions in batches
      const batchSize = 3
      for (let i = 0; i < projectsToFetch.length; i += batchSize) {
        // Check if component is still mounted and not aborted
        if (!isMountedRef.current) break
        
        const batch = projectsToFetch.slice(i, i + batchSize)
        
        await Promise.all(batch.map(async (project) => {
          try {
            // Check for abort signal
            const signal = abortControllerRef.current?.signal
            
            const response = await fetch(`${API_URL}/api/freelancer/project/${project.id}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              signal
            })
            
            if (response.ok) {
              const projectDetails = await response.json()
              const fullDescription = projectDetails.description || projectDetails.preview_description || project.preview_description || project.description || 'NO_DESCRIPTION_AVAILABLE'
              
              if (isMountedRef.current) {
                setFullDescriptions(prev => ({ ...prev, [project.id]: fullDescription }))
                if (projectDetails.owner) {
                  const ownerId = projectDetails.owner_id || projectDetails.owner.id
                  
                  // Map the project to its true owner ID since the initial fetch might omit it
                  if (ownerId) {
                    setProjectOwnerMap(prev => ({ ...prev, [project.id.toString()]: ownerId }))
                  }
                  
                  setEnrichedClients(prev => {
                    const clientKey = ownerId || `project_${project.id}`
                    const existingClient = prev[clientKey] || project.client || {}
                    const newOwner = projectDetails.owner
                    
                    const mergedClient = {
                        ...existingClient,
                        ...newOwner,
                        // Safely preserve or merge nested objects
                        status: newOwner.status?.payment_verified !== undefined 
                          ? newOwner.status 
                          : (existingClient.status || newOwner.status),
                        reputation: newOwner.reputation?.entire_site 
                          ? newOwner.reputation 
                          : (existingClient.reputation || newOwner.reputation),
                        verification: newOwner.verification?.payment_verified !== undefined 
                          ? newOwner.verification 
                          : (existingClient.verification || newOwner.verification),
                        location: newOwner.location?.country 
                          ? newOwner.location 
                          : (existingClient.location || newOwner.location),
                        country: newOwner.country?.name 
                          ? newOwner.country 
                          : (existingClient.country || newOwner.country)
                    }
                    
                    return {
                      ...prev,
                      [clientKey]: mergedClient
                    }
                  })
                }
                console.log(`✅ Fetched full description and client details for project ${project.id}`)
              }
            }
          } catch (error) {
            if (error.name === 'AbortError') {
              console.log(`⏹️ Aborted fetching description for project ${project.id}`)
            } else {
              console.log(`❌ Error fetching description for project ${project.id}:`, error.message)
            }
          } finally {
            if (isMountedRef.current) {
              setFetchingDetails(prev => {
                const newSet = new Set(prev)
                newSet.delete(project.id.toString())
                return newSet
              })
            }
          }
        }))
        
        // Small delay between batches
        if (i + batchSize < projectsToFetch.length && isMountedRef.current) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingDescriptions(false)
      }
    }
  }

  useEffect(() => {
    console.log('🚀 FreelancerProjects mounted')
    isMountedRef.current = true
    abortControllerRef.current = new AbortController()
    
    // Load generated proposals from cookies
    const savedProposals = getGeneratedProposalsCookie()
    setGeneratedProposals(savedProposals)
    
    const initialize = async () => {
      checkConnection()
      if (freelancerSync.isConnected()) {
        loadProjects()
      }
    }
    
    initialize()
    
    return () => {
      console.log('👋 FreelancerProjects unmounting, aborting background tasks')
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  useEffect(() => {
    if (connectionStatus === 'connected') {
      loadProjects()
    }
  }, [connectionStatus])

  // Sync state with cookies whenever state changes
  useEffect(() => {
    if (generatedProposals.size > 0) {
      const cookieProposals = getGeneratedProposalsCookie()
      const stateArray = [...generatedProposals]
      const cookieArray = [...cookieProposals]
      
      // Check if they're different and sync if needed
      if (JSON.stringify(stateArray.sort()) !== JSON.stringify(cookieArray.sort())) {
        setGeneratedProposalsCookie(generatedProposals)
      }
    }
  }, [generatedProposals])

  const checkConnection = () => {
    const isConnected = freelancerSync.isConnected()
    
    if (isConnected) {
      setConnectionStatus('connected')
      console.log('✅ Connected to Freelancer via stored credentials')
    } else {
      setConnectionStatus('disconnected')
      console.log('❌ Not connected to Freelancer')
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    setSyncStatus(null)
    
    try {
      const result = await freelancerSync.syncCredentials()
      setSyncStatus(result)
      
      if (result.success) {
        toast.success(result.message)
        setConnectionStatus('connected')
        loadProjects()
      } else {
        toast.error(result.message)
        setConnectionStatus('disconnected')
      }
    } catch (error) {
      const errorMsg = `Sync failed: ${error.message}`
      setSyncStatus({
        success: false,
        message: errorMsg,
        connected: false
      })
      toast.error(errorMsg)
      setConnectionStatus('error')
    } finally {
      setIsSyncing(false)
    }
  }

  const loadProjects = async (force = false) => {
    if (connectionStatus !== 'connected') return

    // Avoid loading too frequently (cache for 30 seconds)
    if (!force && lastLoadTime) {
      const timeSinceLoad = Date.now() - lastLoadTime
      if (timeSinceLoad < 30000) {
        console.log('⚡ Using cached projects (loaded', Math.round(timeSinceLoad / 1000), 'seconds ago)')
        return
      }
    }

    setIsLoading(true)
    try {
      console.log('🔍 Loading projects using backend API...')
      const startTime = Date.now()

      const token = localStorage.getItem('token')
      const url = new URL(`${API_URL}/api/freelancer/projects`)
      
      // Use default sorting (newest first) like the extension
      // No search parameters since search was removed

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to load projects: ${response.status}`)
      }

      const data = await response.json()
      const projects = data.projects || []
      const users = data.users || {}

      const loadTime = Date.now() - startTime
      console.log(`✅ Successfully fetched ${projects.length} projects in ${loadTime}ms`)
      console.log(`👥 Users data available: ${Object.keys(users).length} users`)
      
      // Merge user data with projects and fetch full descriptions
      const enrichedProjects = projects.map(project => {
        const client = project.owner_id ? users[project.owner_id] : null
        
        return {
          ...project,
          client: client
        }
      })
      
      setProjects(enrichedProjects)
      setIsLoading(false) // SHOW PROJECTS IMMEDIATELY
      
      // Fetch full descriptions for projects that don't have them cached
      const projectsNeedingDescriptions = enrichedProjects.filter(project => !fullDescriptions[project.id])
      if (projectsNeedingDescriptions.length > 0) {
        // Don't await this, let it run in background
        fetchFullDescriptions(projectsNeedingDescriptions)
      }
      
      setLastLoadTime(Date.now())
    } catch (error) {
      logError('Failed to load projects', error)
      toast.error('Failed to load projects: ' + error.message)
      setIsLoading(false)
    }
  }

  // Removed handleSearch function as search functionality was removed

  const handleGenerateBid = async (project) => {
    // Disable button by adding to processing set
    addProcessingProposal(project.id)
    
    const loadingToast = toast.loading('Fetching full project details...')
    
    try {
      const token = localStorage.getItem('token')
      
      // Use the full description that was already fetched
      const fullDescription = fullDescriptions[project.id] || project.preview_description || project.description || 'NO_DESCRIPTION_AVAILABLE'
      console.log('✅ Using cached full project description:', fullDescription.length, 'characters')

      toast.loading('Generating proposal...', { id: loadingToast })
      
      // Convert posted time to proper format (like in leads schema)
      const postedTime = project.time_submitted ? new Date(project.time_submitted * 1000).toISOString() : null
      
      // Prepare project data for the webhook with full description
      const projectData = {
        id: project.id,
        title: project.title || 'UNTITLED_PROJECT',
        description: fullDescription,
        preview_description: project.preview_description || '',
        url: `https://www.freelancer.com/projects/${project.seo_url || project.id}`,
        budget: {
          minimum: project.budget?.minimum || 0,
          maximum: project.budget?.maximum || project.budget?.minimum || 0,
          currency: (() => {
            if (project.budget?.currency) {
              if (typeof project.budget.currency === 'string') {
                return project.budget.currency
              } else if (project.budget.currency.code) {
                return project.budget.currency.code
              } else if (project.budget.currency.id === 1) {
                return 'USD'
              }
            }
            return 'USD'
          })()
        },
        posted: formatTimeAgo(project.time_submitted), // Human readable format like "5 min ago"
        posted_time: postedTime, // ISO datetime format for database storage
        bid_count: project.bid_stats?.bid_count || 0,
        skills: project.jobs?.map(job => job.name) || [],
        client: project.client ? {
          name: project.client.display_name || project.client.username || 'Unknown Client',
          country: project.client.location?.country?.name || project.client.country?.name || 'Unknown',
          review_count: project.client.reputation?.entire_site?.overall?.count || 0
        } : null,
        delivery_time: project.time_free_bids_end ? 
          `${Math.ceil((project.time_free_bids_end * 1000 - Date.now()) / (1000 * 60 * 60 * 24))} days` 
          : '7 days'
      }

      const response = await fetch(`${API_URL}/api/freelancer/generate-proposal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(projectData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Failed to generate proposal')
      }

      // Store project ID in cookies when proposal is successfully generated
      addGeneratedProposal(project.id)
      
      // Small delay to ensure state and cookie are properly updated
      await new Promise(resolve => setTimeout(resolve, 100))

      // Create a lead entry in the database with the generated proposal
      try {
        const leadData = {
          platform: 'Freelancer',
          title: project.title || 'UNTITLED_PROJECT',
          budget: formatBudget(project.budget, project),
          posted: formatTimeAgo(project.time_submitted),
          posted_time: postedTime,
          status: 'AI Drafted',
          score: '8',
          description: fullDescription,
          proposal: data.data?.proposal || data.proposal || 'Proposal generated successfully',
          url: `https://www.freelancer.com/projects/${project.seo_url || project.id}`,
          project_id: project.id,
          project_type: getProjectType(project).type
        }

        console.log('💾 Creating lead with proposal data:', {
          project_id: leadData.project_id,
          title: leadData.title,
          proposalLength: leadData.proposal.length,
          proposalPreview: leadData.proposal.substring(0, 100) + '...'
        })

        const createLeadResponse = await fetch(`${API_URL}/api/leads/bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            user_id: null, // Will be set by backend from token
            leads: [leadData]
          })
        })

        if (createLeadResponse.ok) {
          const leadResult = await createLeadResponse.json()
          console.log('✅ Created lead entry in database for project:', project.id, 'Result:', leadResult)
        } else {
          const errorText = await createLeadResponse.text()
          console.log('⚠️ Failed to create lead entry:', errorText)
        }
      } catch (leadError) {
        console.log('⚠️ Error creating lead entry:', leadError.message)
      }

      toast.success('Proposal generated successfully!', { id: loadingToast })
      
      // You can handle the response data here (e.g., show the generated proposal in a modal)
      console.log('Generated proposal:', data)
      
    } catch (error) {
      logError('Failed to generate proposal', error)
      toast.error(error.message || 'Failed to generate proposal', { id: loadingToast })
    } finally {
      // Re-enable button by removing from processing set
      removeProcessingProposal(project.id)
    }
  }

  const handleBidOnProject = async (project) => {
    // Calculate suggested bid amount (average of min and max budget, rounded to tens)
    let suggested = 50 // Default minimum
    
    if (project.budget) {
      const minBudget = project.budget.minimum || 0
      const maxBudget = project.budget.maximum || minBudget
      
      if (minBudget > 0) {
        // Calculate average and round to nearest 10
        const average = (minBudget + maxBudget) / 2
        suggested = Math.max(Math.round(average / 10) * 10, 50)
      }
    }
    
    setSuggestedBidAmount(suggested)
    setSelectedProject(project)
    setShowBidModal(true)
  }

  // Helper function to get fresh Freelancer credentials from extension
  const getExtensionCredentials = async () => {
    return new Promise((resolve) => {
      // Check if we're in a browser environment with extension support
      if (typeof window === 'undefined' || !window.postMessage) {
        resolve(null)
        return
      }

      const requestId = Date.now().toString()
      
      // Set up listener for response
      const handleMessage = (event) => {
        if (event.origin !== window.location.origin) return
        
        if (event.data.type === 'EXTENSION_STORAGE_RESPONSE' && event.data.requestId === requestId) {
          window.removeEventListener('message', handleMessage)
          if (event.data.success) {
            resolve(event.data.data)
          } else {
            resolve(null)
          }
        }
      }
      
      window.addEventListener('message', handleMessage)
      
      // Request credentials from extension
      window.postMessage({
        type: 'EXTENSION_GET_STORAGE',
        requestId: requestId,
        keys: ['accessToken', 'capturedToken', 'isValidated', 'userId', 'freelancerCookies']
      }, window.location.origin)
      
      // Timeout after 2 seconds
      setTimeout(() => {
        window.removeEventListener('message', handleMessage)
        resolve(null)
      }, 2000)
    })
  }

  // Handle bid placement with manual amount
  const handlePlaceBid = async (manualAmount) => {
    if (!selectedProject) {
      throw new Error('No project selected')
    }

    try {
      const bidAmountNum = parseFloat(manualAmount)
      if (isNaN(bidAmountNum) || bidAmountNum <= 0) {
        throw new Error('Please enter a valid bid amount')
      }

      // Get the proposal for this project
      const token = localStorage.getItem('token')
      let proposal = 'Thank you for considering my proposal. I am confident I can deliver excellent results for your project.'
      
      // Try to get existing proposal from leads
      try {
        const response = await fetch(`${API_URL}/api/leads?platform=Freelancer&limit=100`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          const leads = data.leads || []
          
          // Look for a lead that matches this project
          const existingLead = leads.find(lead => 
            lead.title === selectedProject.title || 
            lead.project_id === selectedProject.id ||
            lead.id === selectedProject.id
          )

          if (existingLead) {
            // Check multiple possible field names for the proposal
            const proposalText = existingLead.proposal || existingLead.Proposal || existingLead.description
            if (proposalText && proposalText !== 'Proposal generated successfully!' && proposalText.length > 50) {
              proposal = proposalText
              console.log('✅ Found existing proposal for project:', selectedProject.id, 'Length:', proposal.length)
            } else {
              console.log('⚠️ Found lead but no valid proposal text, using default')
            }
          } else {
            console.log('⚠️ No matching lead found for project:', selectedProject.id)
          }
        }
      } catch (error) {
        console.log('Could not fetch existing proposal, using default:', error.message)
      }

      // If we still don't have a good proposal, try to generate one on the fly
      if (proposal === 'Thank you for considering my proposal. I am confident I can deliver excellent results for your project.') {
        console.log('🔄 No existing proposal found, attempting to generate one for bidding...')
        try {
          const fullDescription = fullDescriptions[selectedProject.id] || selectedProject.preview_description || selectedProject.description || 'NO_DESCRIPTION_AVAILABLE'
          
          const projectData = {
            id: selectedProject.id,
            title: selectedProject.title || 'UNTITLED_PROJECT',
            description: fullDescription,
            preview_description: selectedProject.preview_description || '',
            url: `https://www.freelancer.com/projects/${selectedProject.seo_url || selectedProject.id}`,
            budget: {
              minimum: selectedProject.budget?.minimum || 0,
              maximum: selectedProject.budget?.maximum || selectedProject.budget?.minimum || 0,
              currency: (() => {
                if (selectedProject.budget?.currency) {
                  if (typeof selectedProject.budget.currency === 'string') {
                    return selectedProject.budget.currency
                  } else if (selectedProject.budget.currency.code) {
                    return selectedProject.budget.currency.code
                  } else if (selectedProject.budget.currency.id === 1) {
                    return 'USD'
                  }
                }
                return 'USD'
              })()
            },
            posted: formatTimeAgo(selectedProject.time_submitted),
            posted_time: selectedProject.time_submitted ? new Date(selectedProject.time_submitted * 1000).toISOString() : null,
            bid_count: selectedProject.bid_stats?.bid_count || 0,
            skills: selectedProject.jobs?.map(job => job.name) || [],
            client: selectedProject.client ? {
              name: selectedProject.client.display_name || selectedProject.client.username || 'Unknown Client',
              country: selectedProject.client.location?.country?.name || selectedProject.client.country?.name || 'Unknown',
              review_count: selectedProject.client.reputation?.entire_site?.overall?.count || 0
            } : null,
            delivery_time: selectedProject.time_free_bids_end ? 
              `${Math.ceil((selectedProject.time_free_bids_end * 1000 - Date.now()) / (1000 * 60 * 60 * 24))} days` 
              : '7 days'
          }

          const generateResponse = await fetch(`${API_URL}/api/freelancer/generate-proposal`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(projectData)
          })

          if (generateResponse.ok) {
            const generateData = await generateResponse.json()
            const generatedProposal = generateData.data?.proposal || generateData.proposal
            if (generatedProposal && generatedProposal.length > 50) {
              proposal = generatedProposal
              console.log('✅ Generated fresh proposal for bidding, length:', proposal.length)
            }
          }
        } catch (generateError) {
          console.log('⚠️ Could not generate fresh proposal:', generateError.message)
        }
      }

      // Extract project ID
      let projectId = selectedProject.id
      
      console.log('🎯 Bidding on project:', {
        projectId: projectId,
        amount: bidAmountNum,
        title: selectedProject.title
      })

      // Try to get credentials from extension first
      const extCredentials = await getExtensionCredentials()
      
      console.log('🔍 Extension credentials check:', {
        hasCredentials: !!extCredentials,
        hasAccessToken: !!(extCredentials?.accessToken || extCredentials?.capturedToken),
        hasUserId: !!extCredentials?.userId,
        hasFreelancerCookies: !!extCredentials?.freelancerCookies,
        isValidated: extCredentials?.isValidated,
        userId: extCredentials?.userId,
        accessTokenLength: extCredentials?.accessToken?.length || extCredentials?.capturedToken?.length || 0
      })
      
      // Check if we have the minimum required credentials
      if (!extCredentials || (!extCredentials.accessToken && !extCredentials.capturedToken && !extCredentials.freelancerCookies)) {
        throw new Error('Extension not connected to Freelancer. Please open the extension and connect to Freelancer first.')
      }
      
      if (!extCredentials.isValidated) {
        throw new Error('Freelancer credentials not validated. Please reconnect the extension to Freelancer.')
      }
      
      // Use the exact same API call as the extension
      const bidResponse = await fetch(`${API_URL}/api/bid/place`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          access_token: extCredentials?.accessToken || extCredentials?.capturedToken || 'using_cookies',
          project_id: parseInt(projectId),
          bidder_id: parseInt(extCredentials?.userId || 0),
          amount: bidAmountNum,
          period: 7,
          description: proposal,
          milestone_percentage: 100,
          freelancer_cookies: extCredentials?.freelancerCookies || null
        })
      })

      const result = await bidResponse.json()
      console.log('🎯 Bid API Response:', result)

      if (result.success) {
        console.log('✅ Bid placed successfully:', result)
        // Don't close modal here - let BidModal handle success state
        // The modal will close automatically after showing success message
        return // Success - let the modal handle the UI
      } else {
        console.log('❌ Bid failed with error:', result.error)
        
        // Check if credentials are expired
        if (result.error && (result.error.includes('401') || result.error.includes('expired') || result.error.includes('unauthorized'))) {
          // Open Freelancer.com to refresh session
          window.open('https://www.freelancer.com/dashboard', '_blank')
          
          // Copy proposal to clipboard as fallback
          try {
            await navigator.clipboard.writeText(proposal)
          } catch (clipError) {
            logError('Failed to copy proposal text', clipError)
          }
          
          throw new Error('Freelancer credentials expired. Please log in to Freelancer.com in the new tab, then try again.')
        } else {
          // Show the actual error message from Freelancer
          throw new Error(result.error || 'Failed to place bid')
        }
      }

    } catch (bidError) {
      logError('Bid placement error', bidError)
      throw bidError // Re-throw for modal to handle
    }
  }

  const handleViewProposal = async (project) => {
    const loadingToast = toast.loading('Loading proposal...')
    
    try {
      const token = localStorage.getItem('token')
      
      // First, try to find an existing lead with this project ID
      const response = await fetch(`${API_URL}/api/leads?platform=Freelancer&limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        const leads = data.leads || []
        
        // Look for a lead that matches this project (by title and project ID)
        const existingLead = leads.find(lead => 
          lead.title === project.title || 
          lead.project_id === project.id ||
          lead.id === project.id
        )

        if (existingLead) {
          // Found existing lead with proposal data
          console.log('✅ Found existing lead with proposal:', existingLead.id)
          
          // Ensure project_id is set and proposal field is properly mapped
          const leadWithProjectId = {
            ...existingLead,
            project_id: existingLead.project_id || project.id,
            // Ensure proposal is in the correct field (some APIs might use different field names)
            Proposal: existingLead.proposal || existingLead.Proposal || existingLead.description || 'Proposal will be generated when you open the Proposals page...'
          }
          
          localStorage.setItem('editingLead', JSON.stringify(leadWithProjectId))
          toast.success('Proposal loaded!', { id: loadingToast })
          
          // Navigate to Proposals page
          window.dispatchEvent(new CustomEvent('navigateToProposals'))
          return
        }
      }

      // If no existing lead found, create a new lead data structure
      console.log('⚠️ No existing lead found, creating new lead data for project:', project.id)
      
      const leadData = {
        id: project.id, // Use project.id as the lead id
        project_id: project.id, // Store original project ID
        platform: 'Freelancer', // Since this is from FreelancerProjects
        title: project.title || 'UNTITLED_PROJECT',
        description: fullDescriptions[project.id] || project.preview_description || project.description || 'NO_DESCRIPTION_AVAILABLE',
        budget: formatBudget(project.budget, project),
        posted: formatTimeAgo(project.time_submitted),
        posted_time: project.time_submitted ? new Date(project.time_submitted * 1000).toISOString() : null,
        status: 'AI Drafted', // Default status for generated proposals
        score: '8', // Default score
        url: `https://www.freelancer.com/projects/${project.seo_url || project.id}`,
        Proposal: 'Proposal will be generated when you open the Proposals page...', // Placeholder
        bid_stats: project.bid_stats,
        jobs: project.jobs,
        client: project.client,
        project_type: getProjectType(project).type
      }

      // Store the lead data in localStorage for the Proposals page
      localStorage.setItem('editingLead', JSON.stringify(leadData))
      
      toast.success('Opening proposal editor...', { id: loadingToast })
      
      // Navigate to Proposals page
      window.dispatchEvent(new CustomEvent('navigateToProposals'))
      
      console.log('📄 Navigating to Proposals page with project:', project.id)
      
    } catch (error) {
      logError('Failed to load proposal', error)
      toast.error('Failed to load proposal', { id: loadingToast })
    }
  }

  const formatBudget = (budget, project = null) => {
    if (!budget) return 'Not specified'
    

    
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
        currency = countryCurrencyMap[clientCountry]
      }
    }
    
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

  const getProjectType = (project) => {

    
    // Check for project type in various possible fields
    const type = project.type || project.project_type || project.budget?.type || project.type_id
    
    // Handle both string and numeric type values
    if (type === 'fixed' || type === 'FIXED' || type === 1 || type === '1') {
      return { type: 'Fixed', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' }
    } else if (type === 'hourly' || type === 'HOURLY' || type === 2 || type === '2') {
      return { type: 'Hourly', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' }
    }
    
    // Fallback: try to determine from budget structure
    if (project.budget) {
      // If there's an hourly_rate field or the budget has hourly indicators
      if (project.budget.hourly_rate || project.budget.per_hour) {
        return { type: 'Hourly', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' }
      }
      // If it has minimum/maximum without hourly indicators, likely fixed
      if (project.budget.minimum || project.budget.maximum) {
        return { type: 'Fixed', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' }
      }
    }
    
    // Default fallback
    return { type: 'Fixed', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' }
  }

  const getClientInfo = (project) => {
    // Look up ownerId from project OR the map (in case API hid it initially)
    const resolvedOwnerId = project.owner_id || projectOwnerMap[project.id.toString()]
    const ownerId = resolvedOwnerId ? resolvedOwnerId.toString() : null
    
    // Fall back to looking up by project ID if owner ID is missing entirely
    const client = (ownerId && enrichedClients[ownerId]) || enrichedClients[`project_${project.id}`] || project.client
    if (!client) return null
    

    
    // Extract country code
    let countryCode = null
    if (client.location?.country?.code) {
      countryCode = client.location.country.code.toUpperCase()
    } else if (client.country?.code) {
      countryCode = client.country.code.toUpperCase()
    }
    
    // Extract reputation data (reviews/hires)
    let reviewCount = 0
    let rating = 0
    
    if (client.reputation) {
      if (client.reputation.entire_site?.overall) {
        reviewCount = client.reputation.entire_site.overall.count || 0
        rating = client.reputation.entire_site.overall.rating || 0
      } else {
        reviewCount = client.reputation.count || client.reputation.review_count || 0
        rating = client.reputation.rating || client.reputation.avg_rating || 0
      }
    }
    
    // Check payment verification from multiple possible API fields
    const isPaymentVerified = 
      client.status?.payment_verified === true || 
      client.status?.payment_method_verified === true || 
      client.payment_verified === true || 
      client.payment_method_verified === true || 
      client.verification?.payment_verified === true ||
      client.verification?.payment_method_verified === true
      
    return {
      name: client.display_name || client.username || 'Unknown Client',
      country: client.location?.country?.name || client.country?.name || 'Unknown',
      countryCode,
      reviewCount,
      rating,
      isPaymentVerified,
      hasRichData: !!(client.reputation && (client.status || client.verification)),
      avatar: client.avatar_large_url || client.avatar_url
    }
  }

  if (connectionStatus !== 'connected') {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Not Connected to Freelancer.com
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {syncStatus?.needsValidation 
              ? 'Freelancer credentials found but not validated. Please validate using the extension.'
              : syncStatus?.needsReconnect
              ? 'Freelancer credentials incomplete. Please reconnect using the extension.'
              : 'No Freelancer credentials found. Please connect using the browser extension first.'
            }
          </p>
          
          {syncStatus && !syncStatus.success && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-300 text-sm">{syncStatus.message}</p>
            </div>
          )}
          
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RotateCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Credentials'}
            </button>
            <button
              onClick={checkConnection}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Check Connection
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Filter and sort projects based on max bid count and posted time (latest first)
  const filteredProjects = projects
    .filter(project => {
      if (!maxBids || maxBids === '') return true
      
      const bidCount = project.bid_stats?.bid_count || 0
      const maxBidCount = parseInt(maxBids)
      
      return !isNaN(maxBidCount) && bidCount <= maxBidCount
    })
    .sort((a, b) => {
      // Sort by time_submitted (latest first)
      const timeA = a.time_submitted || 0
      const timeB = b.time_submitted || 0
      return timeB - timeA
    })

  return (
    <div className="p-6 space-y-6">
      {/* Max Bids Filter */}
      <div className="flex justify-between items-center">
        <span className="text-m text-gray-600 dark:text-gray-400">
          {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
        </span>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="number"
            placeholder="Max bids"
            value={maxBids}
            onChange={(e) => handleMaxBidsChange(e.target.value)}
            className="pl-10 pr-4 py-2 w-32 bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            min="0"
          />
        </div>
      </div>



      {/* Projects List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <img
              src={gif}
              alt="AK BPO AI Logo"
              className="h-12 object-contain mx-auto mb-4"
            />
            <p className="text-gray-600 dark:text-gray-400">Loading projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">
              {projects.length === 0 
                ? "No projects found matching your criteria."
                : maxBids 
                ? `No projects found with ${maxBids} or fewer bids.`
                : "No projects found."
              }
            </p>
          </div>
        ) : (
          filteredProjects.map((project) => (
            <div key={project.id} className="bg-white dark:bg-[#1f1f1f] rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex gap-6">
                {/* Main Content - 3/4 width */}
                <div className="flex-1">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {project.title || 'UNTITLED_PROJECT'}
                    </h3>
                    {(() => {
                      const hasFullDesc = fullDescriptions[project.id]
                      const fullDesc = hasFullDesc || project.preview_description || project.description || 'NO_DESCRIPTION_AVAILABLE'
                      const isExpanded = isDescriptionExpanded(project.id)
                      const shouldShowToggle = fullDesc.length > 200
                      
                      return (
                        <div>
                          <p 
                            className="text-gray-600 dark:text-gray-400 mb-2 whitespace-pre-wrap"
                            style={!isExpanded && shouldShowToggle ? {
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            } : {}}
                          >
                            {fullDesc}
                          </p>

                          {shouldShowToggle && (
                            <button
                              onClick={() => toggleDescriptionExpansion(project.id)}
                              className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium transition-colors"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="w-4 h-4" />
                                  Show less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4" />
                                  Show more
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )
                    })()}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4 text-center md:text-left">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Budget</p>
                      <div className="flex items-center gap-2 justify-center md:justify-start">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {formatBudget(project.budget, project)}
                        </span>
                        {(() => {
                          const projectType = getProjectType(project)
                          return (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${projectType.color}`}>
                              {projectType.type}
                            </span>
                          )
                        })()}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Bids</p>
                      <div className="flex items-center gap-1 justify-center md:justify-start">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {project.bid_stats?.bid_count || 0}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Posted</p>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatTimeAgo(project.time_submitted)}
                      </span>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Delivery Time</p>
                      <div className="flex items-center gap-1 justify-center md:justify-start">
                        <Clock className="w-4 h-4 text-purple-600" />
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {project.time_free_bids_end ? 
                            `${Math.ceil((project.time_free_bids_end * 1000 - Date.now()) / (1000 * 60 * 60 * 24))} days` 
                            : '7 days'
                          }
                        </span>
                      </div>
                    </div>

                    {/* Client Payment Verification */}
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Payment</p>
                      {(() => {
                        const isFetching = fetchingDetails.has(project.id.toString())
                        const clientInfo = getClientInfo(project)
                        
                        if (isFetching && (!clientInfo || !clientInfo.hasRichData)) {
                          return (
                            <div className="flex items-center gap-1 justify-center md:justify-start">
                              <span className="text-gray-400 font-medium">-</span>
                            </div>
                          )
                        }
                        
                        const isVerified = clientInfo?.isPaymentVerified
                        return (
                          <div className="flex items-center gap-1 justify-center md:justify-start">
                            {isVerified ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-blue-500" />
                                <span className="font-semibold text-blue-600 dark:text-blue-400">Verified</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-4 h-4 text-gray-400" />
                                <span className="font-semibold text-gray-500 dark:text-gray-400">Unverified</span>
                              </>
                            )}
                          </div>
                        )
                      })()}
                    </div>

                    {/* Client Hire History */}
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Client Hires</p>
                      {(() => {
                        const isFetching = fetchingDetails.has(project.id.toString())
                        const clientInfo = getClientInfo(project)
                        
                        if (isFetching && (!clientInfo || !clientInfo.hasRichData)) {
                          return (
                            <div className="flex items-center gap-1 justify-center md:justify-start">
                              <span className="text-gray-400 font-medium">-</span>
                            </div>
                          )
                        }
                        
                        const hireCount = clientInfo?.reviewCount || 0
                        return (
                          <div className="flex items-center gap-1 justify-center md:justify-start">
                            <Briefcase className="w-4 h-4 text-orange-500" />
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {hireCount > 0 ? `${hireCount} Hires` : 'No Hires'}
                            </span>
                          </div>
                        )
                      })()}
                    </div>
                  </div>

                  {project.jobs && project.jobs.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {project.jobs.slice(0, 5).map((skill) => (
                          <span
                            key={skill.id}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs rounded-full"
                          >
                            {skill.name}
                          </span>
                        ))}
                        {project.jobs.length > 5 && (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                            +{project.jobs.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex flex-col gap-2">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {project.owner && (
                          <span>Posted by {project.owner.display_name || project.owner.username}</span>
                        )}
                      </div>
                      <a
                        href={`https://www.freelancer.com/projects/${project.seo_url || project.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Project
                      </a>
                    </div>
                    {(() => {
                      const isGenerated = isProposalGenerated(project.id)
                      const isProcessing = isProposalProcessing(project.id)
                      const isFetching = fetchingDetails.has(project.id.toString())
                      
                      if (isGenerated) {
                        return (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewProposal(project)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleBidOnProject(project)}
                              disabled={isProcessing}
                              className={`px-4 py-2 text-white rounded-lg transition-colors ${
                                isProcessing
                                  ? 'bg-gray-400 cursor-not-allowed'
                                  : 'bg-blue-600 hover:bg-blue-700'
                              }`}
                            >
                              Bid
                            </button>
                          </div>
                        )
                      }
                      
                      return (
                        <button
                          onClick={() => handleGenerateBid(project)}
                          disabled={isProcessing || isFetching}
                          className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center gap-2 ${
                            isProcessing || isFetching
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          {isProcessing ? (
                            'Processing...'
                          ) : isFetching ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Fetching details...
                            </>
                          ) : (
                            'Generate Bid'
                          )}
                        </button>
                      )
                    })()}
                  </div>
                </div>


              </div>
            </div>
          ))
        )}
      </div>

      {/* Bid Amount Modal */}
      <BidModal
        isOpen={showBidModal}
        onClose={() => {
          setShowBidModal(false)
          setSelectedProject(null)
        }}
        onPlaceBid={handlePlaceBid}
        lead={selectedProject ? {
          ...selectedProject,
          platform: 'Freelancer',
          budget: formatBudget(selectedProject.budget, selectedProject),
          url: `https://www.freelancer.com/projects/${selectedProject.seo_url || selectedProject.id}`
        } : null}
        suggestedAmount={suggestedBidAmount}
      />
    </div>
  )
}

export default FreelancerProjects