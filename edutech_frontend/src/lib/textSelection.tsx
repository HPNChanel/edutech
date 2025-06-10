/**
 * Text Selection Utilities for EduTech Platform
 * 
 * This module provides utilities to ensure comprehensive text selection
 * across all lesson content, regardless of rendering method.
 */

import React from 'react'
import { cn } from './utils'

/**
 * Get comprehensive text selection class names for lesson content
 * This ensures text selection works everywhere inside a lesson
 */
export const getLessonContentClasses = () => {
  return cn(
    // Base lesson content class
    'lesson-content',
    
    // Enable text selection with Tailwind utilities
    'select-text cursor-text',
    
    // Apply selection to all child elements
    '[&_*]:select-text',
    '[&_*]:pointer-events-auto', 
    '[&_*]:cursor-text',
    
    // Common prose/content styling that works with text selection
    'prose prose-lg max-w-none',
    
    // Specific element styling
    'prose-headings:text-gray-900',
    'prose-p:text-gray-700', 
    'prose-strong:text-gray-900',
    'prose-code:text-pink-600',
    'prose-code:bg-pink-50',
    'prose-pre:bg-gray-900',
    'prose-pre:text-gray-100'
  )
}

/**
 * Get inline styles for comprehensive text selection support
 */
export const getLessonContentStyles = (): React.CSSProperties => {
  return {
    userSelect: 'text',
    WebkitUserSelect: 'text',
    MozUserSelect: 'text',
    msUserSelect: 'text',
    cursor: 'text',
    pointerEvents: 'auto'
  }
}

/**
 * Get ReactMarkdown component overrides that support text selection
 */
export const getLessonMarkdownComponents = () => {
  return {
    h1: ({ children }: { children: React.ReactNode }) => (
      <h1 className="text-3xl font-bold mt-8 mb-4 first:mt-0 select-text cursor-text">
        {children}
      </h1>
    ),
    h2: ({ children }: { children: React.ReactNode }) => (
      <h2 className="text-2xl font-semibold mt-6 mb-3 select-text cursor-text">
        {children}
      </h2>
    ),
    h3: ({ children }: { children: React.ReactNode }) => (
      <h3 className="text-xl font-medium mt-4 mb-2 select-text cursor-text">
        {children}
      </h3>
    ),
    p: ({ children }: { children: React.ReactNode }) => (
      <p className="mb-4 leading-relaxed select-text cursor-text">
        {children}
      </p>
    ),
    ul: ({ children }: { children: React.ReactNode }) => (
      <ul className="mb-4 ml-6 list-disc select-text">
        {children}
      </ul>
    ),
    ol: ({ children }: { children: React.ReactNode }) => (
      <ol className="mb-4 ml-6 list-decimal select-text">
        {children}
      </ol>
    ),
    li: ({ children }: { children: React.ReactNode }) => (
      <li className="mb-1 select-text cursor-text">
        {children}
      </li>
    ),
    code: ({ children, ...props }: { children: React.ReactNode; className?: string }) => {
      const isInline = !props.className?.includes('language-')
      return isInline ? (
        <code className="px-2 py-1 bg-gray-100 text-pink-600 rounded text-sm font-mono select-text">
          {children}
        </code>
      ) : (
        <code className="block select-text">
          {children}
        </code>
      )
    },
    pre: ({ children }: { children: React.ReactNode }) => (
      <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto mb-4 select-text">
        {children}
      </pre>
    ),
    blockquote: ({ children }: { children: React.ReactNode }) => (
      <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-gray-600 select-text cursor-text">
        {children}
      </blockquote>
    ),
    strong: ({ children }: { children: React.ReactNode }) => (
      <strong className="font-bold select-text cursor-text">
        {children}
      </strong>
    ),
    em: ({ children }: { children: React.ReactNode }) => (
      <em className="italic select-text cursor-text">
        {children}
      </em>
    ),
    a: ({ children, href }: { children: React.ReactNode; href?: string }) => (
      <a href={href} className="text-blue-600 underline select-text cursor-pointer hover:text-blue-800">
        {children}
      </a>
    ),
    table: ({ children }: { children: React.ReactNode }) => (
      <div className="overflow-x-auto mb-4">
        <table className="min-w-full border-collapse select-text">
          {children}
        </table>
      </div>
    ),
    th: ({ children }: { children: React.ReactNode }) => (
      <th className="border border-gray-300 px-4 py-2 bg-gray-50 font-semibold text-left select-text cursor-text">
        {children}
      </th>
    ),
    td: ({ children }: { children: React.ReactNode }) => (
      <td className="border border-gray-300 px-4 py-2 select-text cursor-text">
        {children}
      </td>
    )
  }
}



/**
 * Get classes for whitespace-pre-wrap content (like in lesson previews)
 */
export const getPlainTextContentClasses = () => {
  return cn(
    'lesson-content',
    'whitespace-pre-wrap',
    'select-text cursor-text',
    '[&_*]:select-text',
    '[&_*]:pointer-events-auto',
    '[&_*]:cursor-text'
  )
} 