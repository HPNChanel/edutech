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
  Divider,
  Stack
} from '@mui/material'
import Grid from '@mui/material/Grid'
import { UploadFile, Article, Description, Category as CategoryIcon } from '@mui/icons-material'
import { lessonService } from '../services/lessonService'
import { categoryService } from '../services/categoryService'
import type { Category } from '../types/lesson'
import CategoryModal from '../components/CategoryModal'
import Layout from '../components/Layout'

const UploadPage: React.FC = () => {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<string>('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  
  // Category modal state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)

  // Fetch categories when component mounts
  useEffect(() => {
    fetchCategories();
  }, [])

  const fetchCategories = async () => {
    setLoadingCategories(true)
    try {
      const data = await categoryService.getAll()
      setCategories(data)
      
      // If there are categories available, set the first one as default
      if (data.length > 0) {
        setCategory(data[0].id.toString())
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    } finally {
      setLoadingCategories(false)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0]
      
      // Check file type
      const validTypes = ['.txt', '.md', '.docx', '.pdf', '.html']
      const fileExt = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase()
      
      if (!validTypes.includes(fileExt)) {
        setError(`Invalid file type. Supported formats: ${validTypes.join(', ')}`)
        return
      }
      
      // Check file size (5MB max)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size exceeds 5MB limit')
        return
      }
      
      setFile(selectedFile)
      setError('')
      
      // Auto-set title from filename if not set
      if (!title) {
        const fileName = selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.'))
        setTitle(fileName)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file) {
      setError('Please select a file to upload')
      return
    }
    
    if (!title.trim()) {
      setError('Please provide a title for the document')
      return
    }
    
    // Check if categories exist and one is selected
    if (categories.length > 0 && !category) {
      setError('Please select a category')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title)
      
      // Only append category_id if selected
      if (category) {
        formData.append('category_id', category)
      }
      
      if (description) {
        formData.append('description', description)
      }
      
      const result = await lessonService.uploadDocument(formData)
      
      setSuccess('Document uploaded successfully!')
      
      // Reset form
      setFile(null)
      setTitle('')
      setDescription('')
      
      // Redirect to the new lesson after 2 seconds
      if (result.lesson_id) {
        setTimeout(() => {
          navigate(`/lessons/${result.lesson_id}`)
        }, 2000)
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload document')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCategory = () => {
    setCategoryModalOpen(true)
  }

  return (
    <Layout>
      <Container maxWidth="md">
        <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Upload Document
          </Typography>
          
          <Typography variant="body1" color="textSecondary" paragraph>
            Upload documents in various formats to automatically convert them into lessons.
            Supported formats: .txt, .md, .docx, .pdf, .html
          </Typography>
          
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
          
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  sx={{ 
                    height: '120px', 
                    border: '2px dashed rgba(0, 0, 0, 0.23)',
                    borderRadius: 2
                  }}
                >
                  <Stack direction="column" spacing={1} alignItems="center">
                    <UploadFile fontSize="large" />
                    <Typography variant="body1">
                      {file ? file.name : 'Click to select or drop a file here'}
                    </Typography>
                    {file && (
                      <Typography variant="caption" color="textSecondary">
                        {(file.size / 1024).toFixed(2)} KB
                      </Typography>
                    )}
                  </Stack>
                  <input
                    type="file"
                    hidden
                    onChange={handleFileChange}
                    accept=".txt,.md,.docx,.pdf,.html"
                  />
                </Button>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }}>Document Information</Divider>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: <Article fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      label="Category"
                      disabled={loadingCategories}
                      startAdornment={<CategoryIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />}
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
                  <Button 
                    sx={{ ml: 1, whiteSpace: 'nowrap' }} 
                    onClick={handleCreateCategory}
                  >
                    New
                  </Button>
                </Box>
                {categories.length === 0 && !loadingCategories && (
                  <Typography variant="caption" color="primary" sx={{ mt: 0.5, display: 'block' }}>
                    You need to create a category first
                  </Typography>
                )}
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  InputProps={{
                    startAdornment: <Description fontSize="small" sx={{ mr: 1, mt: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={loading || !file || !title.trim() || (categories.length > 0 && !category)}
                  sx={{ mt: 2 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Upload Document'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
        
        <Paper elevation={1} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Document Processing
          </Typography>
          <Typography variant="body2" paragraph>
            After uploading, our AI will process your document to:
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="subtitle1" gutterBottom>
                  1. Format Content
                </Typography>
                <Typography variant="body2">
                  Convert to markdown with proper formatting
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="subtitle1" gutterBottom>
                  2. Generate Quiz
                </Typography>
                <Typography variant="body2">
                  Create questions based on content
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="subtitle1" gutterBottom>
                  3. Add Metadata
                </Typography>
                <Typography variant="body2">
                  Extract key concepts and topics
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Category Modal */}
        <CategoryModal
          open={categoryModalOpen}
          onClose={() => setCategoryModalOpen(false)}
          onSuccess={() => {
            fetchCategories();
            setCategoryModalOpen(false);
          }}
        />
      </Container>
    </Layout>
  )
}

export default UploadPage
