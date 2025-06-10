import { useEffect } from 'react'

/**
 * Hook that listens for text selection events in the document
 * @param onTextSelect Callback function that receives the selected text
 * @param containerSelector Optional CSS selector to limit selection to specific containers
 */
export const useTextSelectionListener = (
  onTextSelect: (text: string) => void,
  containerSelector = '.lesson-content'
) => {
  useEffect(() => {
    const handleMouseUp = () => {
      // Use setTimeout to ensure the browser selection is ready
      setTimeout(() => {
        const selection = window.getSelection()
        if (!selection) return

        const text = selection.toString().trim()
        
        // Ignore if selection is collapsed or empty
        if (!text || text.length === 0) return

        // Check if selection is within the specified container
        if (containerSelector) {
          const container = document.querySelector(containerSelector)
          if (container && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0)
            const isWithinContainer = container.contains(range.commonAncestorContainer)
            if (!isWithinContainer) return
          }
        }

        onTextSelect(text)
      }, 0)
    }

    document.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [onTextSelect, containerSelector])
} 