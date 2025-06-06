import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { 
  FolderOpen, 
  Hash, 
  ChevronRight,
  X
} from 'lucide-react'

interface Category {
  id: string
  name: string
  description: string
  lessonCount: number
  color?: string
  icon?: string
}

interface CategorySidebarProps {
  isOpen?: boolean
  onClose?: () => void
  isMobile?: boolean
  className?: string
  selectedCategoryId?: string
  onCategorySelect?: (categoryId: string) => void
}

export default function CategorySidebar({
  isOpen = true,
  onClose,
  isMobile = false,
  className,
  selectedCategoryId,
  onCategorySelect
}: CategorySidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get active category from URL or prop
  const getActiveCategoryId = () => {
    if (selectedCategoryId) return selectedCategoryId
    
    const pathParts = location.pathname.split('/')
    const categoryIndex = pathParts.indexOf('categories')
    if (categoryIndex !== -1 && pathParts[categoryIndex + 1]) {
      return pathParts[categoryIndex + 1]
    }
    return null
  }

  const activeCategoryId = getActiveCategoryId()

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true)
        
        // Simulate API call - replace with actual endpoint
        // const response = await fetch('/api/categories')
        // const categoriesData = await response.json()
        
        const categoriesData: Category[] = [
          {
            id: 'all',
            name: 'All Categories',
            description: 'Browse all available lessons',
            lessonCount: 45,
            color: 'blue'
          },
          {
            id: 'react',
            name: 'React Development',
            description: 'Modern React patterns and best practices',
            lessonCount: 12,
            color: 'cyan'
          },
          {
            id: 'typescript',
            name: 'TypeScript',
            description: 'Type-safe JavaScript development',
            lessonCount: 8,
            color: 'blue'
          },
          {
            id: 'backend',
            name: 'Backend Development',
            description: 'Server-side development with Node.js',
            lessonCount: 15,
            color: 'green'
          },
          {
            id: 'database',
            name: 'Database Design',
            description: 'SQL and NoSQL database concepts',
            lessonCount: 6,
            color: 'orange'
          },
          {
            id: 'devops',
            name: 'DevOps & Infrastructure',
            description: 'Deployment and infrastructure management',
            lessonCount: 9,
            color: 'purple'
          },
          {
            id: 'security',
            name: 'Web Security',
            description: 'Application security best practices',
            lessonCount: 7,
            color: 'red'
          },
          {
            id: 'design',
            name: 'UI/UX Design',
            description: 'User interface and experience design',
            lessonCount: 10,
            color: 'pink'
          },
          {
            id: 'testing',
            name: 'Testing',
            description: 'Unit, integration, and e2e testing',
            lessonCount: 5,
            color: 'yellow'
          },
          {
            id: 'performance',
            name: 'Performance',
            description: 'Web performance optimization',
            lessonCount: 4,
            color: 'indigo'
          }
        ]

        setCategories(categoriesData)
      } catch (err) {
        setError('Failed to load categories')
        console.error('Categories fetch error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [])

  const handleCategoryClick = (category: Category) => {
    if (onCategorySelect) {
      onCategorySelect(category.id)
    } else {
      // Default navigation behavior
      if (category.id === 'all') {
        navigate('/categories')
      } else {
        navigate(`/categories/${category.id}`)
      }
    }
    
    // Close mobile sidebar after selection
    if (isMobile && onClose) {
      onClose()
    }
  }

  const getCategoryIcon = (category: Category) => {
    // You can customize icons based on category type
    const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
      all: Hash,
      react: FolderOpen,
      typescript: FolderOpen,
      backend: FolderOpen,
      database: FolderOpen,
      devops: FolderOpen,
      security: FolderOpen,
      design: FolderOpen,
      testing: FolderOpen,
      performance: FolderOpen
    }
    
    const IconComponent = iconMap[category.id] || FolderOpen
    return IconComponent
  }

  const getCategoryColorClass = (color: string) => {
    const colorMap: { [key: string]: string } = {
      blue: 'text-blue-600 bg-blue-50 border-blue-200',
      cyan: 'text-cyan-600 bg-cyan-50 border-cyan-200',
      green: 'text-green-600 bg-green-50 border-green-200',
      orange: 'text-orange-600 bg-orange-50 border-orange-200',
      purple: 'text-purple-600 bg-purple-50 border-purple-200',
      red: 'text-red-600 bg-red-50 border-red-200',
      pink: 'text-pink-600 bg-pink-50 border-pink-200',
      yellow: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      indigo: 'text-indigo-600 bg-indigo-50 border-indigo-200'
    }
    
    return colorMap[color] || 'text-gray-600 bg-gray-50 border-gray-200'
  }

  const renderCategoryItem = (category: Category) => {
    const Icon = getCategoryIcon(category)
    const isActive = activeCategoryId === category.id
    const colorClass = category.color ? getCategoryColorClass(category.color) : ''

    return (
      <button
        key={category.id}
        onClick={() => handleCategoryClick(category)}
        className={cn(
          'w-full flex items-center justify-between p-3 rounded-lg text-left transition-all duration-200',
          'hover:bg-muted hover:shadow-sm',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'group',
          isActive && 'bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20'
        )}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Category Icon */}
          <div className={cn(
            'flex-shrink-0 p-2 rounded-md transition-colors',
            isActive 
              ? 'bg-primary-foreground/20' 
              : category.color 
                ? colorClass
                : 'bg-muted'
          )}>
            <Icon className={cn(
              'h-4 w-4',
              isActive 
                ? 'text-primary-foreground' 
                : category.color 
                  ? '' 
                  : 'text-muted-foreground'
            )} />
          </div>

          {/* Category Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className={cn(
                'font-medium text-sm truncate',
                isActive ? 'text-primary-foreground' : 'text-foreground'
              )}>
                {category.name}
              </h4>
              <Badge 
                variant={isActive ? 'secondary' : 'outline'} 
                className={cn(
                  'text-xs shrink-0',
                  isActive && 'bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30'
                )}
              >
                {category.lessonCount}
              </Badge>
            </div>
            <p className={cn(
              'text-xs mt-1 truncate',
              isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
            )}>
              {category.description}
            </p>
          </div>
        </div>

        {/* Arrow Icon */}
        <ChevronRight className={cn(
          'h-4 w-4 transition-transform shrink-0',
          'group-hover:translate-x-1',
          isActive ? 'text-primary-foreground' : 'text-muted-foreground'
        )} />
      </button>
    )
  }

  const renderContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">Categories</h2>
        </div>
        {isMobile && onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Categories List */}
      <div className="flex-1 p-4">
        {error ? (
          <div className="text-center py-8">
            <div className="text-sm text-destructive mb-2">Failed to load categories</div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-2">
              {isLoading ? (
                // Loading skeletons
                Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                      <Skeleton className="h-4 w-4" />
                    </div>
                  </div>
                ))
              ) : (
                categories.map(renderCategoryItem)
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Footer */}
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground text-center">
          {isLoading ? 'Loading...' : `${categories.length} categories available`}
        </p>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="w-80 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Categories</SheetTitle>
          </SheetHeader>
          {renderContent()}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <aside className={cn(
      'w-80 bg-background border-r shadow-sm',
      'hidden lg:flex flex-col',
      className
    )}>
      {renderContent()}
    </aside>
  )
}

// Export utility components
export const CategorySidebarSkeleton = () => (
  <div className="w-80 bg-background border-r p-4 space-y-3">
    <div className="flex items-center gap-2 mb-4">
      <Skeleton className="h-5 w-5" />
      <Skeleton className="h-5 w-24" />
    </div>
    {Array.from({ length: 8 }).map((_, index) => (
      <div key={index} className="p-3 rounded-lg border">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
          <Skeleton className="h-4 w-4" />
        </div>
      </div>
    ))}
  </div>
)

export const CategorySidebarTrigger = ({ 
  onClick, 
  className 
}: { 
  onClick: () => void
  className?: string 
}) => (
  <Button 
    variant="outline" 
    size="sm" 
    onClick={onClick}
    className={cn('lg:hidden', className)}
  >
    <FolderOpen className="h-4 w-4 mr-2" />
    Categories
  </Button>
)
