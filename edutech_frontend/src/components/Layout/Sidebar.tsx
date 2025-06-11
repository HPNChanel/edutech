import { useLocation, Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  X,
  FolderOpen,
  MessageSquare,
  Clock,
  Target
} from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navigation: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Learning Goals',
    href: '/goals',
    icon: Target,
  },
  {
    title: 'Focus',
    href: '/focus',
    icon: Clock,
  },
  {
    title: 'AI Assistant',
    href: '/chat',
    icon: MessageSquare,
  },
  {
    title: 'Categories',
    href: '/categories',
    icon: FolderOpen,
  },
  {
    title: 'My Lessons',
    href: '/lessons',
    icon: BookOpen,
  },
  {
    title: 'Notes',
    href: '/notes',
    icon: FileText,
  },
]

interface SidebarProps {
  className?: string
  isOpen?: boolean
  onClose?: () => void
  isMobile?: boolean
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const location = useLocation()

  return (
    <div className="flex h-full w-64 flex-col">
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b px-6">
        <Link to="/dashboard" className="flex items-center space-x-2">
          <BookOpen className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-gray-900">EduTech</span>
        </Link>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-6">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.href || 
                          (item.href === '/lessons' && location.pathname.startsWith('/lessons/')) ||
                          (item.href === '/categories' && location.pathname.startsWith('/categories/')) ||
                          (item.href === '/focus' && location.pathname.startsWith('/focus'))
          
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="text-xs text-muted-foreground">
          © 2024 EduTech. All rights reserved.
        </div>
      </div>
    </div>
  )
}

export default function Sidebar({ className, isOpen, onClose, isMobile }: SidebarProps) {
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent onClose={onClose} />
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <aside className={cn(
      'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r shadow-sm',
      className
    )}>
      <SidebarContent />
    </aside>
  )
}
