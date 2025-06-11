import React, { useState, useEffect, useRef } from 'react'
import { Send, MessageSquare, X, Maximize2, Bot, Lightbulb, Target, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { chatService, type ChatRequest, type Message } from '@/services/chatService'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

interface MiniChatInterfaceProps {
  className?: string
}

interface QuickPrompt {
  id: string
  title: string
  prompt: string
  icon: React.ComponentType<{ className?: string }>
  category: string
  color: string
}

const quickPrompts: QuickPrompt[] = [
  {
    id: 'suggest-lesson',
    title: 'Suggest a lesson',
    prompt: 'Based on my learning progress, suggest a suitable lesson for today that matches my skill level and interests.',
    icon: BookOpen,
    category: 'Learning',
    color: 'bg-blue-100 text-blue-700'
  },
  {
    id: 'learning-goal',
    title: 'Create learning goal',
    prompt: 'Help me create a new learning goal. I want to set SMART objectives for my programming and economics studies.',
    icon: Target,
    category: 'Goals',
    color: 'bg-green-100 text-green-700'
  },
  {
    id: 'study-summary',
    title: 'Last lesson summary',
    prompt: 'Provide a summary of the last lesson I studied, including key concepts and areas where I might need more practice.',
    icon: Lightbulb,
    category: 'Review',
    color: 'bg-purple-100 text-purple-700'
  }
]

export default function MiniChatInterface({ className }: MiniChatInterfaceProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<number | null>(null)
  const navigate = useNavigate()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return

    setIsLoading(true)
    setInputMessage('')

    // Add user message immediately
    const userMessage: Message = {
      id: Date.now(),
      conversation_id: conversationId || 0,
      role: 'user',
      content: messageText.trim(),
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMessage])

    try {
      const chatRequest: ChatRequest = {
        message: messageText.trim(),
        conversation_id: conversationId || undefined
      }

      const response = await chatService.sendMessage(chatRequest)
      
      // Update messages with server response
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== userMessage.id)
        return [...filtered, 
          { ...userMessage, id: response.message.id - 1 },
          response.message
        ]
      })

      // Update conversation ID
      setConversationId(response.conversation.id)

    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error('Failed to send message. Please try again.')
      // Remove user message on error
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id))
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickPrompt = (prompt: string) => {
    setInputMessage(prompt)
    if (!isOpen) {
      setIsOpen(true)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(inputMessage)
    }
  }

  const openFullChat = () => {
    navigate('/chat')
  }

  const clearChat = () => {
    setMessages([])
    setConversationId(null)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Quick Prompts Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            AI Assistant
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Quick access to your learning companion
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {quickPrompts.map((prompt) => {
            const IconComponent = prompt.icon
            return (
              <Button
                key={prompt.id}
                variant="outline"
                className="w-full justify-start text-left h-auto py-3 px-4 border-dashed hover:border-solid transition-all"
                onClick={() => handleQuickPrompt(prompt.prompt)}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className={cn("p-2 rounded-lg", prompt.color)}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">{prompt.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {prompt.prompt.substring(0, 60)}...
                    </div>
                  </div>
                </div>
              </Button>
            )
          })}
          
          <div className="flex gap-2 pt-2">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="flex-1" size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Open Chat
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-lg">
                <SheetHeader>
                  <SheetTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Bot className="h-5 w-5" />
                      AI Assistant
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={openFullChat}
                        className="text-xs"
                      >
                        <Maximize2 className="h-3 w-3 mr-1" />
                        Full Chat
                      </Button>
                      {messages.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearChat}
                          className="text-xs"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col h-[calc(100vh-120px)] mt-4">
                  {/* Messages Area */}
                  <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-4">
                      {messages.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          <Bot size={32} className="mx-auto mb-3 opacity-50" />
                          <p className="text-sm">
                            Start a conversation with your AI assistant!
                          </p>
                          <div className="mt-4 space-y-2">
                            {quickPrompts.map((prompt) => (
                              <Button
                                key={prompt.id}
                                variant="ghost"
                                size="sm"
                                className="text-xs h-auto py-2 px-3"
                                onClick={() => {
                                  setInputMessage(prompt.prompt)
                                  inputRef.current?.focus()
                                }}
                              >
                                {prompt.title}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        messages.map((message) => (
                          <div
                            key={message.id}
                            className={cn(
                              "flex gap-3",
                              message.role === 'user' ? "justify-end" : "justify-start"
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                                message.role === 'user' 
                                  ? "bg-primary text-primary-foreground ml-auto" 
                                  : "bg-muted"
                              )}
                            >
                              <div className="whitespace-pre-wrap">
                                {message.content}
                              </div>
                              <div className="text-xs opacity-70 mt-1">
                                {new Date(message.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="bg-muted rounded-lg px-3 py-2 max-w-[85%]">
                            <div className="flex items-center gap-2 text-sm">
                              <div className="animate-pulse">AI is thinking...</div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Input Area */}
                  <div className="border-t pt-4 mt-4">
                    <div className="flex gap-2">
                      <Input
                        ref={inputRef}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Ask anything about learning..."
                        disabled={isLoading}
                        className="flex-1"
                      />
                      <Button 
                        onClick={() => sendMessage(inputMessage)}
                        disabled={!inputMessage.trim() || isLoading}
                        size="sm"
                        className="px-3"
                      >
                        <Send size={16} />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      AI can help with programming, economics, and learning topics
                    </p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={openFullChat}
              className="text-primary"
            >
              <Maximize2 className="h-4 w-4 mr-1" />
              Full Chat
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 