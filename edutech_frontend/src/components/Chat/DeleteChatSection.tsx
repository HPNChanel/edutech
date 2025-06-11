import React, { useState } from 'react'
import { Trash2, X, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import { chatService, type Conversation } from '@/services/chatService'

interface DeleteChatSectionProps {
  conversations: Conversation[]
  onConversationsUpdate: (conversations: Conversation[]) => void
  onClose: () => void
}

export default function DeleteChatSection({ 
  conversations, 
  onConversationsUpdate, 
  onClose 
}: DeleteChatSectionProps) {
  const [selectedConversations, setSelectedConversations] = useState<Set<number>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSelectConversation = (conversationId: number, checked: boolean) => {
    const newSelected = new Set(selectedConversations)
    if (checked) {
      newSelected.add(conversationId)
    } else {
      newSelected.delete(conversationId)
    }
    setSelectedConversations(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedConversations(new Set(conversations.map(c => c.id)))
    } else {
      setSelectedConversations(new Set())
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedConversations.size === 0) return

    const confirmMessage = selectedConversations.size === 1 
      ? 'Are you sure you want to delete this conversation? This action cannot be undone.'
      : `Are you sure you want to delete ${selectedConversations.size} conversations? This action cannot be undone.`

    if (!window.confirm(confirmMessage)) return

    setIsDeleting(true)

    try {
      const conversationIdsArray = Array.from(selectedConversations)
      const result = await chatService.deleteSelectedConversations(conversationIdsArray)

      // Update the conversations list
      const updatedConversations = conversations.filter(
        c => !selectedConversations.has(c.id)
      )
      onConversationsUpdate(updatedConversations)

      // Clear selection
      setSelectedConversations(new Set())

      // Show result message
      if (result.deleted_count > 0 && result.failed_count === 0) {
        toast.success(`Successfully deleted ${result.deleted_count} conversation${result.deleted_count > 1 ? 's' : ''}`)
      } else if (result.deleted_count > 0 && result.failed_count > 0) {
        toast.success(`Deleted ${result.deleted_count} conversations. ${result.failed_count} failed to delete.`)
      } else {
        toast.error('Failed to delete conversations')
      }

    } catch (error: unknown) {
      console.error('Error during bulk delete:', error)
      
      // Show more specific error message
      let errorMessage = 'Failed to delete conversations'
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { detail?: string } } }
        
        if (axiosError.response?.status === 422) {
          errorMessage = 'Invalid request format. Please try again.'
        } else if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
          errorMessage = 'Authentication required. Please log in again.'
        } else if (axiosError.response?.data?.detail) {
          errorMessage = `Error: ${axiosError.response.data.detail}`
        }
      }
      
      toast.error(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return 'Today'
    if (diffDays === 2) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays - 1} days ago`
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  const allSelected = conversations.length > 0 && selectedConversations.size === conversations.length
  const someSelected = selectedConversations.size > 0 && selectedConversations.size < conversations.length

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trash2 size={20} className="text-destructive" />
            <h2 className="text-lg font-semibold">Delete Each Chat</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X size={16} />
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={allSelected || someSelected}
              onCheckedChange={handleSelectAll}
              id="select-all"
            />
            <label htmlFor="select-all" className="text-sm font-medium">
              Select All ({conversations.length})
            </label>
          </div>

          {selectedConversations.size > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="destructive">
                {selectedConversations.size} selected
              </Badge>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="gap-1"
              >
                <Trash2 size={14} />
                Delete Selected
                {isDeleting && '...'}
              </Button>
            </div>
          )}
        </div>

        {conversations.length === 0 && (
          <div className="flex items-center gap-2 mt-4 p-3 bg-muted rounded-lg">
            <AlertTriangle size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              No conversations to delete
            </span>
          </div>
        )}
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                selectedConversations.has(conversation.id) 
                  ? "bg-destructive/5 border-destructive/20" 
                  : "bg-background hover:bg-muted/50"
              )}
            >
              <Checkbox
                checked={selectedConversations.has(conversation.id)}
                onCheckedChange={(checked) => 
                  handleSelectConversation(conversation.id, checked as boolean)
                }
                id={`conversation-${conversation.id}`}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm truncate pr-2">
                    {conversation.title}
                  </h3>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatDate(conversation.updated_at)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    ID: {conversation.id}
                  </Badge>
                  {conversation.is_archived && (
                    <Badge variant="secondary" className="text-xs">
                      Archived
                    </Badge>
                  )}
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  if (!window.confirm('Delete this conversation? This action cannot be undone.')) return
                  
                  try {
                    await chatService.deleteConversation(conversation.id)
                    const updatedConversations = conversations.filter(c => c.id !== conversation.id)
                    onConversationsUpdate(updatedConversations)
                    setSelectedConversations(prev => {
                      const newSet = new Set(prev)
                      newSet.delete(conversation.id)
                      return newSet
                    })
                    toast.success('Conversation deleted')
                  } catch (error) {
                    console.error('Failed to delete conversation:', error)
                    toast.error('Failed to delete conversation')
                  }
                }}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t bg-muted/20">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {conversations.length} total conversations
          </span>
          <span>
            {selectedConversations.size > 0 && `${selectedConversations.size} selected`}
          </span>
        </div>
      </div>
    </div>
  )
} 