import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Save, Send, Clock, DollarSign, Briefcase, Bot, Copy, Maximize2, Minimize2, Check, AlertCircle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { logDebug, logError } from '../utils/logger'
import ReactMarkdown from 'react-markdown'
import BidModal from '../modals/BidModal'
import ProposalGeneratorModal from '../modals/ProposalGeneratorModal'

const Proposals = () => {
  const [lead, setLead] = useState(null)
  const [proposal, setProposal] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [rightPanelView, setRightPanelView] = useState('description') // 'description' or 'assistant'
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState(null)
  const [freelancerConnectionStatus, setFreelancerConnectionStatus] = useState(null) // null, 'connected', 'expired', 'disconnected'
  const [showRetryBid, setShowRetryBid] = useState(false)
  const [lastBidData, setLastBidData] = useState(null)
  const [showBidModal, setShowBidModal] = useState(false)
  const [suggestedBidAmount, setSuggestedBidAmount] = useState(0)
  const [showProposalGenerator, setShowProposalGenerator] = useState(false)
  const [isGeneratedProposal, setIsGeneratedProposal] = useState(false)
  const chatMessagesEndRef = useRef(null)
  const isInitialChatLoad = useRef(true)

  useEffect(() => {
    // Get lead data from localStorage (set when clicking "Edit Draft")
    const storedLead = localStorage.getItem('editingLead')
    if (storedLead) {
      const leadData = JSON.parse(storedLead)
      setLead(leadData)
      setProposal(leadData.Proposal || '')
      setIsGeneratedProposal(false)
      
      // Check Freelancer connection status if it's a Freelancer lead
      if (leadData.platform === 'Freelancer') {
        checkFreelancerConnection()
      }
    } else {
      // No lead selected, show proposal generator modal
      setShowProposalGenerator(true)
    }
  }, [])

  // Check Freelancer connection status
  const checkFreelancerConnection = async () => {
    try {
      // Check extension credentials (same as extension does)
      const extCredentials = await getExtensionCredentials()
      
      if (extCredentials && (extCredentials.accessToken || extCredentials.capturedToken) && extCredentials.isValidated) {
        setFreelancerConnectionStatus('connected')
        setShowRetryBid(false) // Hide retry button if connection is restored
      } else {
        setFreelancerConnectionStatus('disconnected')
      }
    } catch (error) {
      console.warn('Failed to check Freelancer connection:', error)
      setFreelancerConnectionStatus('disconnected')
    }
  }

  // Retry bid placement with fresh credentials
  const retryBidPlacement = async () => {
    if (!lastBidData) return
    
    setIsApproving(true)
    const loadingToast = toast.loading('Retrying bid placement...')
    
    try {
      // Check for fresh credentials
      await checkFreelancerConnection()
      
      if (freelancerConnectionStatus === 'connected') {
        // Try the bid placement again
        await placeBidWithData(lastBidData, loadingToast)
        setShowRetryBid(false)
        setLastBidData(null)
      } else {
        toast.error('Please refresh your Freelancer session first', { id: loadingToast })
      }
    } catch (error) {
      logError('Retry bid error', error)
      toast.error(`Retry failed: ${error.message}`, { id: loadingToast })
    } finally {
      setIsApproving(false)
    }
  }

  // Helper function to place bid with given data
  const placeBidWithData = async (bidData, loadingToast) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    
    // Get fresh credentials from extension
    const extCredentials = await getExtensionCredentials()
    
    // Use the exact same API call as the extension
    const bidResponse = await fetch(`${API_URL}/api/bid/place`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        access_token: extCredentials?.accessToken || extCredentials?.capturedToken || 'using_cookies',
        project_id: parseInt(bidData.projectId),
        bidder_id: parseInt(extCredentials?.userId || 0),
        amount: bidData.amount,
        period: bidData.period || 7,
        description: bidData.message,
        milestone_percentage: 100,
        freelancer_cookies: extCredentials?.freelancerCookies || null
      })
    })

    const result = await bidResponse.json()

    if (result.success) {
      toast.success('Bid placed successfully!', { id: loadingToast })
      console.log('✅ Bid placed successfully:', result)
      return
    } else {
      throw new Error(result.error || 'Failed to place bid')
    }
  }

  // Load chat history when switching to assistant view
  useEffect(() => {
    const loadChatHistory = async () => {
      if (rightPanelView === 'assistant' && lead && lead.id) {
        setIsLoadingHistory(true)
        try {
          const token = localStorage.getItem('token')
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
          
          const response = await fetch(`${API_URL}/api/chat/history/${lead.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          if (response.ok) {
            const data = await response.json()
            if (data.messages && data.messages.length > 0) {
              setChatMessages(data.messages)
            } else {
              setChatMessages([])
            }
          }
        } catch (error) {
          logError('Error loading chat history', error)
          setChatMessages([])
        } finally {
          setIsLoadingHistory(false)
        }
      }
    }

    loadChatHistory()
  }, [rightPanelView, lead])

  // Auto-scroll to bottom only when new messages are added (not when switching views or loading history)
  useEffect(() => {
    // Skip auto-scroll on initial load or when loading history
    if (isInitialChatLoad.current || isLoadingHistory) {
      isInitialChatLoad.current = false
      return
    }

    // Only scroll if we're in assistant view and messages exist
    if (rightPanelView === 'assistant' && chatMessages.length > 0) {
      // Use a small delay to ensure the DOM is updated
      const timer = setTimeout(() => {
        chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [chatMessages.length]) // Only trigger on message count change

  const formatTime = (utcTime, timezone) => {
    if (!utcTime) return 'Unknown'
    
    try {
      const date = new Date(utcTime)
      
      if (timezone === 'UTC') {
        // UTC (International)
        return date.toLocaleString('en-US', {
          timeZone: 'UTC',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZoneName: 'short'
        })
      } else if (timezone === 'SA') {
        // South Africa (SAST - UTC+2)
        return date.toLocaleString('en-ZA', {
          timeZone: 'Africa/Johannesburg',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      
      }
      
      return date.toLocaleString()
    } catch (error) {
      logError('Error formatting proposal time', error)
      return 'Unknown'
    }
  }

  const handleSave = async () => {
    if (!lead || !lead.id) {
      toast.error('No lead selected')
      return
    }

    setIsSaving(true)
    try {
      const token = localStorage.getItem('token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      
      const requestBody = { 
        proposal,
        status: 'Drafted' // Update status to Drafted when saving
      }
      
      logDebug('Saving proposal with payload', requestBody)
      
      const response = await fetch(`${API_URL}/api/leads/${lead.id}/proposal`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to save proposal')
      }

      const data = await response.json()
      logDebug('Proposal save response', data)
      
      // Update localStorage and state with the updated lead
      if (data.lead) {
        logDebug('Updating local proposal lead status', data.lead.status)
        const updatedLead = {
          ...lead,
          ...data.lead,
          status: data.lead.status // Ensure status is updated
        }
        localStorage.setItem('editingLead', JSON.stringify(updatedLead))
        setLead(updatedLead)
      }
      
      toast.success('Proposal saved as Drafted!')
    } catch (error) {
      logError('Save error', error)
      toast.error('Load On server Plz try again Later')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle bid placement with manual amount
  const handlePlaceBid = async (manualAmount) => {
    if (!lead || !lead.id) {
      throw new Error('No lead selected')
    }

    try {
      const bidAmountNum = parseFloat(manualAmount)
      if (isNaN(bidAmountNum) || bidAmountNum <= 0) {
        throw new Error('Please enter a valid bid amount')
      }

      // First, approve the lead in the database
      const token = localStorage.getItem('token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      
      const approveResponse = await fetch(`${API_URL}/api/leads/${lead.id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!approveResponse.ok) {
        const errorData = await approveResponse.json()
        throw new Error(errorData.detail || 'Failed to approve lead')
      }

      const approveData = await approveResponse.json()
      
      // Update localStorage with the updated lead
      if (approveData.lead) {
        localStorage.setItem('editingLead', JSON.stringify(approveData.lead))
        setLead(approveData.lead)
      }

      // Extract project ID from URL or use lead.project_id
      let projectId = lead.project_id || lead.id
      if (lead.url && lead.url.includes('freelancer.com/projects/')) {
        const urlMatch = lead.url.match(/\/projects\/[^\/]*?(\d+)/)
        if (urlMatch) {
          projectId = parseInt(urlMatch[1])
        }
      }
      
      console.log('🎯 Bidding on project:', {
        projectId: projectId,
        leadId: lead.id,
        leadProjectId: lead.project_id,
        url: lead.url,
        amount: bidAmountNum
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
        setShowRetryBid(true)
        setLastBidData({
          projectId: projectId,
          amount: bidAmountNum,
          message: proposal,
          period: 7
        })
        throw new Error('Extension not connected to Freelancer. Please open the extension and connect to Freelancer first.')
      }
      
      if (!extCredentials.isValidated) {
        setShowRetryBid(true)
        setLastBidData({
          projectId: projectId,
          amount: bidAmountNum,
          message: proposal,
          period: 7
        })
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
        // Success is handled by the modal
        console.log('✅ Bid placed successfully:', result)
        setFreelancerConnectionStatus('connected')
        setShowRetryBid(false)
        setLastBidData(null)
        setShowBidModal(false)
      } else {
        console.log('❌ Bid failed with error:', result.error)
        
        // Store bid data for retry
        setLastBidData({
          projectId: projectId,
          amount: bidAmountNum,
          message: proposal,
          period: 7
        })
        
        // Check if credentials are expired
        if (result.error && (result.error.includes('401') || result.error.includes('expired') || result.error.includes('unauthorized'))) {
          setFreelancerConnectionStatus('expired')
          setShowRetryBid(true)
          
          // Open Freelancer.com to refresh session
          window.open('https://www.freelancer.com/dashboard', '_blank')
          
          // Copy proposal to clipboard as fallback
          try {
            await navigator.clipboard.writeText(proposal)
          } catch (clipError) {
            logError('Failed to copy proposal text', clipError)
          }
          
          throw new Error('Freelancer credentials expired. Please log in to Freelancer.com in the new tab, then click "Retry Bid".')
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

  const handleApproveAndSend = async () => {
    if (!lead || !lead.id) {
      toast.error('No lead selected')
      return
    }

    // If it's a Freelancer project, show bid modal immediately
    if (lead.platform === 'Freelancer') {
      // Calculate suggested bid amount (average of min and max budget, rounded to tens)
      let suggested = 50 // Default minimum
      
      if (lead.budget) {
        const budgetNumbers = lead.budget.match(/[\d,]+/g)
        if (budgetNumbers && budgetNumbers.length >= 1) {
          const minBudget = parseInt(budgetNumbers[0].replace(/,/g, ''), 10)
          let maxBudget = minBudget
          
          // If there's a range (e.g., "$1000-$1500"), get the max
          if (budgetNumbers.length >= 2) {
            maxBudget = parseInt(budgetNumbers[1].replace(/,/g, ''), 10)
          }
          
          // Calculate average and round to nearest 10
          const average = (minBudget + maxBudget) / 2
          suggested = Math.max(Math.round(average / 10) * 10, 50)
        }
      }
      
      setSuggestedBidAmount(suggested)
      setShowBidModal(true)
      return
    }

    // For non-Freelancer platforms, do the approval process
    setIsApproving(true)
    const loadingToast = toast.loading('Approving proposal...')

    try {
      const token = localStorage.getItem('token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      
      // Update status to Approved in database
      const response = await fetch(`${API_URL}/api/leads/${lead.id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to approve lead')
      }

      const data = await response.json()
      
      // Update localStorage with the updated lead
      if (data.lead) {
        localStorage.setItem('editingLead', JSON.stringify(data.lead))
        setLead(data.lead)
      } else {
        // For non-Freelancer platforms, just copy to clipboard
        try {
          await navigator.clipboard.writeText(proposal)
          toast.success('Proposal approved and copied to clipboard!', { id: loadingToast })
        } catch (clipError) {
          logError('Failed to copy proposal text', clipError)
          toast.success('Proposal approved!', { id: loadingToast })
        }
      }

      
    } catch (error) {
      logError('Approve error', error)
      toast.error(`Failed to approve: ${error.message}`, { id: loadingToast })
    } finally {
      setIsApproving(false)
    }
  }

  const handleBack = () => {
    // Only navigate away if we have a real lead (not a generated one)
    if (lead && lead.id !== 'generated') {
      // Clear editing state and navigate to projects page
      localStorage.removeItem('editingLead')
      // Navigate to FreelancerProjects page
      window.dispatchEvent(new CustomEvent('navigateToFreelancer', { detail: 'freelancer-projects' }))
    } else if (lead && lead.id === 'generated') {
      // For generated proposals, just clear the lead but stay on page
      setLead(null)
      setProposal('')
      setIsGeneratedProposal(false)
      setShowProposalGenerator(true)
    } else {
      // No lead at all, navigate away
      localStorage.removeItem('editingLead')
      window.dispatchEvent(new CustomEvent('navigateToFreelancer', { detail: 'freelancer-projects' }))
    }
  }

  const handleProposalGenerated = (generatedProposal) => {
    // Create a temporary lead object for the generated proposal
    const tempLead = {
      id: 'generated',
      title: 'Generated Proposal',
      platform: 'Generated',
      status: 'Draft',
      description: 'This proposal was generated from a job description',
      Proposal: generatedProposal
    }
    
    setLead(tempLead)
    setProposal(generatedProposal)
    setIsGeneratedProposal(true)
    setShowProposalGenerator(false)
    toast.success('Proposal generated successfully!')
  }

  const handleCopyProposal = async () => {
    try {
      await navigator.clipboard.writeText(proposal)
      toast.success('Proposal copied to clipboard!')
    } catch (error) {
      logError('Failed to copy proposal', error)
      toast.error('Failed to copy proposal')
    }
  }

  const getPlatformColor = (platform) => {
    const colors = {
      'Upwork': 'bg-green-50 text-green-700 border border-green-200',
      'Freelancer': 'bg-blue-50 text-blue-700 border border-blue-200',
      'Freelancer Plus': 'bg-orange-50 text-orange-700 border border-orange-200',
      'Internal': 'bg-blue-50 text-blue-900 border border-blue-200',
    }
    return colors[platform] || 'bg-gray-50 text-gray-700 border border-gray-200'
  }

  const getStatusColor = (status) => {
    const colors = {
      'AI Drafted': 'bg-blue-50 text-blue-700 border border-blue-200',
      'AI drafted': 'bg-blue-50 text-blue-700 border border-blue-200',
      'Drafted': 'bg-blue-50 text-blue-900 border border-blue-200',
      'Awaiting Review': 'bg-orange-50 text-orange-700 border border-orange-200',
      'Approved': 'bg-green-50 text-green-700 border border-green-200',
      'Rejected': 'bg-red-50 text-red-700 border border-red-200',
    }
    return colors[status] || 'bg-gray-50 text-gray-700 border border-gray-200'
  }

  const handleCopyMessage = async (text, messageId) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMessageId(messageId)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (error) {
      logError('Failed to copy message', error)
      toast.error('Failed to copy')
    }
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isSendingMessage) return
    
    setIsSendingMessage(true)
    
    const newMessage = {
      id: Date.now(),
      text: chatInput,
      sender: 'user',
      timestamp: new Date()
    }
    
    // Add thinking message
    const thinkingId = Date.now() + 1
    const thinkingMessage = {
      id: thinkingId,
      text: 'Thinking...',
      sender: 'ai',
      timestamp: new Date(),
      isThinking: true
    }
    
    setChatMessages([...chatMessages, newMessage, thinkingMessage])
    const currentInput = chatInput
    setChatInput('')
    
    try {
      const token = localStorage.getItem('token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: currentInput,
          lead_id: lead.id,
          proposal: proposal,
          description: lead.description
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      
      // Replace thinking message with actual AI response
      setChatMessages(prev => prev.map(msg => 
        msg.id === thinkingId 
          ? {
              ...msg,
              text: data.response || data.message || 'Response received',
              isThinking: false
            }
          : msg
      ))
      
    } catch (error) {
      logError('Chat error', error)
      // Replace thinking message with error message
      setChatMessages(prev => prev.map(msg => 
        msg.id === thinkingId 
          ? {
              ...msg,
              text: 'Sorry, I could not process your message. Please try again.',
              isThinking: false
            }
          : msg
      ))
    } finally {
      setIsSendingMessage(false)
    }
  }

  if (!lead) {
    return (
      <>
        <ProposalGeneratorModal
          isOpen={showProposalGenerator}
          onClose={() => {
            setShowProposalGenerator(false)
            // Don't navigate away, just close the modal
          }}
          onProposalGenerated={handleProposalGenerated}
        />
        
        {!showProposalGenerator && !proposal && (
          <div className="flex items-center justify-center min-h-screen  p-4">
            <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center max-w-md w-full shadow-sm">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#f0e9d2' }}>
                <Briefcase size={40} style={{ color: '#b59d32' }} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3 dark:text-gray-300">No Proposal Selected</h2>
              <p className="text-gray-600 mb-8 leading-relaxed dark:text-gray-50">
                Please select a project from the projects page to view and edit its proposal.
              </p>
              <button
                onClick={handleBack}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 text-gray-100 rounded-xl hover:bg-gray-700 transition-all font-medium dark:bg-[#2A2A2A] dark:text-gray-200 dark:hover:bg-[#3A3A3A]"
              >
                <ArrowLeft size={20} />
                Go to Projects
              </button>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <>
    <div className="p-4 sm:p-6 lg:p-8  min-h-full">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors dark:text-gray-300 dark:hover:text-gray-100"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Go to Projects</span>
        </button>

        {/* Toggle between Description and AI Assistant */}
        <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#212121] p-1">
          <button
            onClick={() => {
              setRightPanelView('description')
              setIsFullscreen(false)
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              rightPanelView === 'description'
                ? 'bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-gray-200 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <Briefcase size={16} />
            <span className="hidden sm:inline">Job Details</span>
          </button>
          <button
            onClick={() => setRightPanelView('assistant')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              rightPanelView === 'assistant'
                ? 'bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-gray-200 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <Bot size={16} />
            <span className="hidden sm:inline">AI Assistant</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Proposal Editor (2/3 width) */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-300">Proposal</h2>
              <div className="flex gap-2">
                {!isGeneratedProposal && (
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#212121] text-gray-700 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    <Save size={16} />
                    <span className="text-sm">{isSaving ? 'Saving...' : 'Save'}</span>
                  </button>
                )}
                
                {isGeneratedProposal ? (
                  // Show only Copy button for generated proposals
                  <button
                    onClick={handleCopyProposal}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-all"
                  >
                    <Copy size={16} />
                    <span className="text-sm">Copy Proposal</span>
                  </button>
                ) : lead.platform === 'Upwork' ? (
                  // Upwork-specific buttons
                  <>
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(proposal)
                          toast.success('Proposal copied to clipboard!')
                        } catch (error) {
                          toast.error('Failed to copy proposal')
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                    >
                      <Copy size={16} />
                      <span className="text-sm">Copy</span>
                    </button>
                    <button
                      onClick={() => {
                        if (lead.url) {
                          window.open(lead.url, '_blank')
                        } else {
                          toast.error('No project URL available')
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                    >
                      <Send size={16} />
                      <span className="text-sm">View Project</span>
                    </button>
                  </>
                ) : showRetryBid && lead.platform === 'Freelancer' ? (
                  <button
                    onClick={retryBidPlacement}
                    disabled={isApproving}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={16} className={isApproving ? 'animate-spin' : ''} />
                    <span className="text-sm">
                      {isApproving ? 'Retrying...' : 'Retry Bid'}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={handleApproveAndSend}
                    disabled={isApproving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={16} className={isApproving ? 'animate-spin' : ''} />
                    <span className="text-sm">
                      {isApproving 
                        ? (lead.platform === 'Freelancer' ? 'Bidding...' : 'Processing...')
                        : (lead.platform === 'Freelancer' ? 'Approve & Bid' : 'Approve & Send')
                      }
                    </span>
                  </button>
                )}
              </div>
            </div>

            <textarea
              value={proposal}
              onChange={(e) => setProposal(e.target.value)}
              className="w-full h-[600px] p-4 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-500 focus:border-transparent resize-none font-mono text-sm leading-relaxed bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-gray-300"
              placeholder="Write your proposal here..."
            />

            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
              <span>{proposal.length} characters</span>
              <span>{proposal.split(/\s+/).filter(w => w.length > 0).length} words</span>
            </div>
          </div>
        </div>

        {/* Right Side - Job Details (1/3 width) */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-700 p-6 sticky top-6">
            {rightPanelView === 'description' ? (
              <>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-300 mb-4">Job Details</h2>

            {/* Platform & Status */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${getPlatformColor(lead.platform)}`}>
                <Briefcase size={12} className="inline mr-1" />
                {lead.platform}
              </span>
              <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${getStatusColor(lead.status)}`}>
                {lead.status}
              </span>
              {/* Freelancer Connection Status */}
              {lead.platform === 'Freelancer' && freelancerConnectionStatus && (
                <span className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${
                  freelancerConnectionStatus === 'connected' 
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : freelancerConnectionStatus === 'expired'
                    ? 'bg-orange-50 text-orange-700 border border-orange-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {freelancerConnectionStatus === 'connected' ? (
                    <>
                      <CheckCircle size={12} />
                      Connected
                    </>
                  ) : freelancerConnectionStatus === 'expired' ? (
                    <>
                      <AlertCircle size={12} />
                      Expired
                    </>
                  ) : (
                    <>
                      <AlertCircle size={12} />
                      Disconnected
                    </>
                  )}
                  <button
                    onClick={checkFreelancerConnection}
                    className="ml-1 text-xs opacity-70 hover:opacity-100"
                    title="Refresh connection status"
                  >
                    ↻
                  </button>
                </span>
              )}
            </div>

            {/* Title */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Title</h3>
              <p className="text-sm text-gray-900 dark:text-gray-300 leading-relaxed">{lead.title}</p>
            </div>

            {/* Budget */}
            {lead.budget && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                  <DollarSign size={14} />
                  Budget
                </h3>
                <p className="text-sm text-gray-900 dark:text-gray-300">{lead.budget}</p>
              </div>
            )}

            {/* Average Bid Price */}
            {lead.avg_bid_price && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                  <DollarSign size={14} />
                  Avg Bid Price
                </h3>
                <p className="text-sm text-gray-900 dark:text-gray-300">{lead.avg_bid_price}</p>
              </div>
            )}

            {/* Posted Time */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                <Clock size={14} />
                Posted Time
              </h3>
              <div className="space-y-2">
                <div className="bg-gray-50 dark:bg-[#212121] rounded-lg p-3">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">International (UTC)</p>
                  <p className="text-sm text-gray-900 dark:text-gray-300 font-medium">{formatTime(lead.posted_time, 'UTC')}</p>
                </div>
                <div className="bg-gray-50 dark:bg-[#212121] rounded-lg p-3">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">South Africa (SAST)</p>
                  <p className="text-sm text-gray-900 dark:text-gray-300 font-medium">{formatTime(lead.posted_time, 'SA')}</p>
                </div>
              </div>
            </div>

            {/* Score */}
            {lead.score && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Job Score</h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 dark:bg-[#212121] rounded-full h-2">
                    <div
                      className=" h-2 rounded-full transition-all"
                      style={{ width: `${(lead.score / 10) * 100}%`, backgroundColor: '#b59d32' }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-300">{lead.score}/10</span>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description</h3>
              <div className="bg-gray-50 dark:bg-[#212121] rounded-lg p-4 max-h-64 overflow-y-auto">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {lead.description || 'No description available.'}
                </p>
              </div>
            </div>

            {/* Freelancer Connection Help */}
            {lead.platform === 'Freelancer' && freelancerConnectionStatus && freelancerConnectionStatus !== 'connected' && (
              <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm flex-1">
                    <p className="text-orange-800 dark:text-orange-200 font-medium mb-1">
                      {freelancerConnectionStatus === 'expired' ? 'Freelancer Credentials Expired' : 'Freelancer Not Connected'}
                    </p>
                    <p className="text-orange-700 dark:text-orange-300 text-xs">
                      {freelancerConnectionStatus === 'expired' 
                        ? showRetryBid 
                          ? 'Please refresh your Freelancer session in the opened tab, then click "Retry Bid".'
                          : 'Your Freelancer credentials have expired. The system will try to refresh them automatically when you place a bid.'
                        : 'Connect your Freelancer account using the browser extension to enable automatic bidding.'
                      }
                    </p>
                  </div>
                  {showRetryBid && (
                    <button
                      onClick={checkFreelancerConnection}
                      className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200 text-xs"
                      title="Check connection status"
                    >
                      ↻
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* View Original Link */}
            {lead.url && (
              <a
                href={lead.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center px-4 py-2 bg-gray-100 dark:bg-[#212121] text-gray-700 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                View Original Post
              </a>
            )}
              </>
            ) : (
              /* AI Assistant View */
              <div className="flex flex-col" style={{ height: 'calc(100vh - 16rem)' }}>
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <Bot size={20} className="text-blue-900" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-300">AI Assistant</h2>
                  </div>
                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="hidden lg:block p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                  >
                    {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                  </button>
                </div>
                
                {/* Chat Messages - Independent scroll */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0">
                  {isLoadingHistory ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                      <div className="flex justify-center items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-blue-900 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-blue-900 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-blue-900 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <p className="text-sm">Loading chat history...</p>
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                      <Bot size={48} className="mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Start a conversation with the AI assistant</p>
                    </div>
                  ) : (
                    chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg p-3 relative group ${
                            message.sender === 'user'
                              ? 'bg-blue-900 text-white'
                              : 'bg-gray-100 dark:bg-[#212121] text-gray-900 dark:text-gray-300'
                          }`}
                        >
                          {message.isThinking ? (
                            <div className="flex items-center gap-2">
                              <span className="flex gap-1">
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                              </span>
                              <span className="text-sm">{message.text}</span>
                            </div>
                          ) : message.sender === 'ai' ? (
                            <>
                              <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0">
                                <ReactMarkdown>{message.text}</ReactMarkdown>
                              </div>
                              {/* Copy button for AI messages */}
                              <button
                                onClick={() => handleCopyMessage(message.text, message.id)}
                                className="absolute top-2 right-2 p-1.5 bg-white dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                title="Copy message"
                              >
                                {copiedMessageId === message.id ? <Check size={14} /> : <Copy size={14} />}
                              </button>
                            </>
                          ) : (
                            <p className="text-sm">{message.text}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={chatMessagesEndRef} />
                </div>

                {/* Chat Input */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex-shrink-0">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !isSendingMessage && handleSendMessage()}
                      placeholder="Type your message..."
                      disabled={isSendingMessage}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-700 bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={isSendingMessage || !chatInput.trim()}
                      className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-900 flex-shrink-0"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Fullscreen AI Assistant Modal */}
    {isFullscreen && (
      <div className="fixed bg-white dark:bg-[#1a1a1a] z-50 flex flex-col border border-gray-300 dark:border-gray-700 rounded-lg shadow-2xl" style={{ 
        top: '6.5rem',
        left: 'calc(240px + 1rem)',
        right: '1rem',
        bottom: '1rem'
      }}>
        {/* Fullscreen Header */}
        <div className="bg-white dark:bg-[#1e1e1e] border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between flex-shrink-0 rounded-t-lg">
          <div className="flex items-center gap-3">
            <Bot size={24} className="text-blue-900" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-300">AI Assistant</h2>
          </div>
          <button
            onClick={() => setIsFullscreen(false)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Exit fullscreen"
          >
            <Minimize2 size={20} />
          </button>
        </div>

        {/* Fullscreen Chat Content */}
        <div className="flex-1 flex flex-col p-6 min-h-0">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0">
            {isLoadingHistory ? (
              <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                <div className="flex justify-center items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-blue-900 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-blue-900 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-blue-900 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <p className="text-sm">Loading chat history...</p>
              </div>
            ) : chatMessages.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                <Bot size={64} className="mx-auto mb-4 opacity-50" />
                <p className="text-base">Start a conversation with the AI assistant</p>
              </div>
            ) : (
              chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-4 relative group ${
                      message.sender === 'user'
                        ? 'bg-blue-900 text-white'
                        : 'bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-300'
                    }`}
                  >
                    {message.isThinking ? (
                      <div className="flex items-center gap-2">
                        <span className="flex gap-1">
                          <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </span>
                        <span className="text-sm">{message.text}</span>
                      </div>
                    ) : message.sender === 'ai' ? (
                      <>
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0">
                          <ReactMarkdown>{message.text}</ReactMarkdown>
                        </div>
                        {/* Copy button for AI messages */}
                        <button
                          onClick={() => handleCopyMessage(message.text, message.id)}
                          className="absolute top-3 right-3 p-2 bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                          title="Copy message"
                        >
                          {copiedMessageId === message.id ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      </>
                    ) : (
                      <p className="text-sm">{message.text}</p>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={chatMessagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex-shrink-0">
            <div className="flex gap-3 max-w-4xl mx-auto">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isSendingMessage && handleSendMessage()}
                placeholder="Type your message..."
                disabled={isSendingMessage}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-700 bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSendMessage}
                disabled={isSendingMessage || !chatInput.trim()}
                className="px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-900 flex-shrink-0"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Bid Amount Modal */}
    <BidModal
      isOpen={showBidModal}
      onClose={() => {
        setShowBidModal(false)
        setIsApproving(false)
      }}
      onPlaceBid={handlePlaceBid}
      lead={lead}
      suggestedAmount={suggestedBidAmount}
    />
    </>
  )
}

export default Proposals
