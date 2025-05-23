import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface HighlightModalProps {
  open: boolean;
  onClose: () => void;
  selectedText: string;
  lessonId: number;
  fromChar: number;
  toChar: number;
  onSave: (color: string, note: string) => void;
}

const colors = [
  { value: 'yellow', label: 'Yellow' },
  { value: 'green', label: 'Green' },
  { value: 'blue', label: 'Blue' },
  { value: 'pink', label: 'Pink' },
  { value: 'orange', label: 'Orange' },
];

const HighlightModal: React.FC<HighlightModalProps> = ({
  open,
  onClose,
  selectedText,
  lessonId,
  fromChar,
  toChar,
  onSave
}) => {
  const [color, setColor] = useState('yellow');
  const [note, setNote] = useState('');

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setColor(event.target.value);
  };

  const handleNoteChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNote(event.target.value);
  };

  const handleSave = () => {
    onSave(color, note);
    setColor('yellow');
    setNote('');
    onClose();
  };

  const handleClose = () => {
    setColor('yellow');
    setNote('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Highlight Text</Typography>
          <IconButton edge="end" color="inherit" onClick={handleClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom>Selected Text:</Typography>
          <Box
            p={2}
            borderRadius={1}
            style={{ backgroundColor: '#f5f5f5' }}
          >
            <Typography variant="body1">{selectedText}</Typography>
          </Box>
        </Box>
        
        <Typography variant="subtitle1" gutterBottom>Choose Highlight Color:</Typography>
        <RadioGroup
          row
          name="highlight-color"
          value={color}
          onChange={handleColorChange}
        >
          {colors.map((colorOption) => (
            <FormControlLabel
              key={colorOption.value}
              value={colorOption.value}
              control={
                <Radio
                  sx={{
                    color: colorOption.value,
                    '&.Mui-checked': {
                      color: colorOption.value,
                    },
                  }}
                />
              }
              label={colorOption.label}
            />
          ))}
        </RadioGroup>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="subtitle1" gutterBottom>Add Note (Optional):</Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          placeholder="Write your notes here..."
          value={note}
          onChange={handleNoteChange}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HighlightModal;
