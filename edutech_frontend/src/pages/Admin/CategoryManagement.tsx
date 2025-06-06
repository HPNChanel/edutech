import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  FolderOpen,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  BookOpen
} from 'lucide-react'

interface Category {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  lessonCount: number
}

interface CategoryFormData {
  name: string
  description: string
}

interface FormErrors {
  name?: string
  description?: string
  general?: string
}

interface FeedbackMessage {
  type: 'success' | 'error'
  message: string
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null)

  const [createForm, setCreateForm] = useState<CategoryFormData>({
    name: '',
    description: ''
  })

  const [editForm, setEditForm] = useState<CategoryFormData>({
    name: '',
    description: ''
  })

  const [createErrors, setCreateErrors] = useState<FormErrors>({})
  const [editErrors, setEditErrors] = useState<FormErrors>({})

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setIsLoading(true)
      
      // Simulate API call - replace with actual endpoint
      // const response = await fetch('/api/admin/categories')
      // const categoriesData = await response.json()
      
      const categoriesData: Category[] = [
        {
          id: '1',
          name: 'React Development',
          description: 'Modern React development with hooks, patterns, and best practices',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
          lessonCount: 12
        },
        {
          id: '2',
          name: 'TypeScript',
          description: 'Type-safe JavaScript development with TypeScript',
          createdAt: '2024-01-12T14:30:00Z',
          updatedAt: '2024-01-12T14:30:00Z',
          lessonCount: 8
        },
        {
          id: '3',
          name: 'Backend Development',
          description: 'Server-side development with Node.js, APIs, and databases',
          createdAt: '2024-01-10T09:15:00Z',
          updatedAt: '2024-01-16T11:20:00Z',
          lessonCount: 15
        },
        {
          id: '4',
          name: 'Database Design',
          description: 'Relational and NoSQL database design and optimization',
          createdAt: '2024-01-08T16:45:00Z',
          updatedAt: '2024-01-08T16:45:00Z',
          lessonCount: 6
        },
        {
          id: '5',
          name: 'DevOps',
          description: 'Deployment, CI/CD, and infrastructure management',
          createdAt: '2024-01-05T13:20:00Z',
          updatedAt: '2024-01-14T10:30:00Z',
          lessonCount: 9
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

  const validateForm = (formData: CategoryFormData, setErrors: (errors: FormErrors) => void): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Category name must be at least 2 characters'
    } else if (categories.some(cat => cat.name.toLowerCase() === formData.name.toLowerCase() && cat.id !== editingCategory?.id)) {
      newErrors.name = 'Category name already exists'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCreateInputChange = (field: keyof CategoryFormData, value: string) => {
    setCreateForm(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (createErrors[field]) {
      setCreateErrors(prev => ({
        ...prev,
        [field]: undefined
      }))
    }
  }

  const handleEditInputChange = (field: keyof CategoryFormData, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (editErrors[field]) {
      setEditErrors(prev => ({
        ...prev,
        [field]: undefined
      }))
    }
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm(createForm, setCreateErrors)) return

    setIsSubmitting(true)
    setFeedback(null)

    try {
      // API call to create category
      // const response = await fetch('/api/admin/categories', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(createForm)
      // })
      // const newCategory = await response.json()

      console.log('Creating category:', createForm)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newCategory: Category = {
        id: Date.now().toString(),
        name: createForm.name.trim(),
        description: createForm.description.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lessonCount: 0
      }

      setCategories(prev => [newCategory, ...prev])
      setCreateForm({ name: '', description: '' })
      setIsCreateDialogOpen(false)
      
      setFeedback({
        type: 'success',
        message: 'Category created successfully'
      })
      
    } catch (error) {
      setFeedback({
        type: 'error',
        message: 'Failed to create category. Please try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditClick = (category: Category) => {
    setEditingCategory(category)
    setEditForm({
      name: category.name,
      description: category.description
    })
    setEditErrors({})
    setIsEditDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingCategory || !validateForm(editForm, setEditErrors)) return

    setIsSubmitting(true)
    setFeedback(null)

    try {
      // API call to update category
      // const response = await fetch(`/api/admin/categories/${editingCategory.id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(editForm)
      // })
      // const updatedCategory = await response.json()

      console.log('Updating category:', editingCategory.id, editForm)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const updatedCategory: Category = {
        ...editingCategory,
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        updatedAt: new Date().toISOString()
      }

      setCategories(prev => prev.map(cat => 
        cat.id === editingCategory.id ? updatedCategory : cat
      ))
      
      setIsEditDialogOpen(false)
      setEditingCategory(null)
      
      setFeedback({
        type: 'success',
        message: 'Category updated successfully'
      })
      
    } catch (error) {
      setFeedback({
        type: 'error',
        message: 'Failed to update category. Please try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = async (category: Category) => {
    if (category.lessonCount > 0) {
      setFeedback({
        type: 'error',
        message: `Cannot delete category "${category.name}" because it contains ${category.lessonCount} lessons. Move or delete the lessons first.`
      })
      return
    }

    if (!confirm(`Are you sure you want to delete the category "${category.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      // API call to delete category
      // await fetch(`/api/admin/categories/${category.id}`, {
      //   method: 'DELETE'
      // })

      console.log('Deleting category:', category.id)
      
      setCategories(prev => prev.filter(cat => cat.id !== category.id))
      
      setFeedback({
        type: 'success',
        message: 'Category deleted successfully'
      })
      
    } catch (error) {
      setFeedback({
        type: 'error',
        message: 'Failed to delete category. Please try again.'
      })
    }
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

  // Auto-hide feedback after 5 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [feedback])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading categories...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <FolderOpen className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-gray-900">Manage Categories</h1>
        </div>
        <p className="text-muted-foreground">
          Create, edit, and organize lesson categories for better content management.
        </p>
      </div>

      {/* Feedback Messages */}
      {feedback && (
        <Alert variant={feedback.type === 'error' ? 'destructive' : 'default'}>
          {feedback.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertDescription>{feedback.message}</AlertDescription>
        </Alert>
      )}

      {/* Create Category Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Categories ({categories.length})</CardTitle>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Category
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Category</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-name" className="text-sm font-medium">
                      Category Name *
                    </Label>
                    <Input
                      id="create-name"
                      value={createForm.name}
                      onChange={(e) => handleCreateInputChange('name', e.target.value)}
                      placeholder="Enter category name"
                      className={createErrors.name ? 'border-red-500' : ''}
                      disabled={isSubmitting}
                    />
                    {createErrors.name && (
                      <p className="text-sm text-red-500">{createErrors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-description" className="text-sm font-medium">
                      Description *
                    </Label>
                    <Textarea
                      id="create-description"
                      value={createForm.description}
                      onChange={(e) => handleCreateInputChange('description', e.target.value)}
                      placeholder="Enter category description"
                      rows={3}
                      className={createErrors.description ? 'border-red-500' : ''}
                      disabled={isSubmitting}
                    />
                    {createErrors.description && (
                      <p className="text-sm text-red-500">{createErrors.description}</p>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Creating...' : 'Create Category'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No categories yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first category to start organizing lessons.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Lessons</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">
                        {category.name}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="truncate" title={category.description}>
                          {category.description}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {category.lessonCount}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(category.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {category.updatedAt !== category.createdAt 
                          ? formatDate(category.updatedAt)
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(category)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(category)}
                            className="text-red-600 hover:text-red-700"
                            disabled={category.lessonCount > 0}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-sm font-medium">
                  Category Name *
                </Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => handleEditInputChange('name', e.target.value)}
                  placeholder="Enter category name"
                  className={editErrors.name ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                />
                {editErrors.name && (
                  <p className="text-sm text-red-500">{editErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description" className="text-sm font-medium">
                  Description *
                </Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => handleEditInputChange('description', e.target.value)}
                  placeholder="Enter category description"
                  rows={3}
                  className={editErrors.description ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                />
                {editErrors.description && (
                  <p className="text-sm text-red-500">{editErrors.description}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Update Category'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
