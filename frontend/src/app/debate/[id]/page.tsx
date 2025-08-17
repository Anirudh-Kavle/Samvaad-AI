// src/app/debate/[id]/page.tsx - Updated with Previous Debates Sidebar
"use client"

import { useState, useEffect, use } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Send, MessageCircle, UserPlus, MoreHorizontal, X, Clock, Users } from "lucide-react"
import Link from "next/link"

// Interfaces matching backend models
interface CouncilMemberInfo {
  name: string
  agent_name: string
}

interface BackendDebateInfo {
  session_id: string
  user_name: string
  topic: string
  council_members: CouncilMemberInfo[]
  message: string
}

interface BackendChatMessage {
  sender: string
  timestamp?: string;
  message: string
}

interface BackendChatHistoryResponse {
  messages: BackendChatMessage[]
  is_active: boolean
}

interface BackendDebateStatus {
  session_id: string
  is_running: boolean
  is_waiting_for_input: boolean
  message_count: number
  current_prompt: string | null
}

// Interface for previous debates list
interface PreviousDebate {
  session_id: string
  user_name: string
  topic: string
  created_at: string
  participants: string[]
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
  console.log("DEBUG: sessionId from URL is:", sessionId);
  const [messageInput, setMessageInput] = useState("")
  const [messages, setMessages] = useState<BackendChatMessage[]>([])
  const [debateInfo, setDebateInfo] = useState<BackendDebateInfo | null>(null)
  const [isDebateActive, setIsDebateActive] = useState<boolean>(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionTokenError, setSessionTokenError] = useState<string | null>(null);  
  // Previous debates sidebar state
  const [previousDebates, setPreviousDebates] = useState<PreviousDebate[]>([])
  const [sidebarLoading, setSidebarLoading] = useState(true)
  const [selectedDebateId, setSelectedDebateId] = useState<string>(sessionId)
  const [searchQuery, setSearchQuery] = useState("")

  // Add helper function for API calls with session token
const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
  const sessionToken = localStorage.getItem("SESSION_TOKEN");
  if (!sessionToken) {
    throw new Error("No session token found. Please start a new debate.");
  }

  const headers = {
    ...options.headers,
    "X-Session-Token": sessionToken,
    "Content-Type": "application/json",
  };

  return fetch(url, {
    ...options,
    headers,
  });
};

// Fetch all previous debates for sidebar
  useEffect(() => {
    const fetchPreviousDebates = async () => {
      try {
        const sessionToken = localStorage.getItem("SESSION_TOKEN");
        if (!sessionToken) {
          setSessionTokenError("No session found. Please start a new session.");
          setSidebarLoading(false);
          return;
        }

        const res = await makeAuthenticatedRequest('http://localhost:8000/debates/');
        if (res.ok) {
          const debates: PreviousDebate[] = await res.json();
          setPreviousDebates(debates);
          setSessionTokenError(null);
        } else if (res.status === 401) {
          setSessionTokenError("Session expired. Please start a new debate.");
        } else {
          console.error("Failed to fetch debates:", res.status);
          setSessionTokenError("Failed to load your debates.");
        }
      } catch (err) {
        console.error("Failed to fetch previous debates:", err);
        setSessionTokenError("Failed to load your debates.");
      } finally {
        setSidebarLoading(false);
      }
    };

    fetchPreviousDebates();
  }, []);

  // Fetch debate metadata
  useEffect(() => {
    console.log("DEBUG: useEffect for fetchDebateInfo is running. selectedDebateId is:", selectedDebateId); // DEBUG 2: Check if the effect runs

    if (!selectedDebateId) {
      console.log("DEBUG: Bailing out because selectedDebateId is missing."); // DEBUG 3: Check the guard clause
      return;
    }

    const fetchDebateInfo = async () => {
      console.log("DEBUG: fetchDebateInfo function is about to run."); // DEBUG 4: Check if the async function starts
      try {
        setLoading(true);
        const res = await makeAuthenticatedRequest(`http://localhost:8000/debates/${selectedDebateId}/info/`);

        if (!res.ok) {
          throw new Error(`Failed to load debate info: ${res.status}`);
        }

        const data: BackendDebateInfo = await res.json();
        setDebateInfo(data);
        setError(null);

      } catch (err: any) {
        console.error("DEBUG: CRITICAL - Error caught in fetchDebateInfo:", err); // DEBUG 5: Check for hidden errors
        setError(`Could not load debate session: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchDebateInfo();
  }, [selectedDebateId]);


  // Poll for new messages and debate status
  useEffect(() => {
    if (!selectedDebateId || !debateInfo) return;

    const fetchData = async () => {
      try {
        const historyRes = await makeAuthenticatedRequest(`http://localhost:8000/debates/${selectedDebateId}/full_history/`);

        if (!historyRes.ok) {
          console.warn(`Failed to fetch messages: ${historyRes.status}`);
          return;
        }

        const historyData: BackendChatHistoryResponse = await historyRes.json();
        if (historyData.messages && Array.isArray(historyData.messages)) {
          setMessages(historyData.messages);
        }
        setIsDebateActive(historyData.is_active);

      } catch (err) {
        console.error("Polling for messages failed:", err);
      }
    };

    fetchData(); // Initial fetch

    // Only poll if this is the current/active debate
    if (selectedDebateId === sessionId) {
      const interval = setInterval(fetchData, 2000);
      return () => clearInterval(interval);
    }
  }, [selectedDebateId, debateInfo, sessionId]);

  const handleSendMessage = async () => {
    const content = messageInput.trim();
    if (!content || !selectedDebateId) return;
    
    if (selectedDebateId !== sessionId) {
      setError("You can only send messages to the current active debate.");
      return;
    }

    try {
      const sessionToken = localStorage.getItem("SESSION_TOKEN");
      if (!sessionToken) {
        setError("No session found. Please start a new debate.");
        return;
      }

      const res = await makeAuthenticatedRequest(
        `http://localhost:8000/debates/${selectedDebateId}/message/`,
        {
          method: "POST",
          body: JSON.stringify({ message: content }),
        }
      );

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error("Access denied to this debate session.");
        }
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }

      setMessageInput("");
      setError(null);

    } catch (err: any) {
      console.error("Failed to send message:", err);
      setError(err.message || "Failed to send message");
    }
  };
  if (sessionTokenError && !debateInfo) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center text-amber-400 p-6">
        <div className="text-center">
          <p className="text-lg mb-4">{sessionTokenError}</p>
          <Link href="/debate/new">
            <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900">
              Start New Debate
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  const handleDebateSelect = (debateId: string) => {
    setSelectedDebateId(debateId)
    // Update URL if different from current
    if (debateId !== sessionId) {
      window.history.pushState({}, '', `/debate/${debateId}`)
    }
  }

  // Filter debates based on search query
  const filteredDebates = previousDebates.filter(debate =>
    debate.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    debate.participants.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Create participants list for current debate
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
          avatar: `/images/${cm.name.toLowerCase().replace(/\s+/g, "-")}.jpg`,
          online: true,
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return "Today"
    if (diffInDays === 1) return "Yesterday"
    if (diffInDays < 7) return `${diffInDays} days ago`
    return date.toLocaleDateString()
  }

  if (error && !debateInfo) {
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

  return (
    <div className="h-screen bg-slate-900 flex">
      {/* Left Sidebar - Previous Debates */}
      <div className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-amber-500 text-slate-900">
                  {debateInfo?.user_name.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-white font-medium">Your Councils</h3>
                <p className="text-slate-400 text-sm">
                  {sidebarLoading 
                    ? "Loading..." 
                    : sessionTokenError 
                      ? "Session expired" 
                      : `${previousDebates.length} debates`
                  }
                </p>
              </div>
            </div>
            <Link href="/debate/new">
              <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white h-8 w-8 p-0">
                <MessageCircle className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Show session warning if needed */}
          {sessionTokenError && (
            <div className="mb-4 p-2 text-xs text-amber-400 bg-amber-900/20 border border-amber-800 rounded">
              {sessionTokenError}
            </div>
          )}

          <div className="relative">
            <MessageCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search debates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              disabled={!!sessionTokenError}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sidebarLoading ? (
            <div className="p-4">
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-slate-700 rounded-lg animate-pulse"></div>
                ))}
              </div>
            </div>
          ) : filteredDebates.length === 0 ? (
            <div className="p-4">
              <p className="text-slate-500 text-sm text-center">
                {searchQuery ? "No matching debates found" : "No previous debates"}
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredDebates.map((debate) => (
                <button
                  key={debate.session_id}
                  onClick={() => handleDebateSelect(debate.session_id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors hover:bg-slate-700/50 ${
                    selectedDebateId === debate.session_id
                      ? "bg-slate-700 border-l-2 border-amber-500"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white text-sm font-medium truncate mb-1">
                        {debate.topic}
                      </h4>
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="h-3 w-3 text-slate-500" />
                        <p className="text-slate-400 text-xs truncate">
                          {debate.participants.slice(0, 2).join(", ")}
                          {debate.participants.length > 2 && ` +${debate.participants.length - 2}`}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-3 w-3 text-slate-500" />
                        <p className="text-slate-500 text-xs">
                          {formatDate(debate.created_at)}
                        </p>
                      </div>
                    </div>
                    {debate.session_id === sessionId && isDebateActive && (
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-1"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-700">
          <Link href="/debate/new">
            <Button
              variant="outline"
              size="sm"
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              New Debate
            </Button>
          </Link>
        </div>
      </div>

      {/* Center - Chat Interface */}
      <div className="flex-1 flex flex-col bg-slate-900">
        {loading || !debateInfo ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-slate-400 text-lg mb-2">Loading debate...</p>
              <p className="text-slate-500 text-sm">Session ID: {selectedDebateId}</p>
            </div>
          </div>
        ) : (
          <>
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
                    <p className="text-slate-400 text-sm">
                      {selectedDebateId === sessionId && isDebateActive ? "Live Debate" : "Historical Debate"} • {participants.length} participants
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                <div className="text-center">
                  <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-600">
                    {selectedDebateId === sessionId && isDebateActive ? "Live Debate" : "Historical Debate"}
                  </Badge>
                </div>

                {error && (
                  <div className="p-3 text-sm text-red-400 bg-red-900/30 border border-red-800 rounded-md">
                    {error}
                  </div>
                )}

                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-400">
                      {selectedDebateId === sessionId && isDebateActive
                        ? "Waiting for the first message..."
                        : "No messages in this debate yet."
                      }
                    </p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isUser = msg.sender === debateInfo.user_name
                    const participant = participants.find(p => p.name === msg.sender) || { colorIndex: 1 }
                    const colors = getCharacterColors(participant.colorIndex, isUser)
                    const formatTimestamp = (timestampStr?: string) => {
                      if (!timestampStr) return "Unknown Time";
                      try {
                        const date = new Date(timestampStr);
                        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      } catch (e) {
                        console.error("Error formatting time:", e);
                        return "Unknown Time";
                      }
                    };
                    return (
                      <div key={index} className={`group ${isUser ? 'flex justify-end' : ''}`}>
                        <div className={`flex items-start space-x-3 max-w-[80%] ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
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
                              <span className="text-sm text-slate-500">{formatTimestamp(msg.timestamp)}</span>
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

            {/* Message Input - Only show for current/active debates */}
            {selectedDebateId === sessionId && (
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
            )}

            {/* Info message for historical debates */}
            {selectedDebateId !== sessionId && (
              <div className="p-4 border-t border-slate-700 bg-slate-800">
                <div className="text-center text-slate-400 text-sm">
                  You're viewing a historical debate. 
                  <Link href={`/debate/${sessionId}`} className="text-amber-400 hover:text-amber-300 ml-1">
                    Return to current debate
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Right Sidebar - Debate Info */}
      {debateInfo && (
        <div className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col">
          {/* Current Topic */}
          <div className="p-4 border-b border-slate-700">
            <h3 className="text-white font-semibold mb-3">Current Debate</h3>
            <Card className="bg-slate-700 border-slate-600">
              <CardContent className="p-4">
                <h4 className="text-white font-medium text-sm mb-2">{debateInfo.topic}</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  A philosophical council of {participants.length - 1} characters discussing this topic.
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

          <div className="p-4">
            <p className="text-slate-500 text-sm">
              Status: {selectedDebateId === sessionId && isDebateActive ? "Active" : "Historical"}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}