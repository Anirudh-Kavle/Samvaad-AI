// src/app/debate/[id]/page.tsx - REVISED VERSION
"use client"

import { useState, useEffect, use } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card" // Removed unused Card imports
import { Send, MessageCircle, UserPlus, MoreHorizontal, X } from "lucide-react"
import Link from "next/link"

// Interfaces matching backend models more closely
interface CouncilMemberInfo {
  name: string
  agent_name: string
}

// DebateInfoResponse from backend (assuming /info/ endpoint returns this)
interface BackendDebateInfo {
  session_id: string
  user_name: string
  topic: string
  council_members: CouncilMemberInfo[]
  message: string
  // Note: DebateInfoResponse does NOT have is_active
}

// ChatMessage from backend
interface BackendChatMessage {
  sender: string
  message: string
  // Add timestamp if your backend provides it and you want to use it
  // timestamp?: string;
}

// ChatHistoryResponse from backend
interface BackendChatHistoryResponse {
  messages: BackendChatMessage[]
  is_active: boolean // This is what you need for active status
}

// Status response from backend (/status/)
interface BackendDebateStatus {
  session_id: string
  is_running: boolean
  is_waiting_for_input: boolean
  message_count: number
  current_prompt: string | null
}

interface Character {
  id: string
  name: string
  role: string
  avatar: string
  online: boolean
  colorIndex: number
}

export default function DebateRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { id: sessionId } = resolvedParams

  const [messageInput, setMessageInput] = useState("")
  const [messages, setMessages] = useState<BackendChatMessage[]>([])
  const [debateInfo, setDebateInfo] = useState<BackendDebateInfo | null>(null)
  // Use isDebateActive from history/status response
  const [isDebateActive, setIsDebateActive] = useState<boolean>(false);
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Removed apiKey state as it's not needed for these API calls

  // Fetch debate metadata once
  useEffect(() => {
    if (!sessionId) return // No need to check apiKey

    const fetchDebateInfo = async () => {
      try {
        console.log(`Fetching debate info for session: ${sessionId}`)

        // Use the endpoint you added, assuming it returns DebateInfoResponse
        const res = await fetch(`http://localhost:8000/debates/${sessionId}/info/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // No Authorization or API key header needed for these endpoints
          }
        })

        if (!res.ok) {
          const errorText = await res.text()
          console.error(`Failed to load debate info: ${res.status} - ${errorText}`)
          // Handle 404 specifically if needed
          if (res.status === 404) {
             throw new Error(`Debate session not found.`)
          }
          throw new Error(`Failed to load debate info: ${res.status}`)
        }

        const data: BackendDebateInfo = await res.json()
        console.log('Debate info loaded:', data)
        setDebateInfo(data)
        setError(null)

      } catch (err: any) {
        console.error("Error fetching debate info:", err)
        setError(`Could not load debate session: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchDebateInfo()
  }, [sessionId]) // Removed apiKey dependency

  // Poll for new messages and debate status
  useEffect(() => {
    if (!sessionId || !debateInfo) return

    const fetchData = async () => {
      try {
        // Fetch chat history which includes is_active
        const historyRes = await fetch(`http://localhost:8000/debates/${sessionId}/history/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // No Authorization or API key header needed
          }
        })

        if (!historyRes.ok) {
          console.warn(`Failed to fetch messages: ${historyRes.status}`)
          // Optionally handle specific errors like 404
          return
        }

        const historyData: BackendChatHistoryResponse = await historyRes.json()
        if (historyData.messages && Array.isArray(historyData.messages)) {
          setMessages(historyData.messages)
        }
        // Update debate active status from history response
        setIsDebateActive(historyData.is_active);

        // --- Optional: Fetch status separately if you need more details ---
        // const statusRes = await fetch(`http://localhost:8000/debates/${sessionId}/status/`);
        // if (statusRes.ok) {
        //   const statusData: BackendDebateStatus = await statusRes.json();
        //   setIsDebateActive(statusData.is_running); // or use is_running from status
        // }
        // --- ---


      } catch (err) {
        console.error("Polling failed:", err)
      }
    }

    // Initial fetch
    fetchData()

    // Poll every 2 seconds
    const interval = setInterval(fetchData, 2000)
    return () => clearInterval(interval)
  }, [sessionId, debateInfo]) // Removed apiKey dependency

  const handleSendMessage = async () => {
    const content = messageInput.trim()
    if (!content || !sessionId) return // Removed apiKey check

    try {
      const res = await fetch(`http://localhost:8000/debates/${sessionId}/message/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // No Authorization or API key header needed
        },
        body: JSON.stringify({ message: content }),
      })

      if (!res.ok) {
        const errText = await res.text(); // Safer to get text first
        console.error("Send message error response:", errText);
        // Try to parse JSON, fallback to text
        let errorMsg = `HTTP ${res.status}`;
        try {
            const errJson = JSON.parse(errText);
            errorMsg = errJson.detail || errorMsg;
        } catch (e) {
            // If not JSON, use the text
            errorMsg = errText || errorMsg;
        }
        throw new Error(errorMsg)
      }

      // Assuming success, clear input. Backend handles queuing.
      setMessageInput("")
      setError(null)

    } catch (err: any) {
      console.error("Failed to send message:", err)
      setError(err.message || "Failed to send message")
    }
  }

  // Create participants list
  const participants: Character[] = debateInfo
    ? [
        {
          id: "user",
          name: debateInfo.user_name,
          role: "Council Member",
          avatar: "",
          online: true,
          colorIndex: 0
        },
        ...debateInfo.council_members.map((cm, i) => ({
          id: cm.name.toLowerCase().replace(/\s+/g, "-"),
          name: cm.name,
          role: "Debater",
          avatar: `/images/${cm.name.toLowerCase().replace(/\s+/g, "-")}.jpg`, // You might need to adjust image paths
          online: true, // Assume online for now
          colorIndex: (i % 9) + 1,
        }))
      ]
    : []

  const getCharacterColors = (colorIndex: number, isUser: boolean = false) => {
    if (isUser) return { bg: "bg-amber-500", text: "text-slate-900", indicator: "bg-amber-500" }

    const colorMap = {
      1: { bg: "bg-blue-600", text: "text-white", indicator: "bg-blue-500" },
      2: { bg: "bg-green-600", text: "text-white", indicator: "bg-green-500" },
      3: { bg: "bg-purple-600", text: "text-white", indicator: "bg-purple-500" },
      4: { bg: "bg-red-600", text: "text-white", indicator: "bg-red-500" },
      5: { bg: "bg-indigo-600", text: "text-white", indicator: "bg-indigo-500" },
      6: { bg: "bg-pink-600", text: "text-white", indicator: "bg-pink-500" },
      7: { bg: "bg-orange-600", text: "text-white", indicator: "bg-orange-500" },
      8: { bg: "bg-teal-600", text: "text-white", indicator: "bg-teal-500" },
      9: { bg: "bg-cyan-600", text: "text-white", indicator: "bg-cyan-500" },
    }

    return colorMap[colorIndex as keyof typeof colorMap] || colorMap[1]
  }

  if (error) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center text-red-400 p-6">
        <div className="text-center">
          <p className="text-lg mb-4">{error}</p>
          <Link href="/debate/new">
            <Button variant="outline" className="text-slate-300 border-slate-600">
              <X className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (loading || !debateInfo) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 text-lg mb-2">Loading debate...</p>
          <p className="text-slate-500 text-sm">Session ID: {sessionId}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-slate-900 flex">
      {/* Left Sidebar - Debate Sessions */}
      <div className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-amber-500 text-slate-900">
                  {debateInfo.user_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-white font-medium">Your Councils</h3>
                <p className="text-slate-400 text-sm">Active Debates</p>
              </div>
            </div>
            <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative">
            <MessageCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search debates..."
              className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <p className="text-slate-500 text-sm p-4">No other debates</p>
        </div>
      </div>

      {/* Center - Chat Interface */}
      <div className="flex-1 flex flex-col bg-slate-900">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-700 bg-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex -space-x-1">
                {participants.slice(0, 3).map((p, i) => (
                  <Avatar key={i} className="h-8 w-8 border-2 border-slate-800">
                    <AvatarFallback className={`${getCharacterColors(p.colorIndex).bg} text-white text-xs`}>
                      {p.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <div>
                <h2 className="text-white font-semibold">{debateInfo.topic}</h2>
                {/* Use isDebateActive state */}
                <p className="text-slate-400 text-sm">
                  {isDebateActive ? "Live Debate" : "Debate Starting"} • {participants.length} participants
                </p>
              </div>
            </div>
            <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto"> {/* Added overflow-y-auto here too for scrolling messages */}
          <div className="p-6 space-y-6">
            <div className="text-center">
              {/* Use isDebateActive state */}
              <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-600">
                Debate {isDebateActive ? "Active" : "Starting"} • Now
              </Badge>
            </div>

            {messages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">
                  {/* Use isDebateActive state */}
                  {isDebateActive
                    ? "Waiting for the first message..."
                    : "The debate is starting up. Characters are preparing their thoughts..."
                  }
                </p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isUser = msg.sender === debateInfo.user_name
                const participant = participants.find(p => p.name === msg.sender) || { colorIndex: 1 }
                const colors = getCharacterColors(participant.colorIndex, isUser)

                return (
                  <div key={index} className={`group ${isUser ? 'flex justify-end' : ''}`}>
                    <div className={`flex items-start space-x-3 max-w-[80%] ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      {/* Avatar */}
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        {isUser ? (
                          <AvatarFallback className="bg-amber-500 text-slate-900">
                            {debateInfo.user_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        ) : (
                          <AvatarFallback className={`${colors.bg} text-white text-xs`}>
                            {msg.sender.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        )}
                      </Avatar>

                      <div className={`flex-1 min-w-0 ${isUser ? 'text-right' : ''}`}>
                        <div className={`flex items-center space-x-2 mb-1 ${isUser ? 'flex-row-reverse justify-start' : ''}`}>
                          <span className="font-medium text-white text-base">{msg.sender}</span>
                          {/* Placeholder timestamp - replace if backend provides one */}
                          <span className="text-sm text-slate-500">
                            {/* {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'} */}
                            {/* Or just show 'Now' or omit if not available */}
                            Now
                          </span>
                        </div>
                        <div className={`rounded-2xl px-4 py-3 ${
                          isUser
                            ? 'bg-amber-500 text-slate-900'
                            : 'bg-slate-700 text-white hover:bg-slate-700/80'
                        } transition-colors`}>
                          <p className="text-base leading-relaxed">{msg.message}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-slate-700 bg-slate-800">
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <div className="bg-slate-700 rounded-2xl p-4">
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Share your perspective..."
                  className="w-full bg-transparent resize-none focus:outline-none text-white placeholder:text-slate-400 text-base"
                  rows={3}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                />
                <div className="flex justify-end mt-2">
                  <Button
                    size="sm"
                    className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                    disabled={!messageInput.trim()}
                    onClick={handleSendMessage}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Debate Info */}
      <div className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col">
        {/* Current Topic */}
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-white font-semibold mb-3">Current Debate</h3>
          <Card className="bg-slate-700 border-slate-600">
            <CardContent className="p-4">
              <h4 className="text-white font-medium text-sm mb-2">{debateInfo.topic}</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                A philosophical council of {participants.length - 1} characters is discussing this topic.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Participants */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold">Participants</h3>
            <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-700/50">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="flex-1">
                <p className="font-medium text-white text-sm">{debateInfo.user_name}</p>
                <p className="text-xs text-slate-400">Council Member</p>
              </div>
            </div>

            {participants.slice(1).map((participant, i) => {
              const colors = getCharacterColors(participant.colorIndex)
              return (
                <div key={i} className="flex items-center space-x-3 p-3 rounded-lg bg-slate-700/50">
                  <div className="relative">
                    <div className={`w-3 h-3 rounded-full ${colors.indicator}`} />
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={`${colors.bg} text-white text-xs`}>
                      {participant.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="text-white text-sm font-medium">{participant.name}</h4>
                    <p className="text-slate-400 text-xs">{participant.role || "Debater"}</p>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-white font-semibold mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
              asChild
            >
              <Link href="/debate/new">
                <MessageCircle className="h-4 w-4 mr-2" />
                New Debate
              </Link>
            </Button>
          </div>
        </div>

        <div className="p-4">
          {/* Use isDebateActive state */}
          <p className="text-slate-500 text-sm">
            Status: {isDebateActive ? "Active" : "Starting up..."}
          </p>
        </div>
      </div>
    </div>
  )
}
