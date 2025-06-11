import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { 
  BookOpen, 
  Upload, 
  X, 
  FileText, 
  Eye, 
  Save,
  AlertCircle
} from 'lucide-react'
import { categoryService, Category } from '@/services/categoryService'
import { Lesson } from '@/services/lessonService'

interface LessonFormData {
  title: string
  selectedCategoryId: number | null
  summary: string
  content: string
}

interface AttachedFile {
  id: string
  name: string
  size: number
  type: string
  file: File
}

interface FormErrors {
  title?: string
  category?: string
  content?: string
  general?: string
}

interface LessonFormSubmitData {
  title: string
  category_id?: number
  summary?: string
  content: string
}

interface LessonFormProps {
  mode: 'create' | 'edit'
  initialData?: Lesson
  onSubmit: (data: LessonFormSubmitData) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function LessonForm({ mode, initialData, onSubmit, onCancel, isSubmitting = false }: LessonFormProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('content')
  const [showPreview, setShowPreview] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  
  const [formData, setFormData] = useState<LessonFormData>({
    title: initialData?.title || '',
    selectedCategoryId: initialData?.category_id || null,
    summary: initialData?.summary || '',
    content: initialData?.content || ''
  })

  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await categoryService.getCategories()
        setCategories(categoriesData)
      } catch (error) {
        console.error('Failed to load categories:', error)
        toast({
          title: "Warning",
          description: "Failed to load categories from server. Please refresh the page.",
          variant: "destructive"
        })
        setCategories([])
      }
    }

    loadCategories()
  }, [])

  // Update form data when initialData changes (for edit mode)
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        title: initialData.title || '',
        selectedCategoryId: initialData.category_id || null,
        summary: initialData.summary || '',
        content: initialData.content || ''
      })
    }
  }, [mode, initialData])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters'
    }

    if (!formData.selectedCategoryId) {
      newErrors.category = 'Category is required'
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required'
    } else if (formData.content.trim().length < 50) {
      newErrors.content = 'Content must be at least 50 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof LessonFormData, value: string | number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing/selecting
    if (field === 'selectedCategoryId' && errors.category) {
      setErrors(prev => ({
        ...prev,
        category: undefined
      }))
    } else if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }))
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: `${file.name} is larger than 10MB`,
        })
        return
      }

      const newFile: AttachedFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        file: file
      }

      setAttachedFiles(prev => [...prev, newFile])
    })

    // Clear the input
    event.target.value = ''
  }

  const removeFile = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(file => file.id !== fileId))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      // Create lesson data payload
      const lessonData = {
        title: formData.title.trim(),
        category_id: formData.selectedCategoryId || undefined,
        summary: formData.summary.trim() || undefined,
        content: formData.content.trim()
      }

      // Log category_id for debugging
      console.log(`${mode === 'create' ? 'Creating' : 'Updating'} lesson with category_id:`, lessonData.category_id)
      
      // Validate that category exists in our loaded categories
      if (lessonData.category_id) {
        const selectedCategory = categories.find(cat => cat.id === lessonData.category_id)
        if (!selectedCategory) {
          throw new Error('Selected category not found. Please refresh and try again.')
        }
        console.log('Selected category:', selectedCategory.name, 'with ID:', selectedCategory.id)
      }

      await onSubmit(lessonData)
      
      // If there are attached files, upload them separately
      if (attachedFiles.length > 0) {
        // TODO: Implement file upload to lesson
        console.log('Files to upload:', attachedFiles)
      }
      
    } catch (error: unknown) {
      console.error(`${mode === 'create' ? 'Create' : 'Update'} lesson error:`, error)
      setErrors({ general: error instanceof Error ? error.message : `Failed to ${mode} lesson` })
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${mode} lesson`,
        variant: "destructive"
      })
    }
  }

  // Get the selected category for preview display
  const selectedCategory = categories.find(cat => cat.id === formData.selectedCategoryId)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Lesson Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Lesson Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter an engaging lesson title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title}</p>
                )}
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                {categories.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No categories available. Please create a category first or refresh the page.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Select 
                    value={formData.selectedCategoryId?.toString() || ""} 
                    onValueChange={(value) => handleInputChange('selectedCategoryId', value ? parseInt(value) : null)}
                  >
                    <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        .filter(category => category && category.id && category.name?.trim().length > 0)
                        .map((category) => (
                          <SelectItem key={`category-${category.id}`} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
                {errors.category && (
                  <p className="text-sm text-red-500">{errors.category}</p>
                )}
                {!formData.selectedCategoryId && categories.length > 0 && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Please select a category before submitting
                  </p>
                )}
              </div>

              {/* Summary */}
              <div className="space-y-2">
                <Label htmlFor="summary">Lesson Summary</Label>
                <Textarea
                  id="summary"
                  placeholder="Brief description of what students will learn"
                  value={formData.summary}
                  onChange={(e) => handleInputChange('summary', e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Optional: A short summary that appears in lesson previews
                </p>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">Lesson Content *</Label>
                <Textarea
                  id="content"
                  placeholder="Write your lesson content here..."
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  rows={12}
                  className={cn(
                    'resize-none font-mono text-sm',
                    errors.content && 'border-red-500'
                  )}
                />
                {errors.content && (
                  <p className="text-sm text-red-500">{errors.content}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Write comprehensive content that will help students learn effectively
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lesson Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Additional settings coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="space-y-6">
          {/* File Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Attachments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Upload Area */}
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Upload lesson files</p>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOC, images, or other supporting materials (max 10MB each)
                  </p>
                </div>
                                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif"
                    aria-label="Upload lesson files"
                  />
              </div>

              {/* Attached Files List */}
              {attachedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Attached Files ({attachedFiles.length})</Label>
                  <div className="space-y-2">
                    {attachedFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form Actions */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPreview(true)}
            disabled={!formData.title && !formData.content}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || categories.length === 0}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {mode === 'create' ? 'Creating...' : 'Saving...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {mode === 'create' ? 'Create Lesson' : 'Save Changes'}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* General Error */}
      {errors.general && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700">
            {errors.general}
          </AlertDescription>
        </Alert>
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lesson Preview</DialogTitle>
            <DialogDescription>
              This is how your lesson will appear to students
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">{formData.title || 'Untitled Lesson'}</h2>
              {formData.summary && (
                <p className="text-muted-foreground mb-4">{formData.summary}</p>
              )}
              {selectedCategory && (
                <span className="inline-block px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                  {selectedCategory.name}
                </span>
              )}
            </div>
            
            <div className="prose max-w-none">
              <div className="lesson-content whitespace-pre-wrap bg-muted p-4 rounded-lg select-text cursor-text [&_*]:select-text [&_*]:pointer-events-auto [&_*]:cursor-text">
                {formData.content || 'No content yet...'}
              </div>
            </div>

            {attachedFiles.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Attachments</h3>
                <div className="space-y-1">
                  {attachedFiles.map((file) => (
                    <div key={file.id} className="text-sm text-muted-foreground">
                      📎 {file.name} ({formatFileSize(file.size)})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
} 