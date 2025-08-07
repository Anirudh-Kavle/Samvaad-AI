"use client";
import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { apiClient, ChatMessage, DebateStatusResponse, DebateInfoResponse } from "@/lib/api"

import {
  Send,
  MessageCircle,
  Users,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Crown
} from "lucide-react"

export default function DebatePage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messageInput, setMessageInput] = useState("")
  const [status, setStatus] = useState<DebateStatusResponse | null>(null)
  const [debateInfo, setDebateInfo] = useState<DebateInfoResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const getCharacterColors = (characterName: string, isUser: boolean = false) => {
    if (isUser || characterName === "You") return { bg: "bg-amber-500", text: "text-slate-900" }
    
    // Simple hash function to consistently assign colors
    const hash = characterName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    
    const colorIndex = Math.abs(hash) % 9 + 1
    
    const colorMap = {
      1: { bg: "bg-blue-600", text: "text-white" },
      2: { bg: "bg-green-600", text: "text-white" },
      3: { bg: "bg-purple-600", text: "text-white" },
      4: { bg: "bg-red-600", text: "text-white" },
      5: { bg: "bg-indigo-600", text: "text-white" },
      6: { bg: "bg-pink-600", text: "text-white" },
      7: { bg: "bg-orange-600", text: "text-white" },
      8: { bg: "bg-teal-600", text: "text-white" },
      9: { bg: "bg-cyan-600", text: "text-white" },
    }
    
    return colorMap[colorIndex as keyof typeof colorMap] || colorMap[1]
  }

  const fetchChatHistory = async () => {
    try {
      const history = await apiClient.getChatHistory(sessionId)
      setMessages(history.messages)
      setTimeout(scrollToBottom, 100)
    } catch (error) {
      console.error('Failed to fetch chat history:', error)
    }
  }

  const fetchStatus = async () => {
    try {
      const currentStatus = await apiClient.getDebateStatus(sessionId)
      setStatus(currentStatus)
      
      // If waiting for input, we should enable the input field
      if (currentStatus.is_waiting_for_input) {
        setIsSending(false)
      }
    } catch (error) {
      console.error('Failed to fetch status:', error)
      setError('Lost connection to debate session')
    }
  }

  const pollUpdates = () => {
    // Poll every 2 seconds for updates
    pollIntervalRef.current = setInterval(async () => {
      await fetchChatHistory()
      await fetchStatus()
    }, 2000)
  }

  const handleSendMessage = async () => {
    if (!messageInput.trim() || isSending || !status?.is_waiting_for_input) return

    setIsSending(true)
    
    try {
      await apiClient.sendMessage(sessionId, messageInput.trim())
      setMessageInput("")
      
      // Immediately fetch updated history
      await fetchChatHistory()
      await fetchStatus()
      
    } catch (error) {
      console.error('Failed to send message:', error)
      alert(`Failed to send message: ${error.message}`)
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  useEffect(() => {
    const initializeDebate = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        // Fetch initial data
        await Promise.all([
          fetchChatHistory(),
          fetchStatus()
        ])
        
        // Start polling for updates
        pollUpdates()
        
      } catch (error) {
        console.error('Failed to initialize debate:', error)
        setError('Failed to load debate session')
      } finally {
        setIsLoading(false)
      }
    }

    if (sessionId) {
      initializeDebate()
    }

    // Cleanup polling on unmount
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [sessionId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-slate-300">Loading debate session...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Connection Error</h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <div className="space-x-2">
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
            <Button variant="outline" onClick={() => router.push('/')}>
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 bg-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/')}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Crown className="h-6 w-6 text-amber-500" />
            <div>
              <h1 className="text-lg font-semibold text-white">CouncilChamber</h1>
              <div className="flex items-center space-x-2">
                <Badge variant={status?.is_running ? "default" : "secondary"}>
                  {status?.is_running ? "Active" : "Inactive"}
                </Badge>
                <span className="text-slate-400 text-sm">
                  {status?.message_count || 0} messages
                </span>
              </div>
            </div>
          </div>
          
          {status?.is_waiting_for_input && (
            <Badge className="bg-amber-500 text-slate-900">
              Waiting for your input
            </Badge>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">
                {status?.is_running ? "The debate is starting..." : "No messages yet"}
              </p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isUser = message.sender === debateInfo?.user_name || message.sender === "You"
              const colors = getCharacterColors(message.sender, isUser)
              
              return (
                <div key={index} className={`group ${isUser ? 'flex justify-end' : ''}`}>
                  <div className={`flex items-start space-x-3 max-w-[85%] ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {/* Avatar */}
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className={`${colors.bg} ${colors.text} text-xs`}>
                        {message.sender.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className={`flex-1 min-w-0 ${isUser ? 'text-right' : ''}`}>
                      <div className={`flex items-center space-x-2 mb-1 ${isUser ? 'flex-row-reverse justify-start' : ''}`}>
                        <span className="font-medium text-white text-sm">{message.sender}</span>
                      </div>
                      
                      <div className={`rounded-2xl px-4 py-3 ${
                        isUser 
                          ? 'bg-amber-500 text-slate-900' 
                          : 'bg-slate-700 text-white hover:bg-slate-700/80'
                      } transition-colors`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.message}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
          
          {status?.current_prompt && (
            <div className="text-center py-4">
              <Card className="bg-slate-800 border-slate-600 max-w-md mx-auto">
                <CardContent className="p-4">
                  <p className="text-amber-400 text-sm">{status.current_prompt}</p>
                </CardContent>
              </Card>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      {status?.is_running && (
        <div className="p-4 border-t border-slate-700 bg-slate-800">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end space-x-3">
              <div className="flex-1">
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    status?.is_waiting_for_input 
                      ? "Share your perspective..." 
                      : "Waiting for others..."
                  }
                  disabled={!status?.is_waiting_for_input || isSending}
                  className="w-full bg-slate-700 border border-slate-600 rounded-2xl p-4 text-white placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                  rows={3}
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || !status?.is_waiting_for_input || isSending}
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-6 py-3"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {!status?.is_waiting_for_input && status?.is_running && (
              <p className="text-slate-400 text-xs mt-2 text-center">
                The council members are discussing... You'll be prompted when it's your turn.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}