import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Highlighter, StickyNote, Loader2 } from 'lucide-react'
import { annotationService } from '@/services/annotationService'
import { noteService } from '@/services/noteService'

interface SidebarNoteFormProps {
  lessonId: number
  selectedText: string
  onNoteSaved?: () => void
  onHighlightSaved?: () => void
}

export const SidebarNoteForm: React.FC<SidebarNoteFormProps> = ({
  lessonId,
  selectedText,
  onNoteSaved,
  onHighlightSaved
}) => {
  const [noteContent, setNoteContent] = useState('')
  const [isCreatingHighlight, setIsCreatingHighlight] = useState(false)
  const [isCreatingNote, setIsCreatingNote] = useState(false)

  const hasSelectedText = selectedText && selectedText.length > 0

  const handleCreateHighlight = async () => {
    if (!hasSelectedText) {
      alert('Please select text first')
      return
    }

    try {
      setIsCreatingHighlight(true)
      
      await annotationService.createHighlight(lessonId, {
        text: selectedText,
        color: 'yellow',
        start_offset: 0, // TODO: Calculate actual offsets when needed
        end_offset: selectedText.length
      })

      // Clear selection after successful highlight
      window.getSelection()?.removeAllRanges()
      
      onHighlightSaved?.()
      
      // Show success feedback
      alert('Highlight created successfully!')
      
    } catch (error) {
      console.error('Error creating highlight:', error)
      alert('Failed to create highlight. Please try again.')
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

    try {
      setIsCreatingNote(true)
      
      await noteService.createNote({
        lesson_id: lessonId.toString(),
        content: noteContent.trim(),
        selected_text: selectedText
      })

      // Clear form and selection after successful save
      setNoteContent('')
      window.getSelection()?.removeAllRanges()
      
      onNoteSaved?.()
      
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

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <Button
              onClick={handleCreateHighlight}
              disabled={!hasSelectedText || isCreatingHighlight}
              className="w-full"
              variant="outline"
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
            >
              {isCreatingNote ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <StickyNote className="mr-2 h-4 w-4" />
              )}
              Save Note
            </Button>
          </div>

          {!hasSelectedText && (
            <div className="text-sm text-gray-500 text-center p-4 bg-gray-50 rounded">
              Select text from the lesson content to create notes or highlights
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