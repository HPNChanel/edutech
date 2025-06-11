import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [focusMode, setFocusMode] = useState(false)

  // Listen for focus mode toggle events from FocusPage
  useEffect(() => {
    const handleFocusModeToggle = (event: CustomEvent) => {
      setFocusMode(event.detail.focusMode)
    }

    window.addEventListener('focusModeToggle', handleFocusModeToggle as EventListener)
    
    return () => {
      window.removeEventListener('focusModeToggle', handleFocusModeToggle as EventListener)
    }
  }, [])

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      {!focusMode && (
        <Sidebar 
          className="hidden lg:flex" 
          onClose={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Mobile Sidebar */}
      {!focusMode && (
        <Sidebar 
          className="lg:hidden" 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isMobile
        />
      )}
      
      {/* Main Content Area */}
      <div className={`flex flex-col flex-1 ${!focusMode ? 'lg:ml-64' : ''}`}>
        {!focusMode && <Navbar onMenuClick={() => setSidebarOpen(true)} />}
        
        <main className={`flex-1 ${!focusMode ? 'p-4 md:p-6' : 'p-0'} overflow-auto`}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
