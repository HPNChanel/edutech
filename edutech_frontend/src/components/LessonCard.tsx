import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Divider
} from '@mui/material'
import {
  MoreVert as MoreVertIcon,
  QuizOutlined as QuizIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material'
import type { Lesson } from '../types/lesson'
import { lessonService } from '../services/lessonService'

interface LessonCardProps {
  lesson: Lesson
  onDelete?: (id: number) => void
}

const LessonCard: React.FC<LessonCardProps> = ({ lesson, onDelete }) => {
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
    event.stopPropagation()
  }

  const handleMenuClose = (event?: React.MouseEvent<HTMLElement>) => {
    if (event) {
      event.stopPropagation()
    }
    setAnchorEl(null)
  }

  const handleEdit = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    handleMenuClose()
    navigate(`/edit-lesson/${lesson.id}`)
  }

  const handleDelete = async (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    handleMenuClose()
    
    try {
      await lessonService.delete(lesson.id)
      if (onDelete) {
        onDelete(lesson.id)
      }
    } catch (error) {
      console.error('Failed to delete lesson:', error)
    }
  }

  // Format the date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Truncate description for preview
  const truncateDescription = (text?: string, maxLength = 100) => {
    if (!text) return ''
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text
  }

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        }
      }}
      onClick={() => navigate(`/lessons/${lesson.id}`)}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" component="h2" gutterBottom noWrap sx={{ maxWidth: '80%' }}>
            {lesson.title}
          </Typography>
          <IconButton size="small" onClick={handleMenuOpen}>
            <MoreVertIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            onClick={(e) => e.stopPropagation()}
          >
            <MenuItem onClick={handleEdit}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              Edit
            </MenuItem>
            <MenuItem onClick={handleDelete}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Delete
            </MenuItem>
          </Menu>
        </Box>
        
        <Chip 
          label={lesson.category?.name || 'Uncategorized'} 
          size="small" 
          color="primary" 
          variant="outlined" 
          sx={{ mb: 2 }} 
        />
        
        <Typography 
          variant="body2" 
          color="text.secondary" 
          paragraph
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            minHeight: '2.5em'
          }}
        >
          {truncateDescription(lesson.description)}
        </Typography>
        
        <Typography variant="caption" color="text.secondary">
          Created: {formatDate(lesson.created_at)}
        </Typography>
      </CardContent>
      
      <Divider />
      
      <CardActions>
        <Button 
          size="small" 
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/lessons/${lesson.id}`)
          }}
        >
          Read
        </Button>
        
        <Button 
          size="small" 
          startIcon={<QuizIcon />}
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/quiz/${lesson.id}`)
          }}
        >
          Quiz
        </Button>
      </CardActions>
    </Card>
  )
}

export default LessonCard
