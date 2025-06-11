import { useState, useEffect, useCallback } from 'react'
import { chatService, type Conversation, type Message, type ChatRequest } from '@/services/chatService'
import { toast } from 'react-hot-toast'

interface UseChatReturn {
  // State
  conversations: Conversation[]
  currentConversation: Conversation | null
  messages: Message[]
  isLoading: boolean
  isLoadingConversations: boolean
  
  // Actions
  loadConversations: () => Promise<void>
  loadConversation: (conversationId: number) => Promise<void>
  sendMessage: (message: string) => Promise<void>
  createNewConversation: () => void
  deleteConversation: (conversationId: number) => Promise<void>
  updateConversationTitle: (conversationId: number, title: string) => Promise<void>
  archiveConversation: (conversationId: number) => Promise<void>
  deleteMessage: (messageId: number) => Promise<void>
  clearChatHistory: () => Promise<void>
  deleteAllConversations: () => Promise<void>
}

export function useChat(): UseChatReturn {
  // State
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = useCallback(async () => {
    try {
      setIsLoadingConversations(true)
      const response = await chatService.getConversations(1, 50, false)
      setConversations(response.conversations)
    } catch (error) {
      console.error('Failed to load conversations:', error)
      toast.error('Failed to load chat history')
    } finally {
      setIsLoadingConversations(false)
    }
  }, [])

  const loadConversation = useCallback(async (conversationId: number) => {
    try {
      const conversation = await chatService.getConversation(conversationId)
      setCurrentConversation(conversation)
      setMessages(conversation.messages || [])
    } catch (error) {
      console.error('Failed to load conversation:', error)
      toast.error('Failed to load conversation')
    }
  }, [])

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return

    setIsLoading(true)

    // Add user message to UI immediately for better UX
    const tempUserMessage: Message = {
      id: Date.now(),
      conversation_id: currentConversation?.id || 0,
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempUserMessage])

    try {
      const chatRequest: ChatRequest = {
        message: messageText,
        conversation_id: currentConversation?.id
      }

      const response = await chatService.sendMessage(chatRequest)
      
      // Replace temp message with actual messages from server
      setMessages(prev => {
        const withoutTemp = prev.filter(msg => msg.id !== tempUserMessage.id)
        // The backend should return both user and assistant messages
        // For now, we'll add them manually
        const userMsg: Message = {
          id: response.message.id - 1, // Assuming sequential IDs
          conversation_id: response.conversation.id,
          role: 'user',
          content: messageText,
          created_at: response.message.created_at
        }
        return [...withoutTemp, userMsg, response.message]
      })

      // Update current conversation
      setCurrentConversation(response.conversation)

      // Update conversations list
      setConversations(prev => {
        const existing = prev.find(c => c.id === response.conversation.id)
        if (existing) {
          return prev.map(c => c.id === response.conversation.id ? response.conversation : c)
            .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        } else {
          return [response.conversation, ...prev]
        }
      })

    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error('Failed to send message. Please try again.')
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id))
    } finally {
      setIsLoading(false)
    }
  }, [currentConversation, isLoading])

  const createNewConversation = useCallback(() => {
    setCurrentConversation(null)
    setMessages([])
  }, [])

  const deleteConversation = useCallback(async (conversationId: number) => {
    try {
      await chatService.deleteConversation(conversationId)
      setConversations(prev => prev.filter(c => c.id !== conversationId))
      
      if (currentConversation?.id === conversationId) {
        createNewConversation()
      }
      
      toast.success('Conversation deleted')
    } catch (error) {
      console.error('Failed to delete conversation:', error)
      toast.error('Failed to delete conversation')
    }
  }, [currentConversation, createNewConversation])

  const updateConversationTitle = useCallback(async (conversationId: number, title: string) => {
    if (!title.trim()) return

    try {
      const updated = await chatService.updateConversation(conversationId, {
        title: title.trim()
      })
      
      setConversations(prev => 
        prev.map(c => c.id === conversationId ? updated : c)
      )
      
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(updated)
      }
      
      toast.success('Title updated')
    } catch (error) {
      console.error('Failed to update title:', error)
      toast.error('Failed to update title')
    }
  }, [currentConversation])

  const archiveConversation = useCallback(async (conversationId: number) => {
    try {
      await chatService.updateConversation(conversationId, {
        is_archived: true
      })
      
      setConversations(prev => prev.filter(c => c.id !== conversationId))
      
      if (currentConversation?.id === conversationId) {
        createNewConversation()
      }
      
      toast.success('Conversation archived')
    } catch (error) {
      console.error('Failed to archive conversation:', error)
      toast.error('Failed to archive conversation')
    }
  }, [currentConversation, createNewConversation])

  const deleteMessage = useCallback(async (messageId: number) => {
    if (!currentConversation) return
    
    try {
      await chatService.deleteMessage(currentConversation.id, messageId)
      
      // Remove message from local state
      setMessages(prev => prev.filter(msg => msg.id !== messageId))
      toast.success('Message deleted')
    } catch (error) {
      console.error('Failed to delete message:', error)
      toast.error('Failed to delete message')
    }
  }, [currentConversation])

  const clearChatHistory = useCallback(async () => {
    if (!currentConversation) return
    
    try {
      await chatService.clearChatHistory(currentConversation.id)
      
      // Clear messages from local state
      setMessages([])
      toast.success('Chat history cleared')
    } catch (error) {
      console.error('Failed to clear chat history:', error)
      toast.error('Failed to clear chat history')
    }
  }, [currentConversation])

  const deleteAllConversations = useCallback(async () => {
    try {
      const result = await chatService.deleteAllConversations()
      
      // Clear all conversations from local state
      setConversations([])
      
      // Clear current conversation and messages
      setCurrentConversation(null)
      setMessages([])
      
      toast.success(result.message)
    } catch (error) {
      console.error('Failed to delete all conversations:', error)
      toast.error('Failed to delete all conversations')
    }
  }, [])

  return {
    // State
    conversations,
    currentConversation,
    messages,
    isLoading,
    isLoadingConversations,
    
    // Actions
    loadConversations,
    loadConversation,
    sendMessage,
    createNewConversation,
    deleteConversation,
    updateConversationTitle,
    archiveConversation,
    deleteMessage,
    clearChatHistory,
    deleteAllConversations
  }
} 