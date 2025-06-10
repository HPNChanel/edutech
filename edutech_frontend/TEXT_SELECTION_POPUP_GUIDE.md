# Text Selection Popup Implementation Guide

## Overview

This implementation provides a stable, accurate, and reusable text selection popup similar to ChatGPT or Educative.io. The popup appears immediately after selecting text and maintains selection state until manually dismissed.

## Key Files

- `hooks/useTextSelectionPopup.ts` - The main hook that handles text selection detection
- `components/TextSelectionPopup.tsx` - The popup component that renders as a portal
- `components/TextSelectionDemo.tsx` - Demo component showing the implementation

## Features

✅ **Stable Positioning**: Uses `range.getBoundingClientRect()` for precise positioning  
✅ **Character Limits**: 256 character limit on selections and notes  
✅ **Screen Boundary Detection**: Prevents popup from overflowing off-screen  
✅ **Portal Rendering**: Renders using `ReactDOM.createPortal` to document.body  
✅ **Selection Persistence**: Preserves selection until manually dismissed  
✅ **Async Timing**: Uses `requestAnimationFrame()` for stable selection detection  
✅ **Memory Leak Prevention**: Proper cleanup of event listeners  

## Usage

### 1. Import the Hook and Component

```tsx
import { useTextSelectionPopup } from '@/hooks/useTextSelectionPopup'
import { TextSelectionPopup } from '@/components/TextSelectionPopup'
```

### 2. Use the Hook

```tsx
const textSelection = useTextSelectionPopup()
```

The hook returns:
```ts
{
  selectedText: string;
  position: { top: number; left: number } | null;
  range: Range | null;
  isVisible: boolean;
  show: () => void;
  hide: () => void;
}
```

### 3. Implement Event Handlers

```tsx
const handleHighlight = (text: string, range: Range) => {
  console.log('Highlighting:', text)
  // Save highlight to backend
  textSelection.hide()
}

const handleNote = (text: string, note: string, range: Range) => {
  console.log('Creating note:', note, 'for text:', text)
  // Save note to backend
  textSelection.hide()
}

const handleCancel = () => {
  textSelection.hide()
}
```

### 4. Render the Popup

```tsx
<TextSelectionPopup
  selectedText={textSelection.selectedText}
  position={textSelection.position}
  range={textSelection.range}
  isVisible={textSelection.isVisible}
  onHighlight={handleHighlight}
  onNote={handleNote}
  onCancel={handleCancel}
/>
```

## Technical Details

### Selection Detection
- Listens to `document.addEventListener("mouseup")` 
- Uses `requestAnimationFrame()` to wait for browser to establish selection
- Validates selection length (1-256 characters)
- Ensures selection has visible dimensions using `getBoundingClientRect()`

### Positioning Algorithm
```tsx
const position = {
  top: rect.top + window.scrollY - 50,  // 50px above selection
  left: rect.left + window.scrollX + (rect.width / 2) - 100  // Centered
}

// Clamp to viewport bounds
if (position.left < 10) position.left = 10
if (position.left + popupWidth > viewport.width) position.left = viewport.width - popupWidth - 10
```

### Range Persistence
- Stores `Range` object in `useRef` to prevent React re-renders from clearing it
- Only clears selection when `hide()` is called manually
- Does not interfere with lesson content re-rendering

## Integration Example

See `LessonDetailPage.tsx` for a complete integration example:

```tsx
// Replace old text selection system
const textSelection = useTextSelectionPopup()

// Update handlers to work with new interface
const handleHighlight = async (text: string, range: Range) => {
  // Your highlight logic
  textSelection.hide()
}

// Render popup
<TextSelectionPopup
  selectedText={textSelection.selectedText}
  position={textSelection.position}
  range={textSelection.range}
  isVisible={textSelection.isVisible}
  onHighlight={handleHighlight}
  onNote={handleNote}
  onCancel={handleCancel}
/>
```

## Demo

Run the `TextSelectionDemo` component to see the popup in action:

1. Select any text in the demo content
2. Watch the popup appear positioned near your selection
3. Test highlight and note functionality
4. Observe how selection persists until you interact with the popup

## Notes

- The popup appears immediately on text selection without requiring hover or additional triggers
- Selection state is preserved across React re-renders
- Works with any text content including markdown, code blocks, and plain text
- Fully responsive and handles screen edge cases
- Memory efficient with proper event listener cleanup 