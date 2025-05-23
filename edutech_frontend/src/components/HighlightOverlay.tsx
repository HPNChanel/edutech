import React from 'react'
import { Box, Button, Paper, Typography } from '@mui/material'
import { highlightService } from '../services/highlightService'

interface HighlightOverlayProps {
  selectedText: string
  lessonId: number
  anchorEl: HTMLElement | null
  onHighlightApplied: () => void
  onClose: () => void
}

const HighlightOverlay: React.FC<HighlightOverlayProps> = ({
  selectedText,
  lessonId,
  anchorEl,
  onHighlightApplied,
  onClose
}) => {
  if (!anchorEl) return null

  const rect = anchorEl.getBoundingClientRect()
  
  const handleHighlight = async (color: string) => {
    try {
      await highlightService.create({
        lesson_id: lessonId,
        content: selectedText,
        color,
        start_position: 0,
        end_position: selectedText.length
      })
      onHighlightApplied()
    } catch (error) {
      console.error('Failed to create highlight:', error)
    }
  }

  return (
    <Paper
      sx={{
        position: 'absolute',
        left: rect.left,
        top: rect.bottom + window.scrollY + 5,
        zIndex: 1300,
        p: 1,
        boxShadow: 3,
        borderRadius: 1,
        minWidth: '160px'
      }}
    >
      <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
        Highlight:
      </Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button 
          variant="contained" 
          size="small" 
          onClick={() => handleHighlight('#ffeb3b')}
          sx={{ 
            minWidth: '30px', 
            bgcolor: '#ffeb3b', 
            color: 'black',
            '&:hover': { bgcolor: '#ffd600' }
          }}
        />
        <Button 
          variant="contained" 
          size="small" 
          onClick={() => handleHighlight('#4caf50')}
          sx={{ 
            minWidth: '30px', 
            bgcolor: '#4caf50',
            '&:hover': { bgcolor: '#388e3c' }
          }}
        />
        <Button 
          variant="contained" 
          size="small" 
          onClick={() => handleHighlight('#f44336')}
          sx={{ 
            minWidth: '30px', 
            bgcolor: '#f44336',
            '&:hover': { bgcolor: '#d32f2f' }
          }}
        />
        <Button 
          variant="contained" 
          size="small" 
          onClick={() => handleHighlight('#90caf9')}
          sx={{ 
            minWidth: '30px', 
            bgcolor: '#90caf9',
            color: 'black',
            '&:hover': { bgcolor: '#42a5f5' }
          }}
        />
      </Box>
    </Paper>
  )
}

export default HighlightOverlay
