// lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface Character {
  name: string
  agent_name: string
}

export interface DebateSetupRequest {
  user_name: string
  character_names: string[]
  topic: string
}

export interface DebateInfoResponse {
  session_id: string
  user_name: string
  topic: string
  council_members: Character[]
  message: string
}

export interface ChatMessage {
  sender: string
  message: string
}

export interface ChatHistoryResponse {
  messages: ChatMessage[]
  is_active: boolean
}

export interface DebateStatusResponse {
  session_id: string
  is_running: boolean
  is_waiting_for_input: boolean
  message_count: number
  current_prompt?: string
}

export interface UserMessageRequest {
  message: string
}

class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = API_BASE_URL
  }

  async startDebate(request: DebateSetupRequest): Promise<DebateInfoResponse> {
    const response = await fetch(`${this.baseUrl}/debates/start/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to start debate')
    }

    return response.json()
  }

  async getDebateStatus(sessionId: string): Promise<DebateStatusResponse> {
    const response = await fetch(`${this.baseUrl}/debates/${sessionId}/status/`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to get debate status')
    }

    return response.json()
  }

  async getChatHistory(sessionId: string): Promise<ChatHistoryResponse> {
    const response = await fetch(`${this.baseUrl}/debates/${sessionId}/history/`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to get chat history')
    }

    return response.json()
  }

  async sendMessage(sessionId: string, message: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/debates/${sessionId}/message/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to send message')
    }
  }

  async stopDebate(sessionId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/debates/${sessionId}/`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to stop debate')
    }
  }
}

export const apiClient = new ApiClient()