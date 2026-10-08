// src/app/debate/[id]/page.tsx - Updated with Previous Debates Sidebar
"use client"

import { useState, useEffect, use } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { apiUrl } from "@/lib/api"
import { Send, MessageCircle, X, Clock, Users, PencilLine } from "lucide-react"
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
  console.log("API URL being used:", process.env.NEXT_PUBLIC_API_URL);
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
        const fullUrl = `${apiUrl}/debates/`;
        console.log("EXACT URL ABOUT TO FETCH:", fullUrl); 
        const res = await makeAuthenticatedRequest(`${apiUrl}/debates/`);

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
      console.log("DEBUG: useEffect for fetchDebateInfo is running. selectedDebateId is:", selectedDebateId);

      if (!selectedDebateId) {
          console.log("DEBUG: Bailing out because selectedDebateId is missing.");
          return;
      }

      const fetchDebateInfo = async () => {
          console.log("DEBUG: fetchDebateInfo function is about to run.");
          try {
              setLoading(true);
              // Use authenticated request for info endpoint too
              const res = await makeAuthenticatedRequest(`${apiUrl}/debates/${selectedDebateId}/info/`);

              if (!res.ok) {
                  if (res.status === 401 || res.status === 403) {
                      throw new Error("Access denied to this debate session");
                  }
                  throw new Error(`Failed to load debate info: ${res.status}`);
              }

              const data: BackendDebateInfo = await res.json();
              setDebateInfo(data);
              setError(null);

          } catch (err: any) {
              console.error("DEBUG: CRITICAL - Error caught in fetchDebateInfo:", err);
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
              // Get both history and status in one call to avoid inconsistency
              const historyRes = await makeAuthenticatedRequest(`${apiUrl}/debates/${selectedDebateId}/full_history/`);

              if (!historyRes.ok) {
                  console.warn(`Failed to fetch messages: ${historyRes.status}`);
                  return;
              }

              const historyData: BackendChatHistoryResponse = await historyRes.json();
              if (historyData.messages && Array.isArray(historyData.messages)) {
                  setMessages(historyData.messages);
              }
              
              // Use the is_active status from the history response consistently
              setIsDebateActive(historyData.is_active);

          } catch (err) {
              console.error("Polling for messages failed:", err);
              // Don't update status on error to avoid blinking
          }
      };

      fetchData(); // Initial fetch

      // Only poll if this is the current/active debate
      if (selectedDebateId === sessionId) {
          const interval = setInterval(fetchData, 3000); // Increased interval to reduce blinking
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
        `${apiUrl}/debates/${selectedDebateId}/message/`,
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
      <div className="min-h-screen grid place-items-center bg-[#f5efdf] p-6 text-black">
        <div className="max-w-md border-2 border-black bg-[#fffaf0] p-8 text-center shadow-[6px_6px_0_#000]">
          <p className="font-mono text-lg font-bold mb-4">{sessionTokenError}</p>
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
    if (isUser) return { bg: "bg-[#f7b538]", text: "text-black", indicator: "bg-[#f7b538]" }

    const colorMap = {
      1: { bg: "bg-[#78c7ff]", text: "text-black", indicator: "bg-[#78c7ff]" },
      2: { bg: "bg-[#bbdf63]", text: "text-black", indicator: "bg-[#bbdf63]" },
      3: { bg: "bg-[#c4a6ff]", text: "text-black", indicator: "bg-[#c4a6ff]" },
      4: { bg: "bg-[#ef6a67]", text: "text-black", indicator: "bg-[#ef6a67]" },
      5: { bg: "bg-[#ff9dc7]", text: "text-black", indicator: "bg-[#ff9dc7]" },
      6: { bg: "bg-[#f7b538]", text: "text-black", indicator: "bg-[#f7b538]" },
      7: { bg: "bg-[#78c7ff]", text: "text-black", indicator: "bg-[#78c7ff]" },
      8: { bg: "bg-[#bbdf63]", text: "text-black", indicator: "bg-[#bbdf63]" },
      9: { bg: "bg-[#c4a6ff]", text: "text-black", indicator: "bg-[#c4a6ff]" },
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
      <div className="min-h-screen grid place-items-center bg-[#f5efdf] p-6 text-black">
        <div className="max-w-md border-2 border-black bg-[#fffaf0] p-8 text-center shadow-[6px_6px_0_#000]">
          <p className="font-mono text-lg font-bold mb-4">{error}</p>
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
    <div className="h-screen overflow-hidden bg-[#f5efdf] text-black lg:flex">
      {/* Left Sidebar - Previous Debates */}
      <aside className="hidden w-80 shrink-0 flex-col border-r-2 border-black bg-[#fffaf0] lg:flex">
        <div className="border-b-2 border-black p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-[#f7b538] text-black">
                  {debateInfo?.user_name.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-serif text-xl font-black tracking-[-0.04em]">Council archive</h3>
                <p className="font-mono text-xs font-bold uppercase">
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
              <Button size="icon-sm" variant="ghost" className="text-black">
                <MessageCircle className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Show session warning if needed */}
          {sessionTokenError && (
            <div className="mb-4 border-2 border-black bg-[#f7b538] p-2 font-mono text-xs font-bold">
              {sessionTokenError}
            </div>
          )}

          <div className="relative">
            <MessageCircle className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black" />
            <Input
              placeholder="Search debates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 rounded-none border-2 border-black bg-[#f5efdf] pl-10 text-black placeholder:text-black/50"
              disabled={!!sessionTokenError}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sidebarLoading ? (
            <div className="p-4">
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse border-2 border-black bg-[#f7b538]"></div>
                ))}
              </div>
            </div>
          ) : filteredDebates.length === 0 ? (
            <div className="p-4">
              <p className="p-4 text-center font-mono text-xs font-bold uppercase">
                {searchQuery ? "No matching debates found" : "No previous debates"}
              </p>
            </div>
          ) : (
            <div className="space-y-2 p-3">
              {filteredDebates.map((debate) => (
                <button
                  key={debate.session_id}
                  onClick={() => handleDebateSelect(debate.session_id)}
                  className={`w-full border-2 border-transparent p-3 text-left transition-transform hover:-translate-y-0.5 hover:border-black ${
                    selectedDebateId === debate.session_id
                      ? "border-black bg-[#f7b538] shadow-[3px_3px_0_#000]"
                      : "bg-[#f5efdf]"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="mb-1 truncate font-serif text-base font-black tracking-[-0.03em]">
                        {debate.topic}
                      </h4>
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="h-3 w-3" />
                        <p className="truncate font-mono text-[10px] font-bold uppercase">
                          {debate.participants.slice(0, 2).join(", ")}
                          {debate.participants.length > 2 && ` +${debate.participants.length - 2}`}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-3 w-3" />
                        <p className="font-mono text-[10px] font-bold uppercase">
                          {formatDate(debate.created_at)}
                        </p>
                      </div>
                    </div>
                    {debate.session_id === sessionId && isDebateActive && (
                      <div className="mt-1 size-2 border border-black bg-[#bbdf63]"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t-2 border-black p-4">
          <Link href="/debate/new">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              New Debate
            </Button>
          </Link>
        </div>
      </aside>

      {/* Center - Chat Interface */}
      <main className="flex min-w-0 flex-1 flex-col bg-[#f5efdf]">
        {loading || !debateInfo ? (
          <div className="grid flex-1 place-items-center p-6">
            <div className="border-2 border-black bg-[#fffaf0] p-6 text-center shadow-[5px_5px_0_#000]">
              <p className="font-serif text-2xl font-black">Loading the record...</p>
              <p className="mt-2 font-mono text-xs font-bold uppercase">Session: {selectedDebateId}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <header className="border-b-2 border-black bg-[#fffaf0] px-5 py-4 sm:px-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex -space-x-2">
                    {participants.slice(0, 3).map((p, i) => (
                      <Avatar key={i} className="size-9 border-2 border-black">
                        <AvatarFallback className={`${getCharacterColors(p.colorIndex, p.id === "user").bg} text-black text-xs font-black`}>
                          {p.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <div>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[.18em]">The council record</p>
                    <h2 className="truncate font-serif text-2xl font-black tracking-[-0.05em] sm:text-3xl">{debateInfo.topic}</h2>
                    <p className="font-mono text-[10px] font-bold uppercase">
                      {selectedDebateId === sessionId && isDebateActive ? "Live argument in progress" : "Archived argument"} · {participants.length} voices
                    </p>
                  </div>
                </div>
                <Button size="icon-sm" variant="ghost" aria-label="Debate notes">
                  <PencilLine />
                </Button>
              </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto scrollbar">
              <div className="mx-auto max-w-4xl space-y-6 p-5 sm:p-8">
                <div className="flex items-center gap-3 py-2">
                  <span className="h-px flex-1 bg-black" />
                  <Badge className="bg-[#bbdf63] font-mono uppercase tracking-wide">
                    {selectedDebateId === sessionId && isDebateActive ? "Live Debate" : "Historical Debate"}
                  </Badge>
                  <span className="h-px flex-1 bg-black" />
                </div>

                {error && (
                  <div className="border-2 border-black bg-[#ef6a67] p-3 font-mono text-sm font-bold">
                    {error}
                  </div>
                )}

                {messages.length === 0 ? (
                  <div className="border-2 border-dashed border-black p-8 text-center">
                    <p className="font-serif text-xl font-black">
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
                      <article key={index} className={`group flex gap-3 ${isUser ? 'justify-end' : ''}`}>
                        <div className={`flex max-w-[92%] items-start gap-3 sm:max-w-[80%] ${isUser ? 'flex-row-reverse' : ''}`}>
                          <Avatar className="size-10 shrink-0 border-2 border-black">
                            {isUser ? (
                              <AvatarFallback className="bg-[#f7b538] text-black font-black">
                                {debateInfo.user_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            ) : (
                              <AvatarFallback className={`${colors.bg} text-black text-xs font-black`}>
                                {msg.sender.split(" ").map(n => n[0]).join("")}
                              </AvatarFallback>
                            )}
                          </Avatar>

                          <div className={`min-w-0 flex-1 ${isUser ? 'text-right' : ''}`}>
                            <div className={`mb-1 flex items-center gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
                              <span className="font-serif text-lg font-black tracking-[-0.03em]">{msg.sender}</span>
                              <span className="font-mono text-[10px] font-bold uppercase">{formatTimestamp(msg.timestamp)}</span>
                            </div>
                            <div className={`border-2 border-black px-4 py-3 text-left shadow-[4px_4px_0_#000] ${
                              isUser
                                ? 'bg-[#f7b538] text-black'
                                : `${colors.bg} text-black`
                            }`}>
                              <p className="text-base leading-relaxed">{msg.message}</p>
                            </div>
                          </div>
                        </div>
                      </article>
                    )
                  })
                )}
              </div>
            </div>

            {/* Message Input - Only show for current/active debates */}
            {selectedDebateId === sessionId && (
              <div className="border-t-2 border-black bg-[#fffaf0] p-4 sm:px-8">
                <div className="mx-auto flex max-w-4xl items-center gap-3">
                  <div className="flex-1">
                    <div className="border-2 border-black bg-[#f5efdf] p-3 shadow-[4px_4px_0_#000]">
                      <textarea
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Put your objection on the record..."
                        className="w-full resize-none bg-transparent text-base text-black placeholder:text-black/45 focus:outline-none"
                        rows={2}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage()
                          }
                        }}
                      />
                      <div className="mt-2 flex items-center justify-between border-t-2 border-black pt-2">
                        <span className="font-mono text-[10px] font-bold uppercase">Enter to submit · Shift+Enter for a new line</span>
                        <Button
                          size="sm"
                          className="bg-[#f7b538]"
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
              <div className="border-t-2 border-black bg-[#fffaf0] p-4">
                <div className="text-center font-mono text-xs font-bold uppercase">
                  This is an archived debate. The floor is closed.
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Right Sidebar - Debate Info */}
      {debateInfo && (
        <aside className="hidden w-80 shrink-0 flex-col border-l-2 border-black bg-[#fffaf0] xl:flex">
          <div className="border-b-2 border-black p-5">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[.18em]">Matter before the council</p>
            <h3 className="mt-2 font-serif text-2xl font-black leading-none tracking-[-0.05em]">{debateInfo.topic}</h3>
            <p className="mt-4 border-l-2 border-black pl-3 text-sm font-medium leading-relaxed">
              {participants.length} voices are on the record. Read closely; interruptions count.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-2xl font-black tracking-[-0.04em]">The roster</h3>
              <Badge className="bg-[#ff9dc7] font-mono">{participants.length}</Badge>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 border-2 border-black bg-[#f7b538] p-3 shadow-[3px_3px_0_#000]">
                <div className="size-3 border border-black bg-[#f7b538]" />
                <div className="flex-1">
                  <p className="font-serif text-lg font-black">{debateInfo.user_name}</p>
                  <p className="font-mono text-[10px] font-bold uppercase">Council member</p>
                </div>
              </div>

              {participants.slice(1).map((participant, i) => {
                const colors = getCharacterColors(participant.colorIndex)
                return (
                  <div key={i} className="flex items-center gap-3 border-2 border-black bg-[#f5efdf] p-3">
                    <Avatar className="size-9 border-2 border-black">
                      <AvatarFallback className={`${colors.bg} text-black text-xs font-black`}>
                        {participant.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-serif text-lg font-black leading-none">{participant.name}</h4>
                      <p className="mt-1 font-mono text-[10px] font-bold uppercase">{participant.role || "Debater"}</p>
                    </div>
                    <div className={`size-3 border border-black ${colors.indicator}`} />
                  </div>
                )
              })}
            </div>
          </div>

          <div className="border-t-2 border-black bg-[#bbdf63] p-4">
            <p className="font-mono text-xs font-bold uppercase">
              Floor status: {selectedDebateId === sessionId && isDebateActive ? "Open" : "Archived"}
            </p>
          </div>
        </aside>
      )}
    </div>
  )
}
