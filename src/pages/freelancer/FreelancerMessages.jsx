import { useState, useEffect, useRef } from 'react'
import { MessageSquare, Send, ArrowLeft, RefreshCw, AlertCircle, User, ChevronDown, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { logError } from '../../utils/logger'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const FreelancerMessages = () => {
  const [threads, setThreads] = useState([])
  const [selectedThread, setSelectedThread] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('loading')
  const [shouldAutoScroll, setShouldAutoScroll] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [lastMessageCount, setLastMessageCount] = useState(0)
  const [threadPreviews, setThreadPreviews] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const refreshIntervalRef = useRef(null)

  useEffect(() => {
    loadThreads()
  }, [])

  useEffect(() => {
    if (selectedThread) {
      loadMessages(selectedThread.id)
      
      refreshIntervalRef.current = setInterval(() => {
        checkForNewMessages(selectedThread.id)
      }, 5000)
    }
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [selectedThread])

  useEffect(() => {
    if (shouldAutoScroll && messages.length > 0) {
      scrollToBottom()
      setShouldAutoScroll(false)
    }
  }, [messages, shouldAutoScroll])

  const loadThreads = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/freelancer/messages/threads`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const threads = data.result?.threads || data.threads || []
        const users = data.result?.users || data.users || {}
        
        threads.users = users
        
        console.log('✅ Loaded', threads.length, 'message threads')
        setThreads(threads)
        setConnectionStatus('connected')
        
        loadThreadPreviews(threads)
      } else if (response.status === 404 || response.status === 401) {
        setConnectionStatus('disconnected')
      } else {
        throw new Error('Failed to fetch threads')
      }
    } catch (error) {
      logError('Failed to load threads', error)
      setConnectionStatus('error')
      toast.error('Please connect to Freelancer.com using the browser extension')
    } finally {
      setIsLoading(false)
    }
  }

  const loadMessages = async (threadId) => {
    setMessages([])
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/freelancer/messages/${threadId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        let messages = data.result?.messages || data.messages || []

        messages.sort((a, b) => a.time_created - b.time_created)

        // Clean up any attachment markers from messages
        messages = messages.map(msg => {
          if (msg.message && msg.message.includes('📎')) {
            const cleanMessage = msg.message.split('\n\n📎')[0].trim()
            msg.message = cleanMessage || msg.message
          }
          return msg
        })

        console.log('✅ Loaded', messages.length, 'messages')
        setMessages(messages)
        setLastMessageCount(messages.length)
        setShouldAutoScroll(true)
      } else {
        throw new Error('Failed to fetch messages')
      }
    } catch (error) {
      logError('Failed to load messages', error)
      toast.error('Please connect to Freelancer.com using the browser extension')
    }
  }

  const checkForNewMessages = async (threadId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/freelancer/messages/${threadId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        let newMessages = data.result?.messages || data.messages || []

        newMessages.sort((a, b) => a.time_created - b.time_created)

        if (newMessages.length > lastMessageCount) {
          console.log('📨 New messages received:', newMessages.length - lastMessageCount)
          
          const realMessages = newMessages.filter(msg => !msg.sending)
          
          setMessages(realMessages)
          setLastMessageCount(realMessages.length)
          
          const container = messagesContainerRef.current
          if (container) {
            const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100
            if (isNearBottom) {
              setShouldAutoScroll(true)
            }
          }
        }
      }
    } catch (error) {
      console.log('Background message check failed:', error.message)
    }
  }

  const loadThreadPreviews = async (threadList) => {
    const previewPromises = threadList.slice(0, 10).map(async (thread) => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/api/freelancer/messages/${thread.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          let messages = data.result?.messages || data.messages || []
          
          if (messages.length > 0) {
            messages.sort((a, b) => a.time_created - b.time_created)
            const latestMessage = messages[messages.length - 1]
            
            return {
              threadId: thread.id,
              latestMessage: latestMessage.message,
              fromMe: latestMessage.from_me,
              timeCreated: latestMessage.time_created
            }
          }
        }
      } catch (error) {
        console.log('Failed to load preview for thread', thread.id)
      }
      return null
    })

    const previews = await Promise.all(previewPromises)
    const previewMap = {}
    
    previews.forEach(preview => {
      if (preview) {
        previewMap[preview.threadId] = preview
      }
    })
    
    setThreadPreviews(previewMap)
  }

  // Filter threads based on search query
  const filteredThreads = threads.filter(thread => {
    if (!searchQuery.trim()) return true
    
    const threadData = thread.thread || thread
    const users = threads.users || {}
    const myUserId = Object.keys(users).find(id => 
      users[id].username === 'califsmith' || users[id].id === 81473876
    ) || '81473876'
    
    let userName = 'Unknown User'
    if (threadData.members && threadData.members.length > 0) {
      const otherUserId = threadData.members.find(id => String(id) !== String(myUserId))
      if (otherUserId && users[otherUserId]) {
        const user = users[otherUserId]
        userName = user.display_name || user.username || user.public_name || user.name || 'Unknown User'
      }
    }
    
    return userName.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedThread || isSending) return

    const messageText = newMessage.trim()
    setNewMessage('')
    setIsSending(true)

    const optimisticMessage = {
      id: Date.now(),
      message: messageText,
      from_me: true,
      time_created: Math.floor(Date.now() / 1000),
      sending: true
    }
    
    setMessages(prev => [...prev, optimisticMessage])
    setShouldAutoScroll(true)

    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${API_URL}/api/freelancer/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          threadId: selectedThread.id,
          message: messageText
        })
      })

      if (response.ok) {
        console.log('✅ Message sent successfully')
        setMessages(prev => prev.map(msg => 
          msg.id === optimisticMessage.id 
            ? { ...msg, sending: false, id: Date.now() + 1 }
            : msg
        ))
      } else {
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id))
        setNewMessage(messageText)
        throw new Error('Failed to send message')
      }
    } catch (error) {
      logError('Failed to send message', error)
      toast.error('Please connect to Freelancer.com using the browser extension')
    } finally {
      setIsSending(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleScroll = (e) => {
    const container = e.target
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100
    setShowScrollButton(!isNearBottom && messages.length > 5)
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

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (connectionStatus === 'disconnected') {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Not Connected to Freelancer.com
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please connect to Freelancer.com using the browser extension to view messages.
          </p>
          <button
            onClick={loadThreads}
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
    <div className="h-full">
      <div className="flex h-full bg-white dark:bg-[#1f1f1f] overflow-hidden">
        {/* Threads Sidebar */}
        <div className={`w-full md:w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-[#1f1f1f] ${selectedThread ? 'hidden md:flex' : 'flex'}`}>
          {/* Search Bar */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center">
                <RefreshCw className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Loading conversations...</p>
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-4 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">No conversations found</p>
              </div>
            ) : (
              filteredThreads.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => {
                    setSelectedThread(thread)
                    thread.is_read = true
                    thread.is_unread = false
                  }}
                  className={`p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    selectedThread?.id === thread.id ? 'bg-gray-50 dark:bg-gray-800' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                      {(() => {
                        const threadData = thread.thread || thread
                        const users = threads.users || {}
                        const myUserId = Object.keys(users).find(id => 
                          users[id].username === 'califsmith' || users[id].id === 81473876
                        ) || '81473876'
                        
                        let user = null
                        if (threadData.members && threadData.members.length > 0) {
                          const otherUserId = threadData.members.find(id => String(id) !== String(myUserId))
                          if (otherUserId && users[otherUserId]) {
                            user = users[otherUserId]
                          }
                        }
                        
                        let avatarUrl = null
                        if (user) {
                          if (user.avatar_large_cdn) {
                            avatarUrl = `https:${user.avatar_large_cdn}`
                          } else if (user.avatar_cdn) {
                            avatarUrl = `https:${user.avatar_cdn}`
                          } else if (user.avatar_xlarge_cdn) {
                            avatarUrl = `https:${user.avatar_xlarge_cdn}`
                          } else if (user.avatar_large) {
                            avatarUrl = `https://www.freelancer.com${user.avatar_large}`
                          } else if (user.avatar) {
                            avatarUrl = `https://www.freelancer.com${user.avatar}`
                          } else if (user.avatar_xlarge) {
                            avatarUrl = `https://www.freelancer.com${user.avatar_xlarge}`
                          }
                        }
                        
                        return avatarUrl ? (
                          <img 
                            src={avatarUrl} 
                            alt="Profile"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.nextSibling.style.display = 'flex'
                            }}
                          />
                        ) : (
                          <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        )
                      })()}
                      <div 
                        className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center absolute top-0 left-0"
                        style={{ display: 'none' }}
                      >
                        <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm">
                          {(() => {
                            const threadData = thread.thread || thread
                            const users = threads.users || {}
                            let user = null
                            let userName = 'Unknown User'
                            
                            const myUserId = Object.keys(users).find(id => 
                              users[id].username === 'califsmith' || users[id].id === 81473876
                            ) || '81473876'

                            if (threadData.other_users && threadData.other_users.length > 0) {
                              const userId = threadData.other_users[0]
                              if (typeof userId === 'number' && users[userId]) {
                                user = users[userId]
                              } else if (typeof userId === 'object') {
                                user = userId
                              }
                            } else if (threadData.members && threadData.members.length > 0) {
                              const otherUserId = threadData.members.find(id => String(id) !== String(myUserId))
                              if (otherUserId && users[otherUserId]) {
                                user = users[otherUserId]
                              }
                            } else if (threadData.context?.other_member) {
                              user = threadData.context.other_member
                            } else if (threadData.context?.from_user) {
                              user = threadData.context.from_user
                            }

                            if (user) {
                              userName = user.display_name || user.username || user.public_name ||
                                user.name || (user.id ? 'User #' + user.id : 'Unknown User')
                            } else {
                              userName = threadData.context?.name ||
                                threadData.context?.owner?.username ||
                                threadData.context?.owner?.display_name ||
                                'Unknown User'
                            }

                            return userName
                          })()}
                        </h3>
                        <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                          {formatTimeAgo(thread.time_updated || thread.thread?.time_updated)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate leading-tight">
                        {(() => {
                          const preview = threadPreviews[thread.id]
                          
                          if (preview) {
                            const prefix = preview.fromMe ? 'You: ' : ''
                            const message = preview.latestMessage
                            
                            if (message.length > 50) {
                              return `${prefix}${message.substring(0, 50)}...`
                            }
                            return `${prefix}${message}`
                          }
                          
                          const threadData = thread.thread || thread
                          const msg = thread.message || thread.context?.message || threadData.context?.message || null
                          let messageText = msg?.message || thread.context?.snippet || threadData.context?.snippet
                          
                          if (!messageText) {
                            if (threadData.context?.type === 'support_session') {
                              messageText = 'Support conversation'
                            } else if (threadData.context?.name) {
                              messageText = `Conversation with ${threadData.context.name}`
                            } else {
                              messageText = 'No messages yet'
                            }
                          }
                          
                          return messageText
                        })()}
                      </p>
                      {(thread.is_unread || !thread.is_read) && (
                        <div className="flex items-center justify-end mt-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${selectedThread ? 'flex' : 'hidden md:flex'}`}>
          {selectedThread ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f]">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSelectedThread(null)}
                    className="md:hidden p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                    {(() => {
                      const threadData = selectedThread.thread || selectedThread
                      const users = threads.users || {}
                      const myUserId = Object.keys(users).find(id => 
                        users[id].username === 'califsmith' || users[id].id === 81473876
                      ) || '81473876'
                      
                      let user = null
                      if (threadData.members && threadData.members.length > 0) {
                        const otherUserId = threadData.members.find(id => String(id) !== String(myUserId))
                        if (otherUserId && users[otherUserId]) {
                          user = users[otherUserId]
                        }
                      }
                      
                      let avatarUrl = null
                      if (user) {
                        if (user.avatar_large_cdn) {
                          avatarUrl = `https:${user.avatar_large_cdn}`
                        } else if (user.avatar_cdn) {
                          avatarUrl = `https:${user.avatar_cdn}`
                        } else if (user.avatar_xlarge_cdn) {
                          avatarUrl = `https:${user.avatar_xlarge_cdn}`
                        } else if (user.avatar_large) {
                          avatarUrl = `https://www.freelancer.com${user.avatar_large}`
                        } else if (user.avatar_xlarge) {
                          avatarUrl = `https://www.freelancer.com${user.avatar_xlarge}`
                        } else if (user.avatar) {
                          avatarUrl = `https://www.freelancer.com${user.avatar}`
                        }
                      }
                      
                      return avatarUrl ? (
                        <img 
                          src={avatarUrl} 
                          alt="Profile"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'flex'
                          }}
                        />
                      ) : (
                        <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      )
                    })()}
                    <div 
                      className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center absolute top-0 left-0"
                      style={{ display: 'none' }}
                    >
                      <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {(() => {
                        const threadData = selectedThread.thread || selectedThread
                        const users = threads.users || {}
                        let user = null
                        let userName = 'Unknown User'
                        
                        const myUserId = Object.keys(users).find(id => 
                          users[id].username === 'califsmith' || users[id].id === 81473876
                        ) || '81473876'

                        if (threadData.other_users && threadData.other_users.length > 0) {
                          const userId = threadData.other_users[0]
                          if (typeof userId === 'number' && users[userId]) {
                            user = users[userId]
                          }
                        } else if (threadData.members && threadData.members.length > 0) {
                          const otherUserId = threadData.members.find(id => String(id) !== String(myUserId))
                          if (otherUserId && users[otherUserId]) {
                            user = users[otherUserId]
                          }
                        }

                        if (user) {
                          userName = user.display_name || user.username || user.public_name || user.name || 'Unknown User'
                        }

                        return userName
                      })()}
                    </h3>
                    <p className="text-sm text-green-500 flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Online
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto px-6 py-4 space-y-3 "
                onScroll={handleScroll}
              >
                {messages.map((message, index) => {
                  const showAvatar = !message.from_me && (index === 0 || messages[index - 1].from_me)
                  const showName = !message.from_me && showAvatar
                  
                  return (
                    <div key={message.id} className={`flex gap-3 ${message.from_me ? 'flex-row-reverse' : ''}`}>
                      {/* Avatar for received messages */}
                      {!message.from_me && (
                        <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-gray-200 dark:bg-gray-700 flex-shrink-0 ${showAvatar ? '' : 'invisible'}`}>
                          {(() => {
                            const threadData = selectedThread.thread || selectedThread
                            const users = threads.users || {}
                            const myUserId = Object.keys(users).find(id => 
                              users[id].username === 'califsmith' || users[id].id === 81473876
                            ) || '81473876'
                            
                            let user = null
                            if (threadData.members && threadData.members.length > 0) {
                              const otherUserId = threadData.members.find(id => String(id) !== String(myUserId))
                              if (otherUserId && users[otherUserId]) {
                                user = users[otherUserId]
                              }
                            }
                            
                            let avatarUrl = null
                            if (user) {
                              if (user.avatar_large_cdn) {
                                avatarUrl = `https:${user.avatar_large_cdn}`
                              } else if (user.avatar_cdn) {
                                avatarUrl = `https:${user.avatar_cdn}`
                              } else if (user.avatar_xlarge_cdn) {
                                avatarUrl = `https:${user.avatar_xlarge_cdn}`
                              } else if (user.avatar_large) {
                                avatarUrl = `https://www.freelancer.com${user.avatar_large}`
                              } else if (user.avatar) {
                                avatarUrl = `https://www.freelancer.com${user.avatar}`
                              }
                            }
                            
                            return avatarUrl ? (
                              <img 
                                src={avatarUrl} 
                                alt="Profile"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                  e.target.nextSibling.style.display = 'flex'
                                }}
                              />
                            ) : (
                              <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            )
                          })()}
                          <div 
                            className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center absolute top-0 left-0"
                            style={{ display: 'none' }}
                          >
                            <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          </div>
                        </div>
                      )}
                      
                      <div className={`flex-1 ${message.from_me ? 'flex justify-end' : ''}`}>
                        {/* Name for received messages */}
                        {showName && (
                          <div className="mb-1">
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {(() => {
                                const threadData = selectedThread.thread || selectedThread
                                const users = threads.users || {}
                                const myUserId = Object.keys(users).find(id => 
                                  users[id].username === 'califsmith' || users[id].id === 81473876
                                ) || '81473876'
                                
                                let user = null
                                if (threadData.members && threadData.members.length > 0) {
                                  const otherUserId = threadData.members.find(id => String(id) !== String(myUserId))
                                  if (otherUserId && users[otherUserId]) {
                                    user = users[otherUserId]
                                  }
                                }
                                
                                return user ? (user.display_name || user.username || user.public_name || user.name || 'Unknown User') : 'Unknown User'
                              })()}
                            </span>
                          </div>
                        )}
                        
                        {/* Message bubble */}
                        <div className={`inline-block max-w-md ${message.from_me ? 'ml-auto' : ''}`}>
                          <div
                            className={`px-4 py-2 rounded-2xl ${
                              message.from_me
                                ? message.sending 
                                  ? 'bg-blue-400 text-white opacity-70' 
                                  : 'bg-blue-500 text-white'
                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            {message.message && (
                              <p className="text-sm leading-relaxed break-words">{message.message}</p>
                            )}
                            
                            {/* Time and status */}
                            <div className={`flex items-center gap-1 mt-1 ${message.from_me ? 'justify-end' : 'justify-start'}`}>
                              <span className={`text-xs ${
                                message.from_me ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                {formatMessageTime(message.time_created)}
                              </span>
                              {message.sending && (
                                <RefreshCw className="w-3 h-3 animate-spin text-blue-100 ml-1" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
                
                {/* Scroll to Bottom Button */}
                {showScrollButton && (
                  <button
                    onClick={() => {
                      setShouldAutoScroll(true)
                      scrollToBottom()
                    }}
                    className="absolute bottom-20 right-6 w-10 h-10 bg-gray-600 hover:bg-gray-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 z-10"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Message Input */}
              <form onSubmit={sendMessage} className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f]">
                <div className="flex gap-3 items-center">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm transition-all"
                      disabled={isSending}
                    />
                    
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || isSending}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center hover:scale-105 disabled:hover:scale-100"
                    >
                      {isSending ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Select a conversation
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Choose a conversation from the sidebar to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FreelancerMessages