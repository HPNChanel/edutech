import React from 'react'
import ChatInterface from '@/components/Chat/ChatInterface'

export default function ChatPage() {
  return (
    <div className="h-[calc(100vh-4rem)]"> {/* Account for navbar height */}
      <ChatInterface />
    </div>
  )
} 