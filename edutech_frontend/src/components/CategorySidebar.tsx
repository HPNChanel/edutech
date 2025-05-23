import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Divider,
  Tooltip,
  CircularProgress,
  Button
} from '@mui/material';
import {
  Folder as FolderIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { categoryService } from '../services/categoryService';
import type { Category } from '../types/lesson';
import CategoryModal from './CategoryModal';
import ConfirmDialog from './ConfirmDialog';

interface CategorySidebarProps {
  onSelectCategory: (categoryId: number | null) => void;
  selectedCategoryId: number | null;
}

const CategorySidebar: React.FC<CategorySidebarProps> = ({
  onSelectCategory,
  selectedCategoryId
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | undefined>(undefined);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = () => {
    setEditCategory(undefined);
    setModalOpen(true);
  };

  const handleEditCategory = (category: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditCategory(category);
    setModalOpen(true);
  };

  const handleDeleteCategory = (category: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    try {
      await categoryService.delete(categoryToDelete.id);
      
      // Refresh categories
      fetchCategories();
      
      // If the deleted category was selected, reset selection
      if (selectedCategoryId === categoryToDelete.id) {
        onSelectCategory(null);
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
    } finally {
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Categories</Typography>
        <Tooltip title="Add Category">
          <IconButton onClick={handleCreateCategory} size="small">
            <AddIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      <Divider />
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress size={24} />
        </Box>
      ) : error ? (
        <Typography color="error" sx={{ p: 2 }}>{error}</Typography>
      ) : categories.length === 0 ? (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="text.secondary">No categories found</Typography>
          <Button 
            variant="outlined" 
            startIcon={<AddIcon />} 
            onClick={handleCreateCategory}
            sx={{ mt: 1 }}
          >
            Create your first category
          </Button>
        </Box>
      ) : (
        <List>
          <ListItem disablePadding>
            <ListItemButton 
              selected={selectedCategoryId === null}
              onClick={() => onSelectCategory(null)}
            >
              <ListItemIcon>
                <FolderIcon />
              </ListItemIcon>
              <ListItemText primary="All Categories" />
            </ListItemButton>
          </ListItem>
          
          {categories.map((category) => (
            <ListItem
              key={category.id}
              disablePadding
              secondaryAction={
                <Box>
                  <Tooltip title="Edit">
                    <IconButton 
                      edge="end" 
                      size="small"
                      onClick={(e) => handleEditCategory(category, e)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton 
                      edge="end" 
                      size="small"
                      onClick={(e) => handleDeleteCategory(category, e)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
            >
              <ListItemButton
                selected={selectedCategoryId === category.id}
                onClick={() => onSelectCategory(category.id)}
              >
                <ListItemIcon>
                  <FolderIcon />
                </ListItemIcon>
                <ListItemText 
                  primary={category.name} 
                  secondary={category.description} 
                  primaryTypographyProps={{ noWrap: true }} 
                  secondaryTypographyProps={{ noWrap: true }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}
      
      {/* Create/Edit Category Modal */}
      <CategoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchCategories}
        category={editCategory}
      />
      
      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Category"
        content={`Are you sure you want to delete "${categoryToDelete?.name}"? This action cannot be undone.`}
        onConfirm={confirmDeleteCategory}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </Box>
  );
};

export default CategorySidebar;
