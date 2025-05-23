import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material'
import Grid from '@mui/material/Grid'
import { lessonService } from '../services/lessonService'
import { categoryService } from '../services/categoryService'
import Layout from '../components/Layout'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Category } from '../types/lesson'

const CreateLessonPage: React.FC = () => {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [description, setDescription] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)

  // Fetch categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true)
      try {
        const data = await categoryService.getAll()
        setCategories(data)
        
        // If there are categories available, set the first one as default
        if (data.length > 0) {
          setCategoryId(data[0].id.toString())
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err)
      } finally {
        setLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const newLesson = await lessonService.create({
        title,
        content,
        description,
        category_id: categoryId ? parseInt(categoryId) : undefined
      })
      
      // Redirect to the new lesson
      navigate(`/lessons/${newLesson.id}`)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create lesson')
      setLoading(false)
    }
  }

  return (
    <Layout>
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" gutterBottom>
          Create New Lesson
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={showPreview ? 6 : 12}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  margin="normal"
                />
                
                <FormControl fullWidth margin="normal">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    label="Category"
                    disabled={loadingCategories}
                  >
                    {loadingCategories ? (
                      <MenuItem value="">Loading categories...</MenuItem>
                    ) : categories.length > 0 ? (
                      categories.map((cat) => (
                        <MenuItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem value="">No categories available</MenuItem>
                    )}
                  </Select>
                </FormControl>
                
                <TextField
                  fullWidth
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  margin="normal"
                  multiline
                  rows={2}
                />
                
                <TextField
                  fullWidth
                  label="Content (Markdown supported)"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  margin="normal"
                  multiline
                  rows={12}
                  placeholder="# Heading\n\nThis is a paragraph with **bold** and *italic* text.\n\n- List item 1\n- List item 2"
                />
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    variant="outlined"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                  </Button>
                  
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading || !title.trim() || !content.trim()}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Create Lesson'}
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Grid>
          
          {showPreview && (
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3, height: '100%', overflow: 'auto' }}>
                <Typography variant="h6" gutterBottom>
                  Preview
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{
                  '& h1, & h2, & h3, & h4, & h5, & h6': {
                    mt: 2,
                    mb: 1,
                  },
                  '& p': {
                    mb: 1.5,
                  },
                  '& ul, & ol': {
                    mb: 1.5,
                  },
                }}>
                  <Typography variant="h5">{title}</Typography>
                  {description && (
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {description}
                    </Typography>
                  )}
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content}
                  </ReactMarkdown>
                </Box>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Container>
    </Layout>
  )
}

export default CreateLessonPage
