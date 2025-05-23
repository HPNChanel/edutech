import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import { categoryService } from '../services/categoryService';
import type { Category } from '../types/lesson';

interface CategoryModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category?: Category;
}

const CategoryModal: React.FC<CategoryModalProps> = ({
  open,
  onClose,
  onSuccess,
  category
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Set form values when editing an existing category
  useEffect(() => {
    if (category) {
      setName(category.name);
      // Handle the case where description might not exist on the category type
      setDescription(category.description || '');
    } else {
      setName('');
      setDescription('');
    }
  }, [category, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      if (category) {
        // Update existing category
        await categoryService.update(category.id, { 
          name,
          // Only include description if your API supports it
          description 
        });
      } else {
        // Create new category
        await categoryService.create({ 
          name,
          // Only include description if your API supports it
          description 
        });
      }
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to save category:', err);
      setError('Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{category ? 'Edit Category' : 'Create Category'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <TextField
            fullWidth
            label="Category Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            margin="normal"
            autoFocus
            disabled={loading}
          />
          
          <TextField
            fullWidth
            label="Description (Optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            margin="normal"
            multiline
            rows={3}
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : category ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CategoryModal;
