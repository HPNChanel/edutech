import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Paper,
  Divider,
  CircularProgress,
  Chip,
  Button,
  Alert,
  Tabs,
  Tab,
  IconButton,
  useTheme
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Bookmark as BookmarkIcon,
  Note as NoteIcon,
  Category as CategoryIcon
} from '@mui/icons-material'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Layout from '../components/Layout'
import { lessonService } from '../services/lessonService'
import { noteService } from '../services/noteService'
import { highlightService } from '../services/highlightService'
import HighlightModal from '../components/HighlightModal'
import HighlightItem from '../components/HighlightItem'
import { useSnackbar } from 'notistack'
import dayjs from 'dayjs'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`lesson-tabpanel-${index}`}
      aria-labelledby={`lesson-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

const LessonPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [lesson, setLesson] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tabValue, setTabValue] = useState(0)
  const [selection, setSelection] = useState({ start: 0, end: 0, text: '' })
  const [modalOpen, setModalOpen] = useState(false)
  const [highlights, setHighlights] = useState<any[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const contentRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbar()
  const theme = useTheme()

  useEffect(() => {
    if (id) {
      fetchLesson(parseInt(id))
      fetchHighlights(parseInt(id))
      fetchNotes(parseInt(id))
    }
  }, [id])

  const fetchLesson = async (lessonId: number) => {
    try {
      setLoading(true)
      const data = await lessonService.getById(lessonId)
      setLesson(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load lesson')
      console.error('Error fetching lesson:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchHighlights = async (lessonId: number) => {
    try {
      const data = await highlightService.getLessonHighlights(lessonId)
      setHighlights(data)
    } catch (err: any) {
      console.error('Error fetching highlights:', err)
    }
  }

  const fetchNotes = async (lessonId: number) => {
    try {
      const data = await noteService.getLessonNotes(lessonId)
      setNotes(data)
    } catch (err: any) {
      console.error('Error fetching notes:', err)
    }
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleMouseUp = () => {
    const selectionObj = window.getSelection()

    if (selectionObj && selectionObj.toString().trim() && contentRef.current) {
      const range = selectionObj.getRangeAt(0)

      // Calculate the position relative to content
      const containerText = contentRef.current.textContent || ''
      const preSelectionRange = range.cloneRange()
      preSelectionRange.selectNodeContents(contentRef.current)
      preSelectionRange.setEnd(range.startContainer, range.startOffset)
      const start = preSelectionRange.toString().length

      const selectedText = selectionObj.toString()
      const end = start + selectedText.length

      setSelection({
        start,
        end,
        text: selectedText
      })

      setModalOpen(true)
    }
  }

  const handleSaveHighlight = async (color: string, noteContent: string) => {
    if (!id) return

    try {
      const highlightData = {
        content: selection.text,
        lesson_id: parseInt(id),
        color,
        from_char: selection.start,
        to_char: selection.end,
        note_content: noteContent || undefined
      }

      await highlightService.createWithNote(highlightData)
      enqueueSnackbar('Highlight saved successfully', { variant: 'success' })

      // Refresh highlights and notes
      fetchHighlights(parseInt(id))
      fetchNotes(parseInt(id))

      // Clear selection
      window.getSelection()?.removeAllRanges()
    } catch (err: any) {
      enqueueSnackbar('Failed to save highlight', { variant: 'error' })
      console.error('Error saving highlight:', err)
    }
  }

  const handleDeleteHighlight = async (highlightId: number) => {
    try {
      await highlightService.delete(highlightId)
      enqueueSnackbar('Highlight deleted successfully', { variant: 'success' })

      // Refresh highlights
      if (id) {
        fetchHighlights(parseInt(id))
      }
    } catch (err: any) {
      enqueueSnackbar('Failed to delete highlight', { variant: 'error' })
      console.error('Error deleting highlight:', err)
    }
  }

  const handleDeleteNote = async (noteId: number) => {
    try {
      await noteService.delete(noteId)
      enqueueSnackbar('Note deleted successfully', { variant: 'success' })

      // Refresh notes
      if (id) {
        fetchNotes(parseInt(id))
      }
    } catch (err: any) {
      enqueueSnackbar('Failed to delete note', { variant: 'error' })
      console.error('Error deleting note:', err)
    }
  }

  const renderContent = () => {
    if (!lesson || !lesson.content) return ''

    let content = lesson.content

    // Sort highlights by their start position in descending order
    // This prevents position shifts when inserting components
    const sortedHighlights = [...highlights].sort((a, b) => b.from_char - a.from_char)

    // Process each highlight by replacing the text with a HighlightItem component
    sortedHighlights.forEach(highlight => {
      const before = content.substring(0, highlight.from_char)
      const after = content.substring(highlight.to_char)
      const highlightedText = content.substring(highlight.from_char, highlight.to_char)

      // Create a unique ID for this highlight to use as a React key
      const highlightElement =
        `<span class="highlight" 
               data-highlight-id="${highlight.id}" 
               data-highlight-color="${highlight.color}"
               style="background-color: ${getHighlightColor(highlight.color)}; cursor: pointer;"
         >${highlightedText}</span>`

      content = before + highlightElement + after
    })

    return content
  }

  const getHighlightColor = (color: string): string => {
    const colorMap: Record<string, string> = {
      yellow: 'rgba(255, 255, 0, 0.3)',
      green: 'rgba(0, 255, 0, 0.3)',
      blue: 'rgba(0, 191, 255, 0.3)',
      pink: 'rgba(255, 192, 203, 0.3)',
      orange: 'rgba(255, 165, 0, 0.3)'
    }

    return colorMap[color] || colorMap.yellow
  }

  const handleHighlightClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement
    if (target.classList.contains('highlight')) {
      const highlightId = parseInt(target.getAttribute('data-highlight-id') || '0')
      if (highlightId) {
        // Show a confirmation dialog or popover to delete the highlight
        if (window.confirm('Do you want to delete this highlight?')) {
          handleDeleteHighlight(highlightId)
        }
      }
    }
  }

  if (loading) {
    return (
      <Layout>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <CircularProgress />
          </Box>
        </Container>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <Container maxWidth="lg">
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
          <Box sx={{ mt: 2 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </Box>
        </Container>
      </Layout>
    )
  }

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ mb: 2, mt: 2, display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" component="h1" fontWeight="bold" sx={{ flexGrow: 1 }}>
            {lesson?.title}
          </Typography>
          {lesson?.category && (
            <Chip
              icon={<CategoryIcon />}
              label={lesson.category.name || 'Uncategorized'}
              color="primary"
              variant="outlined"
              sx={{ mr: 2 }}
            />
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="lesson tabs"
            variant="fullWidth"
          >
            <Tab label="Content" icon={<BookmarkIcon />} iconPosition="start" />
            <Tab
              label={`Notes (${notes.length})`}
              icon={<NoteIcon />}
              iconPosition="start"
              disabled={notes.length === 0}
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Paper elevation={1} sx={{ p: 3, minHeight: '50vh' }}>
            <div
              ref={contentRef}
              onMouseUp={handleMouseUp}
              onClick={handleHighlightClick}
              dangerouslySetInnerHTML={{ __html: renderContent() }}
              style={{ position: 'relative' }}
            />
          </Paper>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Paper elevation={1} sx={{ p: 3, minHeight: '50vh' }}>
            {notes.length > 0 ? (
              <Box>
                {notes.map(note => (
                  <Paper
                    key={note.id}
                    elevation={2}
                    sx={{
                      p: 2,
                      mb: 2,
                      borderLeft: '4px solid',
                      borderColor: theme.palette.primary.main
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {dayjs(note.created_at).format('MMM D, YYYY h:mm A')}
                      </Typography>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    {note.selected_text && (
                      <Box
                        sx={{
                          p: 1,
                          mb: 2,
                          bgcolor: 'background.default',
                          borderRadius: 1,
                          fontSize: '0.875rem',
                          fontStyle: 'italic'
                        }}
                      >
                        "{note.selected_text}"
                      </Box>
                    )}

                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {note.content}
                    </ReactMarkdown>
                  </Paper>
                ))}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <NoteIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No notes yet
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Highlight text in the content tab and add notes to see them here
                </Typography>
              </Box>
            )}
          </Paper>
        </TabPanel>

        <HighlightModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          selectedText={selection.text}
          lessonId={parseInt(id || '0')}
          fromChar={selection.start}
          toChar={selection.end}
          onSave={handleSaveHighlight}
        />
      </Container>
    </Layout>
  )
}

export default LessonPage
