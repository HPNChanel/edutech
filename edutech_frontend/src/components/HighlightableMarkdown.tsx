import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { HighlightedText } from './HighlightedText'
import { findHighlightsForBlock } from '@/lib/highlightUtils'

interface HighlightableMarkdownProps {
  content: string
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
 * Custom Markdown renderer that supports text highlighting
 * Renders highlights using React components instead of DOM manipulation
 */
export const HighlightableMarkdown: React.FC<HighlightableMarkdownProps> = ({
  content,
  highlights,
  className = ''
}) => {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom paragraph renderer with highlight support
          p: ({ children, ...props }) => {
            // Extract text content from the paragraph
            const textContent = React.Children.toArray(children).join('')
            
            if (typeof textContent === 'string') {
              // Find highlights that apply to this paragraph
              const applicableHighlights = findHighlightsForBlock(highlights, textContent)
              
              if (applicableHighlights.length > 0) {
                return (
                  <p {...props}>
                    <HighlightedText
                      text={textContent}
                      highlights={applicableHighlights}
                    />
                  </p>
                )
              }
            }
            
            // Fall back to default rendering if no highlights or not text
            return <p {...props}>{children}</p>
          },
          
          // Custom heading renderers with highlight support
          h1: ({ children, ...props }) => {
            const textContent = React.Children.toArray(children).join('')
            
            if (typeof textContent === 'string') {
              const applicableHighlights = findHighlightsForBlock(highlights, textContent)
              
              if (applicableHighlights.length > 0) {
                return (
                  <h1 {...props}>
                    <HighlightedText
                      text={textContent}
                      highlights={applicableHighlights}
                    />
                  </h1>
                )
              }
            }
            
            return <h1 {...props}>{children}</h1>
          },
          
          h2: ({ children, ...props }) => {
            const textContent = React.Children.toArray(children).join('')
            
            if (typeof textContent === 'string') {
              const applicableHighlights = findHighlightsForBlock(highlights, textContent)
              
              if (applicableHighlights.length > 0) {
                return (
                  <h2 {...props}>
                    <HighlightedText
                      text={textContent}
                      highlights={applicableHighlights}
                    />
                  </h2>
                )
              }
            }
            
            return <h2 {...props}>{children}</h2>
          },
          
          h3: ({ children, ...props }) => {
            const textContent = React.Children.toArray(children).join('')
            
            if (typeof textContent === 'string') {
              const applicableHighlights = findHighlightsForBlock(highlights, textContent)
              
              if (applicableHighlights.length > 0) {
                return (
                  <h3 {...props}>
                    <HighlightedText
                      text={textContent}
                      highlights={applicableHighlights}
                    />
                  </h3>
                )
              }
            }
            
            return <h3 {...props}>{children}</h3>
          },
          
          // Add more component overrides as needed (h4, h5, h6, span, div, etc.)
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default HighlightableMarkdown 