import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Highlighter, StickyNote, Loader2, Brain, MessageSquare, Languages, HelpCircle } from 'lucide-react'
import { annotationService } from '@/services/annotationService'
import { aiAssistanceService } from '../services/aiAssistanceService'
import { type TextSelectionData } from '@/hooks/useTextSelectionData'

interface SidebarNoteFormProps {
  lessonId: number
  lessonTitle?: string
  currentSelection: TextSelectionData | null
  onNoteSaved?: () => void
  onHighlightSaved?: () => void
  onSelectionCleared?: () => void
}

export const SidebarNoteForm: React.FC<SidebarNoteFormProps> = ({
  lessonId,
  lessonTitle,
  currentSelection,
  onNoteSaved,
  onHighlightSaved,
  onSelectionCleared
}) => {
  const [noteContent, setNoteContent] = useState('')
  const [isCreatingHighlight, setIsCreatingHighlight] = useState(false)
  const [isCreatingNote, setIsCreatingNote] = useState(false)
  
  // AI assistance state
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [aiAction, setAiAction] = useState<string | null>(null)

  const hasSelectedText = currentSelection && currentSelection.selectedText && currentSelection.selectedText.length > 0
  const selectedText = currentSelection?.selectedText || ''

  // Protection to avoid losing selection - only for buttons, not input elements
  const preventSelectionLoss = (e: React.MouseEvent) => {
    e.preventDefault()
  }

  // AI assistance handler
  const handleAIAssistance = async (action: 'explanation' | 'summary' | 'translate_vi' | 'translate_en' | 'ask_questions') => {
    if (!hasSelectedText || !currentSelection) {
      alert('Please select text first')
      return
    }

    try {
      setIsLoadingAI(true)
      setAiAction(action)
      
      const response = await aiAssistanceService.getInlineAssistance({
        text: currentSelection.selectedText,
        action: action,
        context: lessonTitle || '',
        lesson_id: lessonId
      })
      
      // Auto-populate note with AI result
      setNoteContent(prev => {
        const actionLabel = action.replace('_', ' ').toUpperCase()
        const newContent = `${actionLabel}:\n${response.result}`
        return prev ? `${prev}\n\n${newContent}` : newContent
      })
      
    } catch (error) {
      console.error('AI assistance error:', error)
      alert('Failed to get AI assistance. Please try again.')
    } finally {
      setIsLoadingAI(false)
      setAiAction(null)
    }
  }

  const handleCreateHighlight = async () => {
    // Enhanced validation as suggested in the requirements
    if (!currentSelection || !currentSelection.selectedText) {
      alert('Please select text from the lesson content to create highlights')
      return
    }

    const { selectedText: text, start_offset, end_offset, blockId } = currentSelection

    // Validate all required fields exist and are valid
    if (!text.trim()) {
      alert('Selected text cannot be empty')
      return
    }

    if (start_offset < 0 || end_offset <= start_offset) {
      alert('Invalid text selection. Please try selecting text again.')
      console.error('Invalid selection offsets:', { start_offset, end_offset, text })
      return
    }

    try {
      setIsCreatingHighlight(true)
      
      console.log('🚀 Creating highlight with data:', {
        text: text.substring(0, 50) + '...',
        start_offset,
        end_offset,
        blockId,
        lesson_id: lessonId,
        color: 'yellow'
      })
      
      await annotationService.createHighlight(lessonId, {
        text,
        color: 'yellow',
        start_offset,
        end_offset
      })

      onHighlightSaved?.()
      
      // Clear selection after successful highlight
      onSelectionCleared?.()
      
      // Show success feedback
      console.log('✅ Highlight created successfully!')
      alert('Highlight created successfully!')
      
    } catch (error: unknown) {
      console.error('❌ Error creating highlight:', error)
      
      // Provide more specific error messages
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { detail?: string } } }
        if (axiosError.response?.status === 400) {
          const errorMessage = axiosError.response?.data?.detail || 'Invalid highlight data'
          alert(`Failed to create highlight: ${errorMessage}`)
        } else if (axiosError.response?.status === 401) {
          alert('You must be logged in to create highlights')
        } else if (axiosError.response?.status === 404) {
          alert('Lesson not found')
        } else {
          alert('Failed to create highlight. Please try again.')
        }
      } else {
        alert('Failed to create highlight. Please try again.')
      }
    } finally {
      setIsCreatingHighlight(false)
    }
  }

  const handleSaveNote = async () => {
    if (!hasSelectedText) {
      alert('Please select text first')
      return
    }

    if (!noteContent.trim()) {
      alert('Please enter a note')
      return
    }

    if (!currentSelection) {
      alert('Selection data is missing')
      return
    }

    try {
      setIsCreatingNote(true)
      
      // Create note with offset data for better backend integration
      await annotationService.createNote(lessonId, {
        content: noteContent.trim(),
        text: currentSelection.selectedText,
        start_offset: currentSelection.start_offset,
        end_offset: currentSelection.end_offset
      })

      // Clear form and selection after successful save
      setNoteContent('')
      onNoteSaved?.()
      onSelectionCleared?.()
      
      // Show success feedback
      alert('Note saved successfully!')
      
    } catch (error) {
      console.error('Error creating note:', error)
      alert('Failed to save note. Please try again.')
    } finally {
      setIsCreatingNote(false)
    }
  }

  return (
    <div className="fixed right-0 top-0 h-screen w-[320px] bg-white border-l border-gray-200 shadow-lg z-50 md:block hidden">
      <div className="flex flex-col h-full">
        <Card className="border-0 border-b rounded-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Create Note or Highlight</CardTitle>
          </CardHeader>
        </Card>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Selected Text Display */}
          <div className="space-y-2">
            <Label htmlFor="selected-text" className="text-sm font-medium">
              Selected Text
            </Label>
            <Textarea
              id="selected-text"
              value={selectedText}
              readOnly
              placeholder="Select text from the lesson to get started..."
              className="min-h-[80px] resize-none bg-gray-50 text-gray-700"
            />
          </div>

          {/* Note Content */}
          <div className="space-y-2">
            <Label htmlFor="note-content" className="text-sm font-medium">
              Note
            </Label>
            <Textarea
              id="note-content"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Add your note here..."
              maxLength={256}
              className="min-h-[100px] resize-none"
            />
            <div className="text-xs text-gray-500 text-right">
              {noteContent.length}/256 characters
            </div>
          </div>

          {/* AI Assistance Section */}
          {hasSelectedText && (
            <div className="space-y-3">
              <Separator />
              <Label className="text-sm font-medium text-blue-700">🤖 AI Assistance</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleAIAssistance('explanation')}
                  disabled={isLoadingAI}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onMouseDown={preventSelectionLoss}
                >
                  {isLoadingAI && aiAction === 'explanation' ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <Brain className="mr-1 h-3 w-3" />
                  )}
                  Explain
                </Button>
                
                <Button
                  onClick={() => handleAIAssistance('summary')}
                  disabled={isLoadingAI}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onMouseDown={preventSelectionLoss}
                >
                  {isLoadingAI && aiAction === 'summary' ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <MessageSquare className="mr-1 h-3 w-3" />
                  )}
                  Summary
                </Button>
                
                <Button
                  onClick={() => handleAIAssistance('translate_vi')}
                  disabled={isLoadingAI}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onMouseDown={preventSelectionLoss}
                >
                  {isLoadingAI && aiAction === 'translate_vi' ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <Languages className="mr-1 h-3 w-3" />
                  )}
                  VN
                </Button>
                
                <Button
                  onClick={() => handleAIAssistance('translate_en')}
                  disabled={isLoadingAI}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onMouseDown={preventSelectionLoss}
                >
                  {isLoadingAI && aiAction === 'translate_en' ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <Languages className="mr-1 h-3 w-3" />
                  )}
                  EN
                </Button>
                
                <Button
                  onClick={() => handleAIAssistance('ask_questions')}
                  disabled={isLoadingAI}
                  variant="outline"
                  size="sm"
                  className="text-xs col-span-2"
                  onMouseDown={preventSelectionLoss}
                >
                  {isLoadingAI && aiAction === 'ask_questions' ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <HelpCircle className="mr-1 h-3 w-3" />
                  )}
                  Study Questions
                </Button>
              </div>
              <Separator />
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <Button
              onClick={handleCreateHighlight}
              disabled={!hasSelectedText || isCreatingHighlight}
              className="w-full"
              variant="outline"
              onMouseDown={preventSelectionLoss}
            >
              {isCreatingHighlight ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Highlighter className="mr-2 h-4 w-4" />
              )}
              Create Highlight
            </Button>

            <Button
              onClick={handleSaveNote}
              disabled={!hasSelectedText || !noteContent.trim() || isCreatingNote}
              className="w-full"
              onMouseDown={preventSelectionLoss}
            >
              {isCreatingNote ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <StickyNote className="mr-2 h-4 w-4" />
              )}
              Save Note
            </Button>
          </div>

          {/* Selection Status Feedback */}
          {!hasSelectedText ? (
            <div className="text-sm text-gray-500 text-center p-4 bg-gray-50 rounded">
              Select text from the lesson content to create notes or highlights
            </div>
          ) : (
            <div className="text-sm text-green-600 text-center p-2 bg-green-50 rounded border border-green-200">
              ✅ Text selected ({selectedText.length} characters)
              {currentSelection?.start_offset !== undefined && (
                <div className="text-xs text-green-500 mt-1">
                  Offsets: {currentSelection.start_offset} - {currentSelection.end_offset}
                  {currentSelection.blockId && (
                    <span className="ml-2">| Block: {currentSelection.blockId}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile overlay - shown on smaller screens */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="p-4 space-y-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Selected Text</Label>
            <div className="text-sm bg-gray-50 p-2 rounded max-h-16 overflow-y-auto">
              {selectedText || 'Select text from the lesson...'}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobile-note" className="text-sm font-medium">
              Note
            </Label>
            <Textarea
              id="mobile-note"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Add your note..."
              maxLength={256}
              className="min-h-[60px] resize-none text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCreateHighlight}
              disabled={!hasSelectedText || isCreatingHighlight}
              className="flex-1"
              variant="outline"
              size="sm"
              onMouseDown={preventSelectionLoss}
            >
              {isCreatingHighlight ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <Highlighter className="mr-1 h-3 w-3" />
              )}
              Highlight
            </Button>

            <Button
              onClick={handleSaveNote}
              disabled={!hasSelectedText || !noteContent.trim() || isCreatingNote}
              className="flex-1"
              size="sm"
              onMouseDown={preventSelectionLoss}
            >
              {isCreatingNote ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <StickyNote className="mr-1 h-3 w-3" />
              )}
              Save Note
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 