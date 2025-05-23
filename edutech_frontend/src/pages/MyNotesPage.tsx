import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import Grid from '@mui/material/Grid';
import type { SelectChangeEvent } from '@mui/material';
import {
  Delete as DeleteIcon,
  OpenInNew as OpenInNewIcon,
  Book as BookIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { noteService } from '../services/noteService';
import { lessonService } from '../services/lessonService';
import type { Note, Lesson } from '../types/lesson';
import Layout from '../components/Layout';
import ConfirmDialog from '../components/ConfirmDialog';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const MyNotesPage: React.FC = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Fetch lessons on component mount
  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const data = await lessonService.getAll();
        setLessons(data);
      } catch (error) {
        console.error('Failed to fetch lessons:', error);
        setError('Failed to load lessons');
      }
    };

    fetchLessons();
  }, []);

  // Fetch notes when selected lesson changes
  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true);
      setError('');
      
      try {
        let fetchedNotes: Note[];
        
        if (selectedLessonId === 'all') {
          // Fetch all notes (might need a backend endpoint for this)
          fetchedNotes = await noteService.getAll();
        } else {
          // Fetch notes for specific lesson
          fetchedNotes = await noteService.getByLessonId(parseInt(selectedLessonId));
        }
        
        setNotes(fetchedNotes);
      } catch (error) {
        console.error('Failed to fetch notes:', error);
        setError('Failed to load notes');
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [selectedLessonId]);

  const handleLessonChange = (event: SelectChangeEvent) => {
    setSelectedLessonId(event.target.value);
  };

  const handleDeleteNote = (note: Note) => {
    setNoteToDelete(note);
    setConfirmDialogOpen(true);
  };

  const confirmDeleteNote = async () => {
    if (!noteToDelete) return;
    
    try {
      await noteService.delete(noteToDelete.id);
      
      // Update notes list
      setNotes(notes.filter(note => note.id !== noteToDelete.id));
    } catch (error) {
      console.error('Failed to delete note:', error);
      setError('Failed to delete note');
    } finally {
      setConfirmDialogOpen(false);
      setNoteToDelete(null);
    }
  };

  // Find lesson title by ID
  const getLessonTitle = (lessonId: number): string => {
    const lesson = lessons.find(l => l.id === lessonId);
    return lesson ? lesson.title : 'Unknown Lesson';
  };

  // Group notes by lesson
  const notesByLesson = notes.reduce((acc, note) => {
    if (!acc[note.lesson_id]) {
      acc[note.lesson_id] = [];
    }
    acc[note.lesson_id].push(note);
    return acc;
  }, {} as Record<number, Note[]>);

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            My Notes
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="lesson-select-label">Filter by Lesson</InputLabel>
                <Select
                  labelId="lesson-select-label"
                  value={selectedLessonId}
                  label="Filter by Lesson"
                  onChange={handleLessonChange}
                >
                  <MenuItem value="all">All Lessons</MenuItem>
                  {lessons.map((lesson) => (
                    <MenuItem key={lesson.id} value={lesson.id.toString()}>
                      {lesson.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : notes.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <AssignmentIcon fontSize="large" color="disabled" sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No notes found
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {selectedLessonId === 'all' 
                ? "You haven't created any notes yet." 
                : "You haven't created any notes for this lesson yet."}
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => navigate('/dashboard')}
            >
              Browse Lessons
            </Button>
          </Paper>
        ) : selectedLessonId !== 'all' ? (
          // Display notes for selected lesson
          <Grid container spacing={3}>
            {notes.map((note) => (
              <Grid item xs={12} md={6} key={note.id}>
                <NoteCard 
                  note={note} 
                  lessonTitle={getLessonTitle(note.lesson_id)}
                  onDelete={() => handleDeleteNote(note)}
                  onViewLesson={() => navigate(`/lessons/${note.lesson_id}`)}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          // Display notes grouped by lesson
          Object.entries(notesByLesson).map(([lessonId, lessonNotes]) => (
            <Box key={lessonId} sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BookIcon sx={{ mr: 1 }} />
                <Typography variant="h6">
                  {getLessonTitle(parseInt(lessonId))}
                </Typography>
                <Button 
                  size="small" 
                  sx={{ ml: 2 }}
                  startIcon={<OpenInNewIcon />}
                  onClick={() => navigate(`/lessons/${lessonId}`)}
                >
                  View Lesson
                </Button>
              </Box>
              
              <Grid container spacing={3}>
                {lessonNotes.map((note) => (
                  <Grid item xs={12} md={6} key={note.id}>
                    <NoteCard 
                      note={note} 
                      lessonTitle={getLessonTitle(note.lesson_id)}
                      onDelete={() => handleDeleteNote(note)}
                      onViewLesson={() => navigate(`/lessons/${note.lesson_id}`)}
                      hideLesson
                    />
                  </Grid>
                ))}
              </Grid>
              
              <Divider sx={{ my: 3 }} />
            </Box>
          ))
        )}
        
        <ConfirmDialog
          open={confirmDialogOpen}
          title="Delete Note"
          content="Are you sure you want to delete this note? This action cannot be undone."
          onConfirm={confirmDeleteNote}
          onCancel={() => setConfirmDialogOpen(false)}
        />
      </Container>
    </Layout>
  );
};

interface NoteCardProps {
  note: Note;
  lessonTitle: string;
  onDelete: () => void;
  onViewLesson: () => void;
  hideLesson?: boolean;
}

const NoteCard: React.FC<NoteCardProps> = ({ 
  note, 
  lessonTitle, 
  onDelete, 
  onViewLesson,
  hideLesson = false
}) => {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        {!hideLesson && (
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {lessonTitle}
          </Typography>
        )}
        
        <Box sx={{ 
          backgroundColor: 'rgba(255, 235, 59, 0.15)', 
          p: 1, 
          borderRadius: 1, 
          mb: 2,
          fontSize: '0.875rem'
        }}>
          <Typography variant="body2" noWrap>
            Selected text: {note.selected_text || "..."}
          </Typography>
        </Box>
        
        <Box sx={{ 
            mt: 2, 
            maxHeight: '200px', 
            overflow: 'auto',
            '& h1, & h2, & h3, & h4, & h5, & h6': {
              fontSize: '1rem',
              fontWeight: 'bold',
              my: 1
            }
          }}>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({node, ...props}) => (
                  <Typography 
                    variant="body2" 
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical'
                    }}
                    {...props}
                  />
                )
              }}
            >
              {note.content}
            </ReactMarkdown>
          </Box>
      </CardContent>
      
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        px: 2,
        py: 1,
        borderTop: '1px solid',
        borderTopColor: 'divider'
      }}>
        <Typography variant="caption" color="text.secondary">
          {dayjs(note.created_at).fromNow()}
        </Typography>
        
        <CardActions disableSpacing sx={{ p: 0 }}>
          <IconButton size="small" onClick={onViewLesson}>
            <OpenInNewIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={onDelete}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </CardActions>
      </Box>
    </Card>
  );
};

export default MyNotesPage;
