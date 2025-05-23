import React, { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Box, Typography, Paper } from '@mui/material'
import { noteService } from '../services/noteService'
import { highlightService } from '../services/highlightService'
import type { Highlight } from '../types/highlight'
import type { Note } from '../types/lesson'
import NotePopup from './NotePopup'
import HighlightOverlay from './HighlightOverlay'

interface MarkdownViewerProps {
  content: string
  lessonId: number
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content, lessonId }) => {
  const [selectedText, setSelectedText] = useState('')
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [noteOpen, setNoteOpen] = useState(false)
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch existing highlights and notes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [highlightsData, notesData] = await Promise.all([
          highlightService.getByLessonId(lessonId),
          noteService.getByLessonId(lessonId)
        ])
        setHighlights(highlightsData)
        setNotes(notesData)
      } catch (error) {
        console.error('Failed to fetch highlights or notes:', error)
      }
    }

    fetchData()
  }, [lessonId])

  const handleTextSelection = () => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      const selectedText = selection.toString()
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      
      // Create a temporary element to position overlay
      const tempEl = document.createElement('span')
      tempEl.style.position = 'absolute'
      tempEl.style.left = `${rect.left}px`
      tempEl.style.top = `${rect.bottom}px`
      document.body.appendChild(tempEl)
      
      setSelectedText(selectedText)
      setAnchorEl(tempEl)
    }
  }

  const handleCloseHighlightOverlay = () => {
    if (anchorEl) {
      document.body.removeChild(anchorEl)
    }
    setAnchorEl(null)
    setSelectedText('')
    window.getSelection()?.removeAllRanges()
  }

  const handleHighlightApplied = async () => {
    handleCloseHighlightOverlay()
    // Refresh highlights
    try {
      const updatedHighlights = await highlightService.getByLessonId(lessonId)
      setHighlights(updatedHighlights)
    } catch (error) {
      console.error('Failed to refresh highlights:', error)
    }
  }

  const handleOpenNotePopup = () => {
    setNoteOpen(true)
  }

  const handleCloseNotePopup = () => {
    setNoteOpen(false)
  }

  const handleNoteSaved = async () => {
    // Refresh notes
    try {
      const updatedNotes = await noteService.getByLessonId(lessonId)
      setNotes(updatedNotes)
    } catch (error) {
      console.error('Failed to refresh notes:', error)
    }
  }

  // Apply highlights to the rendered markdown
  const processedContent = content // In a real app, you would implement highlight rendering

  return (
    <Box>
      <Box
        ref={containerRef}
        onMouseUp={handleTextSelection}
        sx={{
          position: 'relative',
          '& h1, & h2, & h3, & h4, & h5, & h6': {
            mt: 3,
            mb: 2,
          },
          '& p': {
            mb: 2,
            lineHeight: 1.7,
          },
          '& pre': {
            backgroundColor: '#f5f5f5',
            p: 2,
            borderRadius: 1,
            overflow: 'auto',
          },
          '& code': {
            backgroundColor: '#f5f5f5',
            px: 0.5,
            borderRadius: 0.5,
          },
          '& blockquote': {
            borderLeft: '4px solid #ccc',
            ml: 0,
            pl: 2,
            fontStyle: 'italic',
          },
          '& a': {
            color: 'primary.main',
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline',
            },
          },
          '& img': {
            maxWidth: '100%',
            height: 'auto',
          },
          '& ul, & ol': {
            mb: 2,
          },
          '& li': {
            mb: 0.5,
          },
          '& table': {
            borderCollapse: 'collapse',
            width: '100%',
            mb: 2,
          },
          '& th, & td': {
            border: '1px solid #ddd',
            p: 1,
          },
          '& th': {
            backgroundColor: '#f5f5f5',
            fontWeight: 'bold',
            textAlign: 'left',
          },
        }}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {processedContent}
        </ReactMarkdown>
      </Box>

      {/* Highlight overlay */}
      {selectedText && anchorEl && (
        <HighlightOverlay
          selectedText={selectedText}
          lessonId={lessonId}
          anchorEl={anchorEl}
          onHighlightApplied={handleHighlightApplied}
          onClose={handleCloseHighlightOverlay}
        />
      )}

      {/* Note popup */}
      <NotePopup
        open={noteOpen}
        onClose={handleCloseNotePopup}
        selectedText={selectedText}
        lessonId={lessonId}
        onNoteSaved={handleNoteSaved}
      />

      {/* Notes display (simplified) */}
      {notes.length > 0 && (
        <Paper elevation={1} sx={{ mt: 4, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Your Notes
          </Typography>
          {notes.map((note) => (
            <Box key={note.id} sx={{ mb: 2, p: 1, borderLeft: '3px solid primary.main' }}>
              <Typography 
                variant="caption" 
                color="textSecondary" 
                component="div"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical'
                }}
              >
                Related to: "{note.selected_text.substring(0, 40)}..."
              </Typography>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {note.content}
              </ReactMarkdown>
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  )
}

export default MarkdownViewer
