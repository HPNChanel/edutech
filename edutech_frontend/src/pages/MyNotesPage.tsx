import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { noteService, Note, UpdateNoteData } from '@/services/noteService'
import { 
  Search, 
  Calendar, 
  BookOpen, 
  Edit3, 
  Trash2, 
  FileText,
  StickyNote,
  RefreshCw,
  AlertTriangle,
  FileX,
  ExternalLink
} from 'lucide-react'

interface NotesPageState {
  notes: Note[]
  filteredNotes: Note[]
  isLoading: boolean
  error: string | null
  searchQuery: string
  editingNote: Note | null
  isEditDialogOpen: boolean
  isUpdating: boolean
}

export default function MyNotesPage() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [state, setState] = useState<NotesPageState>({
    notes: [],
    filteredNotes: [],
    isLoading: true,
    error: null,
    searchQuery: '',
    editingNote: null,
    isEditDialogOpen: false,
    isUpdating: false
  })

  const [editForm, setEditForm] = useState({
    content: ''
  })

  const fetchNotes = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      // Use the corrected service method that returns Note[] directly
      const notesData = await noteService.getAllNotes()
      
      setState(prev => ({
        ...prev,
        notes: notesData || [], // Ensure we always have an array
        filteredNotes: notesData || [],
        isLoading: false
      }))

    } catch (error: any) {
      console.error('Notes fetch error:', error)
      
      // More specific error handling
      let errorMessage = 'Failed to load notes'
      
      if (error.message.includes('Authentication required')) {
        errorMessage = 'Please log in to view your notes'
      } else if (error.message.includes('Network Error') || error.code === 'ERR_NETWORK') {
        errorMessage = 'Unable to connect to server. Please check your internet connection.'
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
        // Set empty arrays on error to prevent UI issues
        notes: [],
        filteredNotes: []
      }))
    }
  }

  useEffect(() => {
    fetchNotes()
  }, [])

  // Filter notes based on search query
  useEffect(() => {
    const filtered = state.notes.filter(note =>
      note.content.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      note.selectedText?.toLowerCase().includes(state.searchQuery.toLowerCase())
    )
    
    setState(prev => ({ ...prev, filteredNotes: filtered }))
  }, [state.searchQuery, state.notes])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, searchQuery: e.target.value }))
  }

  const handleEditNote = (note: Note) => {
    setState(prev => ({ 
      ...prev, 
      editingNote: note, 
      isEditDialogOpen: true 
    }))
    setEditForm({ content: note.content })
  }

  const handleUpdateNote = async () => {
    if (!state.editingNote) return

    try {
      setState(prev => ({ ...prev, isUpdating: true }))

      const updateData: UpdateNoteData = {
        content: editForm.content.trim()
      }

      if (!updateData.content) {
        toast({
          title: "Error",
          description: "Note content cannot be empty",
          variant: "destructive"
        })
        return
      }

      const updatedNote = await noteService.updateNote(state.editingNote.id, updateData)

      setState(prev => ({
        ...prev,
        notes: prev.notes.map(note => 
          note.id === updatedNote.id ? updatedNote : note
        ),
        isEditDialogOpen: false,
        editingNote: null,
        isUpdating: false
      }))

      setEditForm({ content: '' })

      toast({
        title: "Success",
        description: "Note updated successfully"
      })

    } catch (error: any) {
      console.error('Update note error:', error)
      
      setState(prev => ({ ...prev, isUpdating: false }))
      
      toast({
        title: "Error",
        description: error.message || "Failed to update note",
        variant: "destructive"
      })
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      return
    }

    try {
      await noteService.deleteNote(noteId)

      setState(prev => ({
        ...prev,
        notes: prev.notes.filter(note => note.id !== noteId)
      }))

      toast({
        title: "Success",
        description: "Note deleted successfully"
      })

    } catch (error: any) {
      console.error('Delete note error:', error)
      
      toast({
        title: "Error",
        description: error.message || "Failed to delete note",
        variant: "destructive"
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPosition = (fromChar?: number, toChar?: number) => {
    if (fromChar !== undefined && toChar !== undefined) {
      return `Characters ${fromChar}-${toChar}`
    }
    if (fromChar !== undefined) {
      return `Position ${fromChar}`
    }
    return null
  }

  if (state.isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Search Skeleton */}
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
        </div>

        {/* Notes Skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{state.error}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchNotes}
              className="ml-4"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <StickyNote className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-gray-900">My Notes</h1>
        </div>
        <p className="text-muted-foreground">
          All your notes from lessons in one place. Search, edit, and organize your learning insights.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes by content or selected text..."
            value={state.searchQuery}
            onChange={handleSearchChange}
            className="pl-10"
            disabled={state.isLoading}
          />
        </div>
        <Button 
          variant="outline" 
          onClick={fetchNotes}
          className="shrink-0"
          disabled={state.isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${state.isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Notes List */}
      {state.filteredNotes.length === 0 && !state.isLoading && !state.error ? (
        <div className="text-center py-12">
          {state.searchQuery ? (
            <>
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No notes found</h3>
              <p className="text-muted-foreground mb-4">
                No notes match your search criteria. Try adjusting your search terms.
              </p>
              <Button 
                variant="outline"
                onClick={() => setState(prev => ({ ...prev, searchQuery: '' }))}
              >
                Clear Search
              </Button>
            </>
          ) : (
            <>
              <FileX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No notes yet</h3>
              <p className="text-muted-foreground mb-4">
                Start taking notes while reading lessons to see them here.
              </p>
              <Button onClick={() => navigate('/lessons')}>
                <BookOpen className="h-4 w-4 mr-2" />
                Browse Lessons
              </Button>
            </>
          )}
        </div>
      ) : state.filteredNotes.length > 0 ? (
        <div className="space-y-4">
          {/* Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {state.filteredNotes.length} note{state.filteredNotes.length !== 1 ? 's' : ''} found
              {state.searchQuery && ` for "${state.searchQuery}"`}
            </p>
          </div>

          {/* Notes Cards */}
          {state.filteredNotes.map((note) => (
            <Card key={note.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Selected Text */}
                    {note.selectedText && (
                      <div className="mb-3 p-3 bg-muted/50 rounded-lg border-l-4 border-primary">
                        <p className="text-sm italic text-muted-foreground mb-1">Selected text:</p>
                        <p className="text-sm">{note.selectedText}</p>
                      </div>
                    )}
                    
                    {/* Note Content */}
                    <div className="space-y-2">
                      <CardTitle className="text-base">Your Note</CardTitle>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {note.content}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/lessons/${note.lessonId}`)}
                      title="Go to Lesson"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditNote(note)}
                      title="Edit Note"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-destructive hover:text-destructive"
                      title="Delete Note"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDate(note.createdAt)}
                  </Badge>
                  
                  {formatPosition(note.position, note.position) && (
                    <Badge variant="outline" className="text-xs">
                      <FileText className="h-3 w-3 mr-1" />
                      {formatPosition(note.position, note.position)}
                    </Badge>
                  )}
                  
                  {note.lineNumber && (
                    <Badge variant="outline" className="text-xs">
                      Line {note.lineNumber}
                    </Badge>
                  )}
                  
                  {note.updatedAt !== note.createdAt && (
                    <Badge variant="outline" className="text-xs">
                      Updated {formatDate(note.updatedAt)}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {/* Edit Note Dialog */}
      <Dialog open={state.isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setState(prev => ({ 
            ...prev, 
            isEditDialogOpen: false, 
            editingNote: null 
          }))
          setEditForm({ content: '' })
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Selected Text Display */}
            {state.editingNote?.selectedText && (
              <div className="p-3 bg-muted/50 rounded-lg border-l-4 border-primary">
                <Label className="text-sm font-medium text-muted-foreground">
                  Selected text:
                </Label>
                <p className="text-sm mt-1">{state.editingNote.selectedText}</p>
              </div>
            )}

            {/* Note Content Editor */}
            <div className="space-y-2">
              <Label htmlFor="note-content">Your Note</Label>
              <Textarea
                id="note-content"
                placeholder="Enter your note..."
                value={editForm.content}
                onChange={(e) => setEditForm({ content: e.target.value })}
                rows={6}
                className="resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setState(prev => ({ ...prev, isEditDialogOpen: false }))
                }
                disabled={state.isUpdating}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateNote}
                disabled={state.isUpdating || !editForm.content.trim()}
              >
                {state.isUpdating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Note'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
