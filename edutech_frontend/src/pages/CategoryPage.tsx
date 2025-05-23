import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Fab,
  Chip,
  Alert,
  CircularProgress,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Folder as FolderIcon,
  Article as ArticleIcon
} from '@mui/icons-material';
import { categoryService } from '../services/categoryService';
import { lessonService } from '../services/lessonService';
import type { Category } from '../types/lesson';
import Layout from '../components/Layout';
import CategoryModal from '../components/CategoryModal';
import ConfirmDialog from '../components/ConfirmDialog';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const CategoryPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | undefined>(undefined);
  
  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  
  // Menu state for category actions
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  // Lesson counts for each category
  const [lessonCounts, setLessonCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    
    try {
      const data = await categoryService.getAll();
      setCategories(data);
      
      // Fetch lesson counts for each category
      const counts: Record<number, number> = {};
      await Promise.all(
        data.map(async (category) => {
          try {
            const lessons = await lessonService.getAll(category.id);
            counts[category.id] = lessons.length;
          } catch (err) {
            counts[category.id] = 0;
          }
        })
      );
      setLessonCounts(counts);
    } catch (err: any) {
      setError('Failed to load categories');
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = () => {
    setEditCategory(undefined);
    setModalOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditCategory(category);
    setModalOpen(true);
    handleMenuClose();
  };

  const handleDeleteCategory = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    try {
      await categoryService.delete(categoryToDelete.id);
      setSuccess(`Category "${categoryToDelete.name}" deleted successfully`);
      fetchCategories();
    } catch (err: any) {
      setError('Failed to delete category');
      console.error('Failed to delete category:', err);
    } finally {
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleModalSuccess = () => {
    fetchCategories();
    setSuccess(editCategory ? 'Category updated successfully' : 'Category created successfully');
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, category: Category) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedCategory(category);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCategory(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    return dayjs(dateString).fromNow();
  };

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Categories
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Organize your lessons by creating custom categories
          </Typography>
        </Box>

        {/* Status Messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Loading State */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : categories.length === 0 ? (
          /* Empty State */
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <FolderIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              No categories yet
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Create your first category to start organizing your lessons
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateCategory}
              size="large"
            >
              Create Category
            </Button>
          </Box>
        ) : (
          /* Categories Grid */
          <Grid container spacing={3}>
            {categories.map((category) => (
              <Grid item xs={12} sm={6} md={4} key={category.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <FolderIcon color="primary" sx={{ fontSize: 32 }} />
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, category)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>
                    
                    <Typography variant="h6" component="h2" gutterBottom noWrap>
                      {category.name}
                    </Typography>
                    
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      paragraph
                      sx={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        minHeight: '3em'
                      }}
                    >
                      {category.description || 'No description provided'}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                      <Chip
                        icon={<ArticleIcon />}
                        label={`${lessonCounts[category.id] || 0} lessons`}
                        size="small"
                        variant="outlined"
                      />
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(category.created_at)}
                      </Typography>
                    </Box>
                  </CardContent>
                  
                  <CardActions>
                    <Button size="small" onClick={() => handleEditCategory(category)}>
                      Edit
                    </Button>
                    <Button size="small" color="error" onClick={() => handleDeleteCategory(category)}>
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => selectedCategory && handleEditCategory(selectedCategory)}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Edit
          </MenuItem>
          <Divider />
          <MenuItem 
            onClick={() => selectedCategory && handleDeleteCategory(selectedCategory)}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        </Menu>

        {/* Floating Action Button */}
        {categories.length > 0 && (
          <Fab
            color="primary"
            aria-label="add category"
            onClick={handleCreateCategory}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
            }}
          >
            <AddIcon />
          </Fab>
        )}

        {/* Create/Edit Category Modal */}
        <CategoryModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={handleModalSuccess}
          category={editCategory}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={deleteDialogOpen}
          title="Delete Category"
          content={`Are you sure you want to delete "${categoryToDelete?.name}"? This action cannot be undone and will affect all lessons in this category.`}
          onConfirm={confirmDeleteCategory}
          onCancel={() => setDeleteDialogOpen(false)}
        />
      </Container>
    </Layout>
  );
};

export default CategoryPage;
