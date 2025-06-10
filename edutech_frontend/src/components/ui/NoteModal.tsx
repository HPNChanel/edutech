import React, { useState, useEffect } from 'react'
import { X, Bold, Italic, Underline, Save } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Badge } from './badge'

interface NoteModalProps {
  selectedText: string
  onSave: (content: string) => void
  onClose: () => void
  visible: boolean
}

export const NoteModal: React.FC<NoteModalProps> = ({
  selectedText,
  onSave,
  onClose,
  visible
}) => {
  const [noteContent, setNoteContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (visible) {
      setNoteContent('')
    }
  }, [visible])

  const handleSave = async () => {
    if (!noteContent.trim()) return
    
    setIsSaving(true)
    try {
      await onSave(noteContent.trim())
      setNoteContent('')
      onClose()
    } catch (error) {
      console.error('Failed to save note:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave()
    }
  }

  const applyFormatting = (format: string) => {
    const textarea = document.getElementById('note-textarea') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = noteContent.substring(start, end)
    
    let formattedText = ''
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`
        break
      case 'italic':
        formattedText = `*${selectedText}*`
        break
      case 'underline':
        formattedText = `<u>${selectedText}</u>`
        break
      default:
        formattedText = selectedText
    }

    const newContent = 
      noteContent.substring(0, start) + 
      formattedText + 
      noteContent.substring(end)
    
    setNoteContent(newContent)
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + formattedText.length, 
        start + formattedText.length
      )
    }, 0)
  }

  if (!visible) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card 
        className="w-full max-w-md mx-4"
        style={{
          maxHeight: '80vh'
        }}
      >
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Add Note</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {selectedText && (
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                Selected text: "{selectedText.substring(0, 50)}{selectedText.length > 50 ? '...' : ''}"
              </Badge>
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          {/* Formatting Toolbar */}
          <div className="flex gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyFormatting('bold')}
              title="Bold (Ctrl+B)"
              className="p-2"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyFormatting('italic')}
              title="Italic (Ctrl+I)"
              className="p-2"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyFormatting('underline')}
              title="Underline (Ctrl+U)"
              className="p-2"
            >
              <Underline className="h-4 w-4" />
            </Button>
          </div>

          {/* Note Content */}
          <textarea
            id="note-textarea"
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write your note here... (Ctrl+Enter to save)"
            className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={2000}
            autoFocus
          />
          
          {/* Character count */}
          <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
            <span>{noteContent.length}/2000 characters</span>
            <span>Ctrl+Enter to save, Esc to cancel</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleSave}
              disabled={!noteContent.trim() || isSaving}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Note'}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 