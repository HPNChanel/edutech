import React, { useState } from 'react'
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Card,
  CardContent
} from '@mui/material'
import Grid from '@mui/material/Grid'
import { 
  Person as PersonIcon,
  Save as SaveIcon 
} from '@mui/icons-material'
import { useUserStore } from '../store/useUserStore'

const ProfilePage: React.FC = () => {
  const { user, updateProfile, loading, error: storeError } = useUserStore()
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  if (!user) {
    return (
      <Container maxWidth="md">
        <Alert severity="error">User information not available</Alert>
      </Container>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    setError(null)
    setSuccess(null)
    
    try {
      // Only include fields that have changed
      const updates: { name?: string; email?: string } = {}
      
      if (name !== user.name) updates.name = name
      if (email !== user.email) updates.email = email
      
      if (Object.keys(updates).length === 0) {
        setSuccess('No changes to save')
        setUpdating(false)
        return
      }
      
      await updateProfile(updates)
      setSuccess('Profile updated successfully')
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Profile
      </Typography>
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'primary.main'
                }}
              >
                {user.name ? user.name[0].toUpperCase() : <PersonIcon fontSize="large" />}
              </Avatar>
              
              <Typography variant="h5">{user.name || 'User'}</Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                {user.email}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body2" color="textSecondary">
                  ID: {user.id}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Member since: {formatDate(user.created_at)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Status: Active
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom>
              Edit Profile
            </Typography>
            
            {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
            {(error || storeError) && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error || storeError}
              </Alert>
            )}
            
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    margin="normal"
                    required
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    margin="normal"
                    required
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={updating || loading}
                    sx={{ mt: 2 }}
                  >
                    {updating || loading ? <CircularProgress size={24} /> : 'Save Changes'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}

export default ProfilePage
