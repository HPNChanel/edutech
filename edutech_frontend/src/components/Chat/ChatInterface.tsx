import React, { useState, useEffect, useRef } from 'react'
import { Send, Plus, MessageSquare, Trash2, Edit3, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { chatService, type Conversation, type Message, type ChatRequest } from '@/services/chatService'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'
import DeleteChatSection from './DeleteChatSection'

interface ChatInterfaceProps {
  className?: string
}

export default function ChatInterface({ className }: ChatInterfaceProps) {
  // State management
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const [editingConversationId, setEditingConversationId] = useState<number | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [showDeleteSection, setShowDeleteSection] = useState(false)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadConversations = async () => {
    try {
      setIsLoadingConversations(true)
      const response = await chatService.getConversations(1, 50)
      setConversations(response.conversations)
    } catch (error) {
      console.error('Failed to load conversations:', error)
      toast.error('Failed to load chat history')
    } finally {
      setIsLoadingConversations(false)
    }
  }

  const loadConversation = async (conversationId: number) => {
    try {
      const conversation = await chatService.getConversation(conversationId)
      setCurrentConversation(conversation)
      setMessages(conversation.messages || [])
    } catch (error) {
      console.error('Failed to load conversation:', error)
      toast.error('Failed to load conversation')
    }
  }

  const startNewConversation = () => {
    setCurrentConversation(null)
    setMessages([])
    inputRef.current?.focus()
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const messageText = inputMessage.trim()
    setInputMessage('')
    setIsLoading(true)

    // Add user message to UI immediately
    const userMessage: Message = {
      id: Date.now(), // Temporary ID
      conversation_id: currentConversation?.id || 0,
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMessage])

    try {
      const chatRequest: ChatRequest = {
        message: messageText,
        conversation_id: currentConversation?.id
      }

      const response = await chatService.sendMessage(chatRequest)
      
      // Update messages with actual response
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== userMessage.id)
        return [...filtered, 
          { ...userMessage, id: response.message.id - 1 }, // Assuming user message ID is AI message ID - 1
          response.message
        ]
      })

      // Update current conversation
      setCurrentConversation(response.conversation)

      // Update conversations list
      setConversations(prev => {
        const existing = prev.find(c => c.id === response.conversation.id)
        if (existing) {
          return prev.map(c => c.id === response.conversation.id ? response.conversation : c)
        } else {
          return [response.conversation, ...prev]
        }
      })

    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error('Failed to send message. Please try again.')
      // Remove user message on error
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id))
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const deleteConversation = async (conversationId: number) => {
    if (!confirm('Are you sure you want to delete this conversation?')) return

    try {
      await chatService.deleteConversation(conversationId)
      setConversations(prev => prev.filter(c => c.id !== conversationId))
      
      if (currentConversation?.id === conversationId) {
        startNewConversation()
      }
      
      toast.success('Conversation deleted')
    } catch (error) {
      console.error('Failed to delete conversation:', error)
      toast.error('Failed to delete conversation')
    }
  }

  const startEditingTitle = (conversation: Conversation) => {
    setEditingConversationId(conversation.id)
    setEditingTitle(conversation.title)
  }

  const saveTitle = async (conversationId: number) => {
    if (!editingTitle.trim()) return

    try {
      const updated = await chatService.updateConversation(conversationId, {
        title: editingTitle.trim()
      })
      
      setConversations(prev => 
        prev.map(c => c.id === conversationId ? updated : c)
      )
      
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(updated)
      }
      
      setEditingConversationId(null)
      toast.success('Title updated')
    } catch (error) {
      console.error('Failed to update title:', error)
      toast.error('Failed to update title')
    }
  }

  const cancelEditingTitle = () => {
    setEditingConversationId(null)
    setEditingTitle('')
  }

  const handleDeleteMessage = async (messageId: number) => {
    if (!currentConversation || !window.confirm('Are you sure you want to delete this message?')) return

    try {
      await chatService.deleteMessage(currentConversation.id, messageId)
      setMessages(prev => prev.filter(msg => msg.id !== messageId))
      toast.success('Message deleted')
    } catch (error) {
      console.error('Failed to delete message:', error)
      toast.error('Failed to delete message')
    }
  }

  const handleClearHistory = async () => {
    if (!currentConversation || !window.confirm('Are you sure you want to clear all messages in this conversation?')) return

    try {
      await chatService.clearChatHistory(currentConversation.id)
      setMessages([])
      toast.success('Chat history cleared')
    } catch (error) {
      console.error('Failed to clear chat history:', error)
      toast.error('Failed to clear chat history')
    }
  }

  const handleDeleteAllConversations = async () => {
    if (conversations.length === 0) return
    
    if (!window.confirm(`Are you sure you want to delete all ${conversations.length} conversations? This action cannot be undone.`)) return

    try {
      await chatService.deleteAllConversations()
      setConversations([])
      setCurrentConversation(null)
      setMessages([])
      toast.success('All conversations deleted')
    } catch (error) {
      console.error('Failed to delete all conversations:', error)
      toast.error('Failed to delete all conversations')
    }
  }

  return (
    <div className={cn("flex h-full bg-background", className)}>
      {/* Sidebar */}
      <div className="w-80 border-r flex flex-col">
        {showDeleteSection ? (
          <DeleteChatSection
            conversations={conversations}
            onConversationsUpdate={(updatedConversations) => {
              setConversations(updatedConversations)
              // Clear current conversation if it was deleted
              if (currentConversation && !updatedConversations.find(c => c.id === currentConversation.id)) {
                setCurrentConversation(null)
                setMessages([])
              }
            }}
            onClose={() => setShowDeleteSection(false)}
          />
        ) : (
          <>
            {/* Sidebar Header */}
            <div className="p-4 border-b space-y-2">
              <Button 
                onClick={startNewConversation}
                className="w-full justify-start gap-2"
                variant="outline"
              >
                <Plus size={16} />
                New Chat
              </Button>
              {conversations.length > 0 && (
                <>
                  <Button 
                    onClick={handleDeleteAllConversations}
                    className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    variant="outline"
                  >
                    <Trash2 size={16} />
                    Delete All Chats ({conversations.length})
                  </Button>
                  <Button 
                    onClick={() => setShowDeleteSection(true)}
                    className="w-full justify-start gap-2 text-orange-600 hover:text-orange-600 hover:bg-orange-50"
                    variant="outline"
                  >
                    <Settings size={16} />
                    Manage Individual Chats
                  </Button>
                </>
              )}
            </div>

            {/* Conversations List */}
            <ScrollArea className="flex-1">
              <div className="p-2">
                {isLoadingConversations ? (
                  <div className="text-center text-muted-foreground py-8">
                    Loading conversations...
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No conversations yet.<br />
                    Start a new chat to begin!
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={cn(
                        "group flex items-center gap-2 p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
                        currentConversation?.id === conversation.id && "bg-muted"
                      )}
                    >
                      {editingConversationId === conversation.id ? (
                        <Input
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={() => saveTitle(conversation.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveTitle(conversation.id)
                            if (e.key === 'Escape') cancelEditingTitle()
                          }}
                          className="flex-1 h-8"
                          autoFocus
                        />
                      ) : (
                        <>
                          <MessageSquare size={16} className="text-muted-foreground flex-shrink-0" />
                          <span 
                            className="flex-1 text-sm truncate"
                            onClick={() => loadConversation(conversation.id)}
                          >
                            {conversation.title}
                          </span>
                          <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                startEditingTitle(conversation)
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Edit3 size={12} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteConversation(conversation.id)
                              }}
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 size={12} />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">
                {currentConversation ? currentConversation.title : 'EduTech AI Assistant'}
              </h1>
              <p className="text-sm text-muted-foreground">
                Your personal learning companion for programming, economics, and more
              </p>
            </div>
            {currentConversation && messages.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearHistory}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 size={16} className="mr-2" />
                Clear History
              </Button>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
                <p className="text-sm">
                  Ask me about programming, economics, or any learning topic!
                </p>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  <Button
                    variant="outline"
                    className="justify-start text-left h-auto py-3 px-4"
                    onClick={() => setInputMessage("Explain the concept of supply and demand")}
                  >
                    <div>
                      <div className="font-medium">Economics</div>
                      <div className="text-sm text-muted-foreground">
                        Explain supply and demand
                      </div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start text-left h-auto py-3 px-4"
                    onClick={() => setInputMessage("How do I debug JavaScript code?")}
                  >
                    <div>
                      <div className="font-medium">Programming</div>
                      <div className="text-sm text-muted-foreground">
                        Debug JavaScript code
                      </div>
                    </div>
                  </Button>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "group flex gap-3",
                    message.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "relative max-w-[80%] rounded-lg px-4 py-2",
                      message.role === 'user' 
                        ? "bg-primary text-primary-foreground ml-auto" 
                        : "bg-muted"
                    )}
                  >
                    <div className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </div>
                    <div className="text-xs opacity-70 mt-1">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteMessage(message.id)}
                      className={cn(
                        "absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity",
                        "text-destructive hover:text-destructive hover:bg-destructive/10"
                      )}
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2 max-w-[80%]">
                  <div className="flex items-center gap-2">
                    <div className="animate-pulse">AI is thinking...</div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask anything about programming, economics, or learning..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              size="sm"
              className="px-3"
            >
              <Send size={16} />
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-2 text-center">
            EduTech AI can make mistakes. Consider checking important information.
          </div>
        </div>
      </div>
    </div>
  )
} 