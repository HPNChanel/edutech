import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'
import { CreateLearningGoal, learningGoalsService } from '@/services/learningGoalsService'
import { toast } from 'sonner'

interface CreateGoalDialogProps {
  onGoalCreated?: () => void
  className?: string
  children?: React.ReactNode
}

export default function CreateGoalDialog({ onGoalCreated, className, children }: CreateGoalDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<CreateLearningGoal>({
    title: '',
    description: '',
    target_date: undefined
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast.error('Goal title is required')
      return
    }

    setIsLoading(true)
    try {
      const goalData: CreateLearningGoal = {
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        target_date: formData.target_date || undefined
      }

      await learningGoalsService.createGoal(goalData)
      
      toast.success('Learning goal created successfully!')
      setOpen(false)
      setFormData({ title: '', description: '', target_date: undefined })
      onGoalCreated?.()
    } catch (error) {
      console.error('Error creating goal:', error)
      toast.error('Failed to create learning goal. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setFormData({ title: '', description: '', target_date: undefined })
    }
    setOpen(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button className={className}>
            <Plus className="h-4 w-4 mr-2" />
            Create Goal
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Learning Goal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Goal Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Complete JavaScript fundamentals course"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add more details about your goal..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_date">Target Date</Label>
            <Input
              id="target_date"
              type="date"
              value={formData.target_date || ''}
              onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Goal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 