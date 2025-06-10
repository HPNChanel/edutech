import React from 'react'
import { renderTextWithHighlights } from '@/lib/highlightUtils'

interface HighlightedTextProps {
  text: string
  highlights: Array<{
    start_offset: number
    end_offset: number
    text: string
    id: number
    color?: string
  }>
  className?: string
}

/**
 * React component for rendering text with highlights
 * Uses React-based rendering instead of direct DOM manipulation
 */
export const HighlightedText: React.FC<HighlightedTextProps> = ({
  text,
  highlights,
  className = ''
}) => {
  // Get text segments with highlight information
  const segments = renderTextWithHighlights(text, highlights)

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (segment.isHighlighted) {
          return (
            <span
              key={`highlight-${segment.highlightId}-${index}`}
              className="highlighted-text"
              data-highlight-id={segment.highlightId}
              style={{ backgroundColor: segment.color || 'yellow' }}
            >
              {segment.text}
            </span>
          )
        }
        
        return <span key={`text-${index}`}>{segment.text}</span>
      })}
    </span>
  )
}

export default HighlightedText 