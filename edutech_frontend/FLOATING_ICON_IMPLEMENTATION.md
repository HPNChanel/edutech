# Floating Icon Text Selection Implementation

## Overview

Phase 2 implementation of a floating icon trigger system for text selection. When users select text, a floating icon appears above the selection. Clicking the icon opens a popup for creating highlights or notes.

## Key Files

- `hooks/useFloatingSelectionIcon.ts` - Hook that monitors text selection
- `components/FloatingIcon.tsx` - Floating icon component
- `components/SelectionPopup.tsx` - Popup for highlight/note actions  
- `components/FloatingIconDemo.tsx` - Demo component
- `pages/LessonDetailPage.tsx` - Integration example

## System Architecture

### 1. Selection Detection Hook (`useFloatingSelectionIcon`)

```ts
export const useFloatingSelectionIcon = (): UseFloatingSelectionIconReturn => {
  // State management
  const [selectedText, setSelectedText] = useState('')
  const [position, setPosition] = useState<Position | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  
  // Range persistence
  const rangeRef = useRef<Range | null>(null)
  
  // Returns: { selectedText, position, range, isVisible, hideIcon }
}
```

**Features:**
- ✅ Monitors `mouseup` events with `requestAnimationFrame()` timing
- ✅ 100ms delay to ensure selection stability
- ✅ Validates selection length (1-256 characters)
- ✅ Smart positioning with screen edge detection
- ✅ Persists `Range` object in ref to prevent clearing
- ✅ Auto-hides on click outside or selection change

### 2. Floating Icon Component

```tsx
<FloatingIcon
  position={floatingSelection.position}
  isVisible={floatingSelection.isVisible && !showPopup}
  onClick={handleIconClick}
/>
```

**Features:**
- ✅ Portal-based rendering to `document.body`
- ✅ Positioned using absolute coordinates from hook
- ✅ Animated appearance with Tailwind animations
- ✅ Round button with message icon
- ✅ Proper z-index layering

### 3. Selection Popup Component

```tsx
<SelectionPopup
  selectedText={floatingSelection.selectedText}
  position={floatingSelection.position}
  range={floatingSelection.range}
  isVisible={showPopup}
  onHighlight={handleHighlight}
  onSaveNote={handleSaveNote}
  onCancel={handlePopupCancel}
/>
```

**Features:**
- ✅ Two-mode interface: action selection → note editor
- ✅ 40-character text preview
- ✅ Textarea with 256 character limit
- ✅ Highlight and Note buttons
- ✅ ESC key and Cancel button support
- ✅ Prevents mousedown from clearing selection

## Integration Steps

### 1. Add Imports to Page

```tsx
import { useFloatingSelectionIcon } from '@/hooks/useFloatingSelectionIcon'
import { FloatingIcon } from '@/components/FloatingIcon'
import { SelectionPopup } from '@/components/SelectionPopup'
```

### 2. Setup Hook and State

```tsx
const floatingSelection = useFloatingSelectionIcon()
const [showPopup, setShowPopup] = useState(false)
```

### 3. Implement Handlers

```tsx
const handleIconClick = () => {
  setShowPopup(true)
}

const handleHighlight = async (text: string, range: Range) => {
  // Create highlight via backend
  setShowPopup(false)
  floatingSelection.hideIcon()
}

const handleSaveNote = async (text: string, note: string, range: Range) => {
  // Create note via backend
  setShowPopup(false)
  floatingSelection.hideIcon()
}

const handlePopupCancel = () => {
  setShowPopup(false)
  floatingSelection.hideIcon()
}
```

### 4. Add Components to Render

```tsx
{/* Floating Selection System */}
<FloatingIcon
  position={floatingSelection.position}
  isVisible={floatingSelection.isVisible && !showPopup}
  onClick={handleIconClick}
/>

<SelectionPopup
  selectedText={floatingSelection.selectedText}
  position={floatingSelection.position}
  range={floatingSelection.range}
  isVisible={showPopup}
  onHighlight={handleHighlight}
  onSaveNote={handleSaveNote}
  onCancel={handlePopupCancel}
/>
```

## UX Flow

1. **Text Selection**: User selects text in lesson content
2. **Icon Appears**: Floating icon appears above selection after 100ms delay
3. **Icon Click**: User clicks icon to open popup
4. **Action Selection**: User chooses "Highlight" or "Add Note"
5. **Note Mode** (optional): If "Add Note", textarea appears for input
6. **Completion**: Action is saved, popup and icon disappear

## Key UX Constraints Met

✅ **No hover required** - Triggers on `mouseup` only  
✅ **Selection preservation** - Range stored in ref, not cleared by React  
✅ **Non-blocking** - Doesn't modify lesson content DOM  
✅ **Smart positioning** - Handles screen edges automatically  
✅ **Portal rendering** - Proper z-index without DOM conflicts  
✅ **Auto-dismiss** - Hides on outside click or ESC key  

## Technical Details

### Selection Validation
- Checks for non-empty, non-whitespace text
- Enforces 1-256 character limit
- Validates visible bounding rectangle
- Ensures range is not collapsed

### Positioning Algorithm
```tsx
const position = {
  top: rect.top + window.scrollY - 45,  // 45px above selection
  left: rect.left + window.scrollX + (rect.width / 2) - 20  // Centered
}

// Screen edge clamping
if (position.left < 10) position.left = 10
if (position.left + iconWidth > window.innerWidth - 10) {
  position.left = window.innerWidth - iconWidth - 10
}
```

### Event Handling
- `mouseup` listener with capture phase
- `requestAnimationFrame()` + 100ms timeout for stability
- Click outside detection with data attribute exclusions
- Proper cleanup to prevent memory leaks

## Demo Usage

To test the system, use the `FloatingIconDemo` component:

1. Select any text in the demo content
2. Observe floating icon appearance
3. Click icon to test popup functionality
4. Try both highlight and note creation flows

## Future Enhancements

- Backend integration for actual highlight/note storage
- Visual feedback for created highlights
- Note display on hover
- Keyboard shortcuts (Ctrl+H for highlight)
- Bulk operations on multiple selections 