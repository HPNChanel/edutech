import React, { useState, useEffect } from 'react'
import { Box, useMediaQuery, useTheme, CircularProgress } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { useUserStore } from '../store/useUserStore'
import { authService } from '../services/authService'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { user, setUser, clearUser } = useUserStore()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (authService.isAuthenticated() && !user) {
          const currentUser = await authService.getCurrentUser()
          setUser(currentUser)
        }
        setLoading(false)
      } catch (error) {
        console.error('Authentication check failed:', error)
        authService.logout()
        clearUser()
        navigate('/login')
      }
    }

    checkAuth()
  }, [user, setUser, clearUser, navigate])

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Navbar handleDrawerToggle={handleDrawerToggle} />
      <Sidebar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          mt: 8,
          width: { sm: `calc(100% - 240px)` },
          ml: { sm: '240px' }
        }}
      >
        {children}
      </Box>
    </Box>
  )
}

export default Layout
