/**
 * Highlight Utilities for React-Based Highlighting
 * Handles metadata extraction for backend persistence without direct DOM manipulation
 */

// Interface for highlight metadata
export interface HighlightMetadata {
  lessonId: string
  selectedText: string
  startOffset: number
  endOffset: number
  blockId?: string
  blockText?: string
}

/**
 * Extracts metadata from a range for backend persistence
 * @param range - The Range object representing the selected text
 * @param lessonId - The current lesson ID
 * @returns HighlightMetadata object with all necessary information
 */
export const extractHighlightMetadata = (range: Range, lessonId: string): HighlightMetadata => {
  console.log('📊 Extracting highlight metadata for lesson:', lessonId)
  
  if (!range || range.collapsed) {
    throw new Error('Invalid or collapsed range cannot provide metadata')
  }

  const selectedText = range.toString().trim()
  
  if (!selectedText) {
    throw new Error('No text selected for highlighting')
  }

  // Find the closest block element or lesson content container
  const startContainer = range.startContainer
  const blockElement = (startContainer.nodeType === Node.TEXT_NODE 
    ? startContainer.parentElement 
    : startContainer as Element)?.closest('[data-block-id], .lesson-content, p, div, h1, h2, h3, h4, h5, h6')

  const blockId = blockElement?.getAttribute('data-block-id') || null
  const blockText = blockElement?.textContent || ''
  
  // Calculate offsets within the block or lesson content
  let startOffset = 0
  let endOffset = selectedText.length

  if (blockText) {
    const textIndex = blockText.indexOf(selectedText)
    if (textIndex >= 0) {
      startOffset = textIndex
      endOffset = textIndex + selectedText.length
    }
  }

  const metadata: HighlightMetadata = {
    lessonId,
    selectedText,
    startOffset,
    endOffset,
    blockId: blockId || undefined,
    blockText: blockText || undefined
  }

  console.log('📊 Extracted metadata:', {
    selectedTextPreview: selectedText.substring(0, 50),
    startOffset,
    endOffset,
    blockId,
    hasBlockText: Boolean(blockText)
  })

  return metadata
}

/**
 * Validates if text can be highlighted (not empty, within limits, etc.)
 * @param range - The Range object to validate
 * @returns true if the range can be highlighted
 */
export const canHighlightRange = (range: Range): boolean => {
  if (!range || range.collapsed) {
    console.log('❌ Cannot highlight: range is collapsed or invalid')
    return false
  }

  const selectedText = range.toString().trim()
  if (!selectedText) {
    console.log('❌ Cannot highlight: no text selected')
    return false
  }

  if (selectedText.length > 5000) {
    console.log('❌ Cannot highlight: text too long (>5000 chars)')
    return false
  }

  console.log('✅ Range can be highlighted')
  return true
}

/**
 * Splits text by highlight offsets for React rendering
 * @param text - The full text content
 * @param startOffset - Start position of highlight
 * @param endOffset - End position of highlight
 * @returns Array of text parts: [before, highlighted, after]
 */
export const splitTextByHighlight = (text: string, startOffset: number, endOffset: number): string[] => {
  const before = text.substring(0, startOffset)
  const highlighted = text.substring(startOffset, endOffset)
  const after = text.substring(endOffset)
  
  return [before, highlighted, after]
}

/**
 * Finds all highlights that apply to a given text block
 * @param highlights - Array of highlight objects
 * @param blockText - The text content of the block
 * @param blockId - Optional block ID to filter by
 * @returns Array of applicable highlights sorted by start offset
 */
export const findHighlightsForBlock = (
  highlights: Array<{ start_offset: number; end_offset: number; text: string; id: number; color?: string }>,
  blockText: string
): Array<{ start_offset: number; end_offset: number; text: string; id: number; color?: string }> => {
  return highlights
    .filter(highlight => {
      // Match by text content - block-based highlighting can be added later
      return blockText.includes(highlight.text)
    })
    .sort((a, b) => a.start_offset - b.start_offset)
}

/**
 * Renders text with multiple highlights as React-compatible structure
 * @param text - The full text content
 * @param highlights - Array of highlights to apply
 * @returns Array of text segments with highlight information
 */
export const renderTextWithHighlights = (
  text: string,
  highlights: Array<{ start_offset: number; end_offset: number; text: string; id: number; color?: string }>
): Array<{ text: string; isHighlighted: boolean; highlightId?: number; color?: string }> => {
  if (!highlights.length) {
    return [{ text, isHighlighted: false }]
  }

  const segments: Array<{ text: string; isHighlighted: boolean; highlightId?: number; color?: string }> = []
  let currentPos = 0

  // Sort highlights by start position
  const sortedHighlights = [...highlights].sort((a, b) => a.start_offset - b.start_offset)

  for (const highlight of sortedHighlights) {
    // Add text before highlight if any
    if (currentPos < highlight.start_offset) {
      segments.push({
        text: text.substring(currentPos, highlight.start_offset),
        isHighlighted: false
      })
    }

    // Add highlighted text
    segments.push({
      text: text.substring(highlight.start_offset, highlight.end_offset),
      isHighlighted: true,
      highlightId: highlight.id,
      color: highlight.color || 'yellow'
    })

    currentPos = Math.max(currentPos, highlight.end_offset)
  }

  // Add remaining text after last highlight
  if (currentPos < text.length) {
    segments.push({
      text: text.substring(currentPos),
      isHighlighted: false
    })
  }

  return segments
}

/**
 * Creates highlight metadata without DOM manipulation
 * @param range - The Range object representing the selected text
 * @param lessonId - The current lesson ID
 * @returns HighlightMetadata for backend persistence
 */
export const createHighlightMetadata = (range: Range, lessonId: string): HighlightMetadata => {
  console.log('🎯 Creating highlight metadata for lesson:', lessonId)
  
  // Validate the range first
  if (!canHighlightRange(range)) {
    throw new Error('Range cannot be highlighted')
  }

  // Extract metadata without modifying the DOM
  const metadata = extractHighlightMetadata(range, lessonId)
  
  console.log('✅ Highlight metadata created successfully')
  
  return metadata
}

/**
 * Enhanced function to apply highlights to the entire lesson content
 * This replaces the block-by-block approach with a global content approach
 * @param content - The raw lesson content (markdown or plain text)
 * @param highlights - Array of highlight objects with absolute offsets
 * @returns HTML string with highlighted spans injected
 */
export const applyHighlightsToContent = (
  content: string,
  highlights: Array<{ start_offset: number; end_offset: number; text: string; id: number; color?: string }>
): string => {
  if (!highlights.length) {
    return content
  }

  // Sort highlights by start_offset in descending order (process from end to beginning)
  // This prevents offset shifts when injecting spans
  const sortedHighlights = [...highlights].sort((a, b) => b.start_offset - a.start_offset)

  let processedContent = content

  for (const highlight of sortedHighlights) {
    const { start_offset, end_offset, color = 'yellow', id } = highlight

    // Validate offsets
    if (start_offset < 0 || end_offset > processedContent.length || start_offset >= end_offset) {
      console.warn(`Invalid highlight offsets for highlight ${id}: ${start_offset}-${end_offset}`)
      continue
    }

    // Extract the text to be highlighted
    const before = processedContent.slice(0, start_offset)
    const highlightedText = processedContent.slice(start_offset, end_offset)
    const after = processedContent.slice(end_offset)

    // Create the highlight span with proper color mapping
    const colorClass = getHighlightColorClass(color)
    const highlightSpan = `<span class="${colorClass}" data-highlight-id="${id}">${highlightedText}</span>`

    // Reconstruct the content with the highlight applied
    processedContent = before + highlightSpan + after
  }

  return processedContent
}

/**
 * Process markdown content with highlights and return rendered HTML
 * This function combines markdown processing with highlight application
 * @param content - The raw markdown content
 * @param highlights - Array of highlight objects with absolute offsets
 * @returns Rendered HTML string with highlights and markdown processing
 */
export const processMarkdownWithHighlights = (
  content: string,
  highlights: Array<{ start_offset: number; end_offset: number; text: string; id: number; color?: string }>
): string => {
  // For now, we'll apply highlights directly to the content
  // In the future, we can enhance this to properly handle markdown syntax
  const contentWithHighlights = applyHighlightsToContent(content, highlights)
  
  // Apply basic markdown-like formatting while preserving highlight spans
  let processedContent = contentWithHighlights
  
  // Convert line breaks to <br> tags for better display
  processedContent = processedContent.replace(/\n/g, '<br>')
  
  // Convert **bold** to <strong> (be careful not to break highlight spans)
  processedContent = processedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  
  // Convert *italic* to <em>
  processedContent = processedContent.replace(/\*(.*?)\*/g, '<em>$1</em>')
  
  // Convert # Headings
  processedContent = processedContent.replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mb-4">$1</h1>')
  processedContent = processedContent.replace(/^## (.*$)/gm, '<h2 class="text-2xl font-semibold mb-3">$1</h2>')
  processedContent = processedContent.replace(/^### (.*$)/gm, '<h3 class="text-xl font-medium mb-2">$1</h3>')
  
  return processedContent
}

/**
 * Maps highlight colors to Tailwind CSS classes
 * @param color - The color string from the database
 * @returns Tailwind CSS class string
 */
export const getHighlightColorClass = (color?: string): string => {
  switch (color?.toLowerCase()) {
    case 'yellow':
      return 'bg-yellow-300 px-1 rounded'
    case 'green':
      return 'bg-green-300 px-1 rounded'
    case 'red':
      return 'bg-red-300 px-1 rounded'
    case 'blue':
      return 'bg-blue-300 px-1 rounded'
    case 'purple':
      return 'bg-purple-300 px-1 rounded'
    case 'orange':
      return 'bg-orange-300 px-1 rounded'
    default:
      return 'bg-yellow-300 px-1 rounded'
  }
} 