import { useState, useCallback, useRef } from 'react'

export interface TextSelectionData {
  selectedText: string
  blockId?: string
  start_offset: number
  end_offset: number
  range?: Range
}

/**
 * Calculates text offsets within a container element
 * This method works with the raw text content, ignoring HTML tags
 */
const calculateContentOffsets = (container: Element, range: Range): { start_offset: number; end_offset: number } => {
  try {
    // Create a range from container start to selection start
    const beforeRange = document.createRange()
    beforeRange.setStart(container, 0)
    beforeRange.setEnd(range.startContainer, range.startOffset)
    const textBefore = beforeRange.toString()
    
    const selectedText = range.toString()
    const start_offset = textBefore.length
    const end_offset = start_offset + selectedText.length

    console.log('📍 Offset calculation:', {
      selectedText: selectedText.substring(0, 50) + (selectedText.length > 50 ? '...' : ''),
      start_offset,
      end_offset,
      containerTextLength: container.textContent?.length || 0
    })

    return { start_offset, end_offset }
  } catch (error) {
    console.error('Error calculating offsets:', error)
    // Fallback calculation
    const containerText = container.textContent || ''
    const selectedText = range.toString()
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
 * Find block information by looking for data-block-id attribute
 */
const findBlockInfo = (range: Range): string | undefined => {
  try {
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
 * Stable text selection hook that captures and maintains selection data
 * until explicitly cleared
 */
export const useTextSelectionData = (containerSelector = '.lesson-content') => {
  const [selectionData, setSelectionData] = useState<TextSelectionData | null>(null)
  const stableRangeRef = useRef<Range | null>(null)

  const captureSelection = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      return null
    }

    const text = selection.toString().trim()
    if (!text || text.length === 0) {
      return null
    }

    // Check if selection is within the specified container
    const container = document.querySelector(containerSelector)
    if (!container) {
      console.warn(`Container not found: ${containerSelector}`)
      return null
    }

    const range = selection.getRangeAt(0)
    const isWithinContainer = container.contains(range.commonAncestorContainer)
    
    if (!isWithinContainer) {
      console.log('Selection is outside container')
      return null
    }

    try {
      // Calculate offsets relative to the container
      const { start_offset, end_offset } = calculateContentOffsets(container, range)
      
      // Find block info if available
      const blockId = findBlockInfo(range)

      // Validate the offsets
      if (start_offset < 0 || end_offset <= start_offset) {
        console.warn('Invalid offsets calculated:', { start_offset, end_offset })
        return null
      }

      const data: TextSelectionData = {
        selectedText: text,
        start_offset,
        end_offset,
        range: range.cloneRange(), // Store a cloned range
        ...(blockId && { blockId })
      }

      // Store stable reference
      stableRangeRef.current = range.cloneRange()
      setSelectionData(data)

      console.log('✅ Captured stable text selection:', data)
      return data
    } catch (error) {
      console.error('Error processing text selection:', error)
      return null
    }
  }, [containerSelector])

  const clearSelection = useCallback(() => {
    setSelectionData(null)
    stableRangeRef.current = null
    
    // Clear browser selection
    const selection = window.getSelection()
    if (selection) {
      selection.removeAllRanges()
    }
    
    console.log('🧹 Selection cleared')
  }, [])

  const updateSelection = useCallback((newData: Partial<TextSelectionData>) => {
    setSelectionData(prev => prev ? { ...prev, ...newData } : null)
  }, [])

  return {
    selectionData,
    captureSelection,
    clearSelection,
    updateSelection,
    hasSelection: selectionData !== null,
    stableRange: stableRangeRef.current
  }
} 