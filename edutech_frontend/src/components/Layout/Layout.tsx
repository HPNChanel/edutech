import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <Sidebar 
        className="hidden lg:flex" 
        onClose={() => setSidebarOpen(false)}
      />
      
      {/* Mobile Sidebar */}
      <Sidebar 
        className="lg:hidden" 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile
      />
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 lg:ml-64">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
