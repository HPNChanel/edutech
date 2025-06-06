import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { categoryService, Category, CreateCategoryData } from '@/services/categoryService'
import { 
  Search, 
  Plus, 
  BookOpen, 
  StickyNote,
  Calendar,
  FolderOpen,
  RefreshCw,
  AlertTriangle,
  Folder
} from 'lucide-react'

interface CategoriesPageState {
  categories: Category[]
  filteredCategories: Category[]
  isLoading: boolean
  error: string | null
  searchQuery: string
  isCreateDialogOpen: boolean
  isCreating: boolean
}

export default function CategoriesPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [state, setState] = useState<CategoriesPageState>({
    categories: [],
    filteredCategories: [],
    isLoading: true,
    error: null,
    searchQuery: '',
    isCreateDialogOpen: false,
    isCreating: false
  })

  const [createForm, setCreateForm] = useState<CreateCategoryData>({
    name: '',
    description: ''
  })

  const fetchCategories = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const categoriesData = await categoryService.getCategories()
      console.log('Categories loaded:', categoriesData) // Debug log
      
      setState(prev => ({
        ...prev,
        categories: categoriesData,
        filteredCategories: categoriesData,
        isLoading: false
      }))

    } catch (error: any) {
      console.error('Categories fetch error:', error)
      
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to load categories',
        isLoading: false
      }))
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // Filter categories based on search query
  useEffect(() => {
    const filtered = state.categories.filter(category =>
      category.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      category.description?.toLowerCase().includes(state.searchQuery.toLowerCase())
    )
    
    setState(prev => ({ ...prev, filteredCategories: filtered }))
  }, [state.searchQuery, state.categories])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, searchQuery: e.target.value }))
  }

  const handleCreateCategory = async () => {
    if (!createForm.name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive"
      })
      return
    }

    setState(prev => ({ ...prev, isCreating: true }))

    try {
      const newCategory = await categoryService.createCategory(createForm)

      setState(prev => ({
        ...prev,
        categories: [newCategory, ...prev.categories],
        isCreateDialogOpen: false,
        isCreating: false
      }))

      setCreateForm({ name: '', description: '' })

      toast({
        title: "Success",
        description: "Category created successfully!"
      })

    } catch (error: any) {
      console.error('Create category error:', error)
      
      setState(prev => ({ ...prev, isCreating: false }))
      
      toast({
        title: "Error",
        description: error.message || "Failed to create category",
        variant: "destructive"
      })
    }
  }

  const handleCategoryClick = (categoryId: number) => {
    navigate(`/categories/${categoryId}`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (state.isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Search and Create Button Skeleton */}
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Categories Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{state.error}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchCategories}
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
          <FolderOpen className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
        </div>
        <p className="text-muted-foreground">
          Organize your lessons into categories. Create, manage, and explore your learning content.
        </p>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={state.searchQuery}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchCategories}
            className="shrink-0"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={state.isCreateDialogOpen} onOpenChange={(open) => setState(prev => ({ ...prev, isCreateDialogOpen: open }))}>
            <DialogTrigger asChild>
              <Button className="shrink-0">
                <Plus className="h-4 w-4 mr-2" />
                Create Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category-name">Name *</Label>
                  <Input
                    id="category-name"
                    placeholder="Enter category name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category-description">Description</Label>
                  <Textarea
                    id="category-description"
                    placeholder="Enter category description"
                    value={createForm.description}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setState(prev => ({ ...prev, isCreateDialogOpen: false }))}
                    disabled={state.isCreating}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateCategory}
                    disabled={state.isCreating || !createForm.name.trim()}
                  >
                    {state.isCreating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Category'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Categories Grid */}
      {state.filteredCategories.length === 0 ? (
        <div className="text-center py-12">
          {state.searchQuery ? (
            <>
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No categories found</h3>
              <p className="text-muted-foreground mb-4">
                No categories match your search criteria. Try adjusting your search terms.
              </p>
              <Button 
                variant="outline"
                onClick={() => setState(prev => ({ ...prev, searchQuery: '' }))}
              >
                Clear Search
              </Button>
            </>
          ) : (
            <>
              <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No categories yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first category to start organizing your lessons.
              </p>
              <Button onClick={() => setState(prev => ({ ...prev, isCreateDialogOpen: true }))}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Category
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {state.filteredCategories.length} categor{state.filteredCategories.length !== 1 ? 'ies' : 'y'} found
              {state.searchQuery && ` for "${state.searchQuery}"`}
            </p>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {state.filteredCategories.map((category) => (
              <Card 
                key={category.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleCategoryClick(category.id)}
              >
                <CardHeader>
                  <div className="space-y-2">
                    <CardTitle className="flex items-center gap-2">
                      <Folder className="h-5 w-5 text-primary" />
                      {category.name}
                    </CardTitle>
                    {category.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {category.description}
                      </p>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {category.lesson_count || 0} lessons
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(category.created_at)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
