import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Chip
} from '@mui/material'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { noteService } from '../services/noteService'

interface NotePopupProps {
  open: boolean
  onClose: () => void
  selectedText: string
  lessonId: number
  onNoteSaved?: () => void
}

const NotePopup: React.FC<NotePopupProps> = ({
  open,
  onClose,
  selectedText,
  lessonId,
  onNoteSaved
}) => {
  const [noteText, setNoteText] = useState('')
  const [isPreview, setIsPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!noteText.trim()) return
    
    setIsSaving(true)
    try {
      await noteService.create({
        lesson_id: lessonId,
        content: noteText,
        selected_text: selectedText,
        position: 0 // This could be improved with actual positioning logic
      })
      
      if (onNoteSaved) {
        onNoteSaved()
      }
      handleClose()
    } catch (error) {
      console.error('Failed to save note:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    setNoteText('')
    setIsPreview(false)
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Add Note</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Selected Text:
          </Typography>
          <Typography 
            variant="body2" 
            component="div" 
            sx={{ 
              p: 1, 
              backgroundColor: 'rgba(255, 235, 59, 0.3)', 
              borderRadius: 1,
              maxHeight: '100px',
              overflow: 'auto'
            }}
          >
            {selectedText}
          </Typography>
        </Box>

        {isPreview ? (
          <Box sx={{ 
            border: '1px solid rgba(0, 0, 0, 0.12)', 
            borderRadius: 1, 
            p: 2,
            minHeight: '200px',
            maxHeight: '400px',
            overflow: 'auto',
            bgcolor: 'background.paper'
          }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {noteText}
            </ReactMarkdown>
          </Box>
        ) : (
          <TextField
            autoFocus
            multiline
            rows={8}
            variant="outlined"
            fullWidth
            placeholder="Write your note here... (Markdown supported)"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
          />
        )}

        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
          <Chip 
            label="**Bold**" 
            size="small" 
            onClick={() => setNoteText(text => `${text} **bold**`)} 
          />
          <Chip 
            label="*Italic*" 
            size="small" 
            onClick={() => setNoteText(text => `${text} *italic*`)} 
          />
          <Chip 
            label="# Heading" 
            size="small" 
            onClick={() => setNoteText(text => `${text}\n# Heading`)} 
          />
          <Chip 
            label="- List" 
            size="small" 
            onClick={() => setNoteText(text => `${text}\n- List item`)} 
          />
          <Chip 
            label="[Link](url)" 
            size="small" 
            onClick={() => setNoteText(text => `${text} [link](https://example.com)`)} 
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={() => setIsPreview(!isPreview)}
        >
          {isPreview ? 'Edit' : 'Preview'}
        </Button>
        <Button onClick={handleClose}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={!noteText.trim() || isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Note'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default NotePopup
