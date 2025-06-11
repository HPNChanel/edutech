import { useEffect } from 'react'

export interface TextSelection {
  text: string
  start_offset: number
  end_offset: number
  blockId?: string
}

/**
 * Calculates the text offset within the lesson content container
 * This method works with the raw text content, ignoring HTML tags and formatting
 * @param container The container element
 * @param range The selection range
 * @returns Object with start and end offsets
 */
const calculateContentOffsets = (container: Element, range: Range): { start_offset: number; end_offset: number } => {
  try {
    // Get the plain text content of the container (without HTML tags)
    const containerText = container.textContent || ''
    const selectedText = range.toString().trim()
    
    if (!selectedText || !containerText) {
      return { start_offset: 0, end_offset: 0 }
    }

    // For a more robust approach, we'll calculate based on text content
    // Get text before the selection start
    const beforeRange = document.createRange()
    beforeRange.setStart(container, 0)
    beforeRange.setEnd(range.startContainer, range.startOffset)
    const textBefore = beforeRange.toString()
    
    const start_offset = textBefore.length
    const end_offset = start_offset + selectedText.length

    console.log('📍 Offset calculation:', {
      selectedText: selectedText.substring(0, 50) + '...',
      textBefore: textBefore.substring(Math.max(0, textBefore.length - 50)),
      start_offset,
      end_offset,
      containerTextLength: containerText.length
    })

    return { start_offset, end_offset }
  } catch (error) {
    console.error('Error calculating offsets:', error)
    // Fallback: try to find the text in the container
    const containerText = container.textContent || ''
    const selectedText = range.toString().trim()
    const textIndex = containerText.indexOf(selectedText)
    
    if (textIndex >= 0) {
      return {
        start_offset: textIndex,
        end_offset: textIndex + selectedText.length
      }
    }
    
    return { start_offset: 0, end_offset: selectedText.length }
  }
}

/**
 * Find block information if the content uses block-based structure
 * @param range The selection range
 * @returns Block ID if found
 */
const findBlockInfo = (range: Range): string | undefined => {
  try {
    // Look for block elements with data-block-id
    const startContainer = range.startContainer
    const blockElement = (startContainer.nodeType === Node.TEXT_NODE 
      ? startContainer.parentElement 
      : startContainer as Element)?.closest('[data-block-id]')
      
    return blockElement?.getAttribute('data-block-id') || undefined
  } catch (error) {
    console.warn('Could not find block info:', error)
    return undefined
  }
}

/**
 * Hook that listens for text selection events and calculates offsets
 * @param onTextSelect Callback function that receives the selection data
 * @param containerSelector Optional CSS selector to limit selection to specific containers
 */
export const useTextSelectionListener = (
  onTextSelect: (selection: TextSelection | null) => void,
  containerSelector = '.lesson-content'
) => {
  useEffect(() => {
    const handleMouseUp = () => {
      // Use setTimeout to ensure the browser selection is ready
      setTimeout(() => {
        const selection = window.getSelection()
        if (!selection || selection.rangeCount === 0) {
          onTextSelect(null)
          return
        }

        const text = selection.toString().trim()
        
        // Ignore if selection is collapsed or empty
        if (!text || text.length === 0) {
          onTextSelect(null)
          return
        }

        // Check if selection is within the specified container
        const container = document.querySelector(containerSelector)
        if (!container) {
          console.warn(`Container not found: ${containerSelector}`)
          onTextSelect(null)
          return
        }

        const range = selection.getRangeAt(0)
        const isWithinContainer = container.contains(range.commonAncestorContainer)
        
        if (!isWithinContainer) {
          console.log('Selection is outside container')
          onTextSelect(null)
          return
        }

        try {
          // Calculate offsets relative to the container
          const { start_offset, end_offset } = calculateContentOffsets(container, range)
          
          // Find block info if available
          const blockId = findBlockInfo(range)

          // Validate the offsets
          if (start_offset < 0 || end_offset <= start_offset) {
            console.warn('Invalid offsets calculated:', { start_offset, end_offset })
            onTextSelect(null)
            return
          }

          const selectionData: TextSelection = {
            text,
            start_offset,
            end_offset,
            ...(blockId && { blockId })
          }

          console.log('✅ Valid text selection:', selectionData)
          onTextSelect(selectionData)
        } catch (error) {
          console.error('Error processing text selection:', error)
          onTextSelect(null)
        }
      }, 100) // Slightly longer delay to ensure DOM is stable
    }

    const handleMouseDown = () => {
      // Clear selection when mouse down (start of new selection)
      onTextSelect(null)
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      // Handle keyboard-based selections (Shift+arrows, etc.)
      if (event.shiftKey || event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        setTimeout(handleMouseUp, 50)
      }
    }

    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keyup', handleKeyUp)
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [onTextSelect, containerSelector])
} 