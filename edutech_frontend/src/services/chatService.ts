import { api } from '@/lib/api'
import { AxiosResponse } from 'axios'

// Message interfaces
export interface Message {
  id: number
  conversation_id: number
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
  tokens_used?: number
}

// Conversation interfaces
export interface Conversation {
  id: number
  user_id: number
  title: string
  created_at: string
  updated_at: string
  is_archived: boolean
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[]
}

// Request/Response interfaces
export interface ChatRequest {
  message: string
  conversation_id?: number
}

export interface ChatResponse {
  message: Message
  conversation: Conversation
  tokens_used: number
}

export interface ConversationListResponse {
  conversations: Conversation[]
  total: number
  page: number
  per_page: number
}

export interface ConversationCreate {
  title?: string
}

export interface ConversationUpdate {
  title?: string
  is_archived?: boolean
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  openai_configured: boolean
  message: string
}

/**
 * Chat Service Class
 * Handles AI chat communication with backend
 */
class ChatService {
  private readonly baseEndpoint = '/chat'

  /**
   * Send message to AI assistant
   */
  async sendMessage(chatRequest: ChatRequest): Promise<ChatResponse> {
    try {
      const response: AxiosResponse<ChatResponse> = await api.post(
        `${this.baseEndpoint}/send`,
        chatRequest
      )
      return response.data
    } catch (error: unknown) {
      console.error('Send message error:', error)
      throw error
    }
  }

  /**
   * Get user's conversations with pagination
   */
  async getConversations(
    page: number = 1,
    per_page: number = 20,
    include_archived: boolean = false
  ): Promise<ConversationListResponse> {
    try {
      const response: AxiosResponse<ConversationListResponse> = await api.get(
        `${this.baseEndpoint}/conversations`,
        {
          params: { page, per_page, include_archived }
        }
      )
      return response.data
    } catch (error: unknown) {
      console.error('Get conversations error:', error)
      throw error
    }
  }

  /**
   * Create a new conversation
   */
  async createConversation(conversationData: ConversationCreate): Promise<Conversation> {
    try {
      const response: AxiosResponse<Conversation> = await api.post(
        `${this.baseEndpoint}/conversations`,
        conversationData
      )
      return response.data
    } catch (error: unknown) {
      console.error('Create conversation error:', error)
      throw error
    }
  }

  /**
   * Get a specific conversation with messages
   */
  async getConversation(conversationId: number): Promise<ConversationWithMessages> {
    try {
      const response: AxiosResponse<ConversationWithMessages> = await api.get(
        `${this.baseEndpoint}/conversations/${conversationId}`
      )
      return response.data
    } catch (error: unknown) {
      console.error('Get conversation error:', error)
      throw error
    }
  }

  /**
   * Update conversation details
   */
  async updateConversation(
    conversationId: number, 
    updateData: ConversationUpdate
  ): Promise<Conversation> {
    try {
      const response: AxiosResponse<Conversation> = await api.put(
        `${this.baseEndpoint}/conversations/${conversationId}`,
        updateData
      )
      return response.data
    } catch (error: unknown) {
      console.error('Update conversation error:', error)
      throw error
    }
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: number): Promise<void> {
    try {
      await api.delete(`${this.baseEndpoint}/conversations/${conversationId}`)
    } catch (error: unknown) {
      console.error('Delete conversation error:', error)
      throw error
    }
  }

  /**
   * Delete a specific message from a conversation
   */
  async deleteMessage(conversationId: number, messageId: number): Promise<void> {
    try {
      await api.delete(`${this.baseEndpoint}/conversations/${conversationId}/messages/${messageId}`)
    } catch (error: unknown) {
      console.error('Delete message error:', error)
      throw error
    }
  }

  /**
   * Clear all messages from a conversation (clear chat history)
   */
  async clearChatHistory(conversationId: number): Promise<void> {
    try {
      await api.delete(`${this.baseEndpoint}/conversations/${conversationId}/messages`)
    } catch (error: unknown) {
      console.error('Clear chat history error:', error)
      throw error
    }
  }

  /**
   * Delete all conversations for the current user
   */
  async deleteAllConversations(): Promise<{ message: string; deleted_count: number }> {
    try {
      const response = await api.delete(`${this.baseEndpoint}/conversations`)
      return response.data
    } catch (error: unknown) {
      console.error('Delete all conversations error:', error)
      throw error
    }
  }

  /**
   * Delete selected conversations in bulk
   */
  async deleteSelectedConversations(conversationIds: number[]): Promise<{ 
    message: string; 
    deleted_count: number; 
    failed_count: number 
  }> {
    try {
      const response = await api.request({
        method: 'DELETE',
        url: `${this.baseEndpoint}/conversations/bulk`,
        data: { conversation_ids: conversationIds }
      })
      return response.data
    } catch (error: unknown) {
      console.error('Delete selected conversations error:', error)
      throw error
    }
  }

  /**
   * Check AI service health
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const response: AxiosResponse<HealthCheckResponse> = await api.get(
        `${this.baseEndpoint}/health`
      )
      return response.data
    } catch (error: unknown) {
      console.error('Health check error:', error)
      // Return degraded status on API failure
      return {
        status: 'unhealthy',
        openai_configured: false,
        message: 'Failed to check service status'
      }
    }
  }
}

// Export singleton instance
export const chatService = new ChatService()
export default chatService 