import React from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Container, 
  Typography, 
  Button, 
  Paper, 
  Box 
} from '@mui/material'
import { 
  SentimentDissatisfied as SadIcon,
  ArrowBack as ArrowBackIcon 
} from '@mui/icons-material'

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <Container maxWidth="md">
      <Paper 
        elevation={3} 
        sx={{ 
          p: 5, 
          mt: 5, 
          textAlign: 'center', 
          borderRadius: 2,
          backgroundColor: 'background.default' 
        }}
      >
        <Box sx={{ mb: 4 }}>
          <SadIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h3" gutterBottom>
            404
          </Typography>
          <Typography variant="h5" gutterBottom>
            Page Not Found
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            The page you are looking for doesn't exist or has been moved.
          </Typography>
        </Box>
        
        <Button 
          variant="contained" 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard')}
          size="large"
        >
          Back to Dashboard
        </Button>
      </Paper>
    </Container>
  )
}

export default NotFoundPage
