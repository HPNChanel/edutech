import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { lessonService, Lesson } from '@/services/lessonService'
import { categoryService, Category } from '@/services/categoryService'
import { 
  Search, 
  Plus,
  Calendar, 
  BookOpen, 
  Folder,
  RefreshCw,
  AlertTriangle,
  FileText,
  Eye,
  Edit,
  Filter
} from 'lucide-react'

interface MyLessonsPageState {
  lessons: Lesson[]
  categories: Category[]
  filteredLessons: Lesson[]
  isLoading: boolean
  isLoadingCategories: boolean
  error: string | null
  searchQuery: string
  selectedCategory: string
  sortBy: 'title' | 'created_at' | 'updated_at'
  sortOrder: 'asc' | 'desc'
}

export default function MyLessonsPage() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [state, setState] = useState<MyLessonsPageState>({
    lessons: [],
    categories: [],
    filteredLessons: [],
    isLoading: true,
    isLoadingCategories: true,
    error: null,
    searchQuery: '',
    selectedCategory: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  })

  // Fetch lessons and categories on mount
  useEffect(() => {
    Promise.all([
      fetchLessons(),
      fetchCategories()
    ])
  }, [])

  // Filter and sort lessons when dependencies change
  useEffect(() => {
    filterAndSortLessons()
  }, [state.lessons, state.searchQuery, state.selectedCategory, state.sortBy, state.sortOrder])

  const fetchLessons = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const lessons = await lessonService.getMyLessons({
        search: state.searchQuery || undefined,
        categoryId: state.selectedCategory ? parseInt(state.selectedCategory) : undefined,
        limit: 100
      })
      
      setState(prev => ({ ...prev, lessons, isLoading: false }))
    } catch (error: any) {
      console.error('Failed to fetch lessons:', error)
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to load lessons', 
        isLoading: false 
      }))
    }
  }

  const fetchCategories = async () => {
    try {
      setState(prev => ({ ...prev, isLoadingCategories: true }))
      const categories = await categoryService.getCategories()
      setState(prev => ({ ...prev, categories, isLoadingCategories: false }))
    } catch (error: any) {
      console.error('Failed to fetch categories:', error)
      setState(prev => ({ ...prev, isLoadingCategories: false }))
    }
  }

  const filterAndSortLessons = () => {
    let filtered = [...state.lessons]

    // Apply search filter
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase()
      filtered = filtered.filter(lesson =>
        lesson.title.toLowerCase().includes(query) ||
        lesson.summary?.toLowerCase().includes(query) ||
        lesson.content?.toLowerCase().includes(query) ||
        lesson.category?.name.toLowerCase().includes(query)
      )
    }

    // Apply category filter
    if (state.selectedCategory) {
      const categoryId = parseInt(state.selectedCategory)
      filtered = filtered.filter(lesson => lesson.category_id === categoryId)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (state.sortBy) {
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'created_at':
          aValue = new Date(a.created_at)
          bValue = new Date(b.created_at)
          break
        case 'updated_at':
          aValue = new Date(a.updated_at)
          bValue = new Date(b.updated_at)
          break
        default:
          return 0
      }

      if (state.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    setState(prev => ({ ...prev, filteredLessons: filtered }))
  }

  const handleSearchChange = (query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }))
  }

  const handleCategoryChange = (categoryId: string) => {
    setState(prev => ({ ...prev, selectedCategory: categoryId }))
  }

  const handleSortChange = (sortBy: string) => {
    setState(prev => ({ 
      ...prev, 
      sortBy: sortBy as typeof state.sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc'
    }))
  }

  const handleLessonClick = (lessonId: number) => {
    navigate(`/lessons/${lessonId}`)
  }

  const handleRefresh = async () => {
    await Promise.all([fetchLessons(), fetchCategories()])
    toast({
      title: "Refreshed",
      description: "Lessons and categories have been updated.",
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCategoryName = (categoryId?: number) => {
    if (!categoryId) return 'Uncategorized'
    const category = state.categories.find(cat => cat.id === categoryId)
    return category?.name || 'Unknown Category'
  }

  const LessonCard = ({ lesson }: { lesson: Lesson }) => (
    <Link 
      to={`/lessons/${lesson.id}`}
      className="block transition-transform hover:scale-105 focus:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
    >
      <Card 
        className="hover:shadow-md transition-shadow cursor-pointer h-full"
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                {lesson.title}
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  <Folder className="h-3 w-3 mr-1" />
                  {getCategoryName(lesson.category_id)}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDate(lesson.created_at)}
                </Badge>
              </div>
            </div>
            <BookOpen className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {lesson.summary && (
            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
              {lesson.summary}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {lesson.content && (
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {lesson.content.length} chars
                </span>
              )}
              {lesson.updated_at !== lesson.created_at && (
                <span>Updated {formatDate(lesson.updated_at)}</span>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  navigate(`/lessons/${lesson.id}`)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    e.stopPropagation()
                    navigate(`/lessons/${lesson.id}`)
                  }
                }}
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  navigate(`/lessons/${lesson.id}/edit`)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    e.stopPropagation()
                    navigate(`/lessons/${lesson.id}/edit`)
                  }
                }}
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )

  const renderFiltersAndSort = () => (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Category Filter */}
      <Select value={state.selectedCategory} onValueChange={(value) => setState(prev => ({ ...prev, selectedCategory: value }))}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {state.categories
            .filter(category => category.id && category.name) // Filter out invalid items
            .map((category) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>

      {/* Sort Options */}
      <Select value={`${state.sortBy}-${state.sortOrder}`} onValueChange={(value) => {
        const [sortBy, sortOrder] = value.split('-') as [typeof state.sortBy, typeof state.sortOrder]
        setState(prev => ({ ...prev, sortBy, sortOrder }))
      }}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="title-asc">Title A-Z</SelectItem>
          <SelectItem value="title-desc">Title Z-A</SelectItem>
          <SelectItem value="created_at-desc">Newest First</SelectItem>
          <SelectItem value="created_at-asc">Oldest First</SelectItem>
          <SelectItem value="updated_at-desc">Recently Updated</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )

  if (state.error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{state.error}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              className="ml-4"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-gray-900">My Lessons</h1>
        </div>
        <p className="text-muted-foreground">
          Manage and organize your lesson collection. Create, edit, and track your learning content.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search lessons..."
            value={state.searchQuery}
            onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/lessons/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Lesson
          </Button>
        </div>
      </div>

      {/* Filters and Sort */}
      <div>{renderFiltersAndSort()}</div>

      {/* Content */}
      {state.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : state.filteredLessons.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {state.searchQuery || state.selectedCategory ? 'No lessons found' : 'No lessons yet'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {state.searchQuery || state.selectedCategory 
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first lesson to get started with your learning journey'
              }
            </p>
            {!state.searchQuery && !state.selectedCategory && (
              <Button asChild>
                <Link to="/lessons/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Lesson
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {state.filteredLessons.map((lesson) => (
            <div key={lesson.id} className="group">
              <LessonCard lesson={lesson} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
