import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation, NavLink } from 'react-router-dom'
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  School as SchoolIcon,
  Create as CreateIcon,
  Upload as UploadIcon,
  Book as BookIcon,
  Quiz as QuizIcon,
  Category as CategoryIcon,
  ExpandLess,
  ExpandMore,
  Article as ArticleIcon,
  Folder as FolderIcon
} from '@mui/icons-material'
import { lessonService } from '../services/lessonService'
import type { Lesson } from '../types/lesson'

// Define props interface for the component
interface SidebarProps {
  mobileOpen?: boolean;
  handleDrawerToggle?: () => void;
}

// Sidebar width
const drawerWidth = 240

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, handleDrawerToggle }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [lessonsOpen, setLessonsOpen] = useState(true)
  const [loading, setLoading] = useState(true)

  // Fetch lessons on component mount
  useEffect(() => {
    const fetchLessons = async () => {
      try {
        setLoading(true)
        const data = await lessonService.getAll()
        setLessons(data)
      } catch (error) {
        console.error('Failed to fetch lessons:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLessons()
  }, [])

  // Group lessons by category
  const lessonsByCategory = lessons.reduce((acc, lesson) => {
    const categoryId = lesson.category_id || 0
    const categoryName = lesson.category?.name || 'Uncategorized'
    
    if (!acc[categoryId]) {
      acc[categoryId] = {
        name: categoryName,
        lessons: []
      }
    }
    
    acc[categoryId].lessons.push(lesson)
    return acc
  }, {} as Record<number, { name: string; lessons: Lesson[] }>)

  const handleToggleLessonsOpen = () => {
    setLessonsOpen(!lessonsOpen)
  }

  const handleNavigation = (path: string) => {
    navigate(path)
    if (isMobile && handleDrawerToggle) {
      handleDrawerToggle()
    }
  }

  const isActive = (path: string) => {
    return location.pathname === path
  }

  const drawer = (
    <div>
      <Box sx={{ p: 2, display: { xs: 'none', sm: 'block' } }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          EduTech
        </Typography>
      </Box>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton 
            component={NavLink}
            to="/dashboard"
            selected={isActive('/dashboard') || isActive('/')}
            sx={{
              '&.active': {
                backgroundColor: theme.palette.action.selected,
              }
            }}
            onClick={() => isMobile && handleDrawerToggle && handleDrawerToggle()}
          >
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton 
            component={NavLink}
            to="/categories"
            sx={{
              '&.active': {
                backgroundColor: theme.palette.action.selected,
              }
            }}
            onClick={() => isMobile && handleDrawerToggle && handleDrawerToggle()}
          >
            <ListItemIcon>
              <FolderIcon />
            </ListItemIcon>
            <ListItemText primary="Categories" />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton 
            onClick={handleToggleLessonsOpen}
          >
            <ListItemIcon>
              <SchoolIcon />
            </ListItemIcon>
            <ListItemText primary="My Lessons" />
            {lessonsOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        
        <Collapse in={lessonsOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {Object.entries(lessonsByCategory).map(([categoryId, category]) => (
              <Box key={categoryId}>
                <ListItem sx={{ pl: 4 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CategoryIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={category.name} 
                    primaryTypographyProps={{ 
                      fontWeight: 'medium',
                      variant: 'body2',
                      color: 'text.secondary'
                    }}
                  />
                </ListItem>
                
                {category.lessons.map(lesson => (
                  <ListItemButton 
                    key={lesson.id}
                    component={NavLink}
                    to={`/lessons/${lesson.id}`}
                    sx={{ 
                      pl: 6,
                      '&.active': {
                        backgroundColor: theme.palette.action.selected,
                      }
                    }}
                    onClick={() => isMobile && handleDrawerToggle && handleDrawerToggle()}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <ArticleIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={lesson.title} 
                      primaryTypographyProps={{ 
                        noWrap: true,
                        style: { textOverflow: 'ellipsis' },
                        variant: 'body2'
                      }} 
                    />
                  </ListItemButton>
                ))}
              </Box>
            ))}
          </List>
        </Collapse>
        
        <ListItem disablePadding>
          <ListItemButton 
            component={NavLink}
            to="/create-lesson"
            sx={{
              '&.active': {
                backgroundColor: theme.palette.action.selected,
              }
            }}
            onClick={() => isMobile && handleDrawerToggle && handleDrawerToggle()}
          >
            <ListItemIcon>
              <CreateIcon />
            </ListItemIcon>
            <ListItemText primary="Create Lesson" />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton 
            component={NavLink}
            to="/upload"
            sx={{
              '&.active': {
                backgroundColor: theme.palette.action.selected,
              }
            }}
            onClick={() => isMobile && handleDrawerToggle && handleDrawerToggle()}
          >
            <ListItemIcon>
              <UploadIcon />
            </ListItemIcon>
            <ListItemText primary="Upload Document" />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton 
            component={NavLink}
            to="/notes"
            sx={{
              '&.active': {
                backgroundColor: theme.palette.action.selected,
              }
            }}
            onClick={() => isMobile && handleDrawerToggle && handleDrawerToggle()}
          >
            <ListItemIcon>
              <BookIcon />
            </ListItemIcon>
            <ListItemText primary="My Notes" />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton
            component={NavLink}
            to="/quizzes"
            sx={{
              '&.active': {
                backgroundColor: theme.palette.action.selected,
              }
            }}
            onClick={() => isMobile && handleDrawerToggle && handleDrawerToggle()}
          >
            <ListItemIcon>
              <QuizIcon />
            </ListItemIcon>
            <ListItemText primary="Quizzes" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  )

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            borderRight: '1px solid rgba(0, 0, 0, 0.12)'
          },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            borderRight: '1px solid rgba(0, 0, 0, 0.12)',
            mt: '64px', // AppBar height
            height: 'calc(100% - 64px)'
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  )
}

export default Sidebar
