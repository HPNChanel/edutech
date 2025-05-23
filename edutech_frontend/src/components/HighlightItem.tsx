import React, { useState } from 'react';
import { Box, IconButton, Popover, Typography, Button } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import type { Highlight } from '../types/highlight';

interface HighlightItemProps {
  highlight: Highlight;
  onDelete: (id: number) => void;
}

const HighlightItem: React.FC<HighlightItemProps> = ({ highlight, onDelete }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDelete = () => {
    onDelete(highlight.id);
    handleClose();
  };

  const open = Boolean(anchorEl);
  const id = open ? `highlight-popover-${highlight.id}` : undefined;

  const getHighlightStyle = (color: string) => {
    const colorStyles: Record<string, React.CSSProperties> = {
      yellow: { backgroundColor: 'rgba(255, 255, 0, 0.3)', cursor: 'pointer' },
      green: { backgroundColor: 'rgba(0, 255, 0, 0.3)', cursor: 'pointer' },
      blue: { backgroundColor: 'rgba(0, 191, 255, 0.3)', cursor: 'pointer' },
      pink: { backgroundColor: 'rgba(255, 192, 203, 0.3)', cursor: 'pointer' },
      orange: { backgroundColor: 'rgba(255, 165, 0, 0.3)', cursor: 'pointer' },
    };

    return colorStyles[color] || colorStyles.yellow;
  };

  return (
    <>
      <Box
        component="span"
        sx={getHighlightStyle(highlight.color)}
        onClick={handleClick}
        aria-describedby={id}
      >
        {highlight.content}
      </Box>
      
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2, maxWidth: 300 }}>
          <Typography variant="body2" gutterBottom>
            Created: {new Date(highlight.created_at).toLocaleString()}
          </Typography>
          <Button
            size="small"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
            fullWidth
            variant="outlined"
            sx={{ mt: 1 }}
          >
            Delete Highlight
          </Button>
        </Box>
      </Popover>
    </>
  );
};

export default HighlightItem;
