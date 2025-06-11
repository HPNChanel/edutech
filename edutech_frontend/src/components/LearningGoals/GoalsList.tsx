import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Calendar, CheckCircle2, Trash2 } from 'lucide-react'
import { format, isToday, differenceInDays } from 'date-fns'
import { LearningGoal, learningGoalsService } from '@/services/learningGoalsService'
import { toast } from 'sonner'


interface GoalsListProps {
  goals: LearningGoal[]
  onGoalUpdated: () => void
  className?: string
}

export default function GoalsList({ goals, onGoalUpdated, className }: GoalsListProps) {
  const [loadingGoals, setLoadingGoals] = useState<Set<number>>(new Set())

  const handleToggleComplete = async (goal: LearningGoal) => {
    if (loadingGoals.has(goal.id)) return

    setLoadingGoals(prev => new Set(prev).add(goal.id))
    try {
      if (goal.is_completed) {
        // Update to mark as incomplete
        await learningGoalsService.updateGoal(goal.id, { is_completed: false })
        toast.success('Goal marked as incomplete')
      } else {
        // Complete the goal
        await learningGoalsService.completeGoal(goal.id)
        toast.success('Congratulations! Goal completed! 🎉')
      }
      onGoalUpdated()
    } catch (error) {
      console.error('Error updating goal:', error)
      toast.error('Failed to update goal. Please try again.')
    } finally {
      setLoadingGoals(prev => {
        const newSet = new Set(prev)
        newSet.delete(goal.id)
        return newSet
      })
    }
  }

  const handleDeleteGoal = async (goalId: number, goalTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${goalTitle}"? This action cannot be undone.`)) {
      return
    }

    try {
      await learningGoalsService.deleteGoal(goalId)
      toast.success('Goal deleted successfully')
      onGoalUpdated()
    } catch (error) {
      console.error('Error deleting goal:', error)
      toast.error('Failed to delete goal. Please try again.')
    }
  }

  const getTargetDateInfo = (targetDate: string) => {
    const date = new Date(targetDate)
    const daysLeft = differenceInDays(date, new Date())
    
    if (isToday(date)) {
      return { text: 'Due today', variant: 'destructive' as const }
    } else if (daysLeft < 0) {
      return { text: `${Math.abs(daysLeft)} days overdue`, variant: 'destructive' as const }
    } else if (daysLeft <= 3) {
      return { text: `${daysLeft} days left`, variant: 'secondary' as const }
    } else {
      return { text: `${daysLeft} days left`, variant: 'outline' as const }
    }
  }

  if (goals.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="pt-6 text-center text-muted-foreground">
          No learning goals yet. Create your first goal to get started!
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {goals.map((goal) => {
        const isLoading = loadingGoals.has(goal.id)
        const targetDateInfo = goal.target_date ? getTargetDateInfo(goal.target_date) : null

        return (
          <Card key={goal.id} className="transition-all hover:shadow-md">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={goal.is_completed}
                  onCheckedChange={() => handleToggleComplete(goal)}
                  disabled={isLoading}
                  className="mt-1"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium ${goal.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                        {goal.title}
                      </h3>
                      {goal.description && (
                        <p className={`text-sm mt-1 ${goal.is_completed ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                          {goal.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {goal.is_completed && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteGoal(goal.id, goal.title)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {goal.target_date && targetDateInfo && (
                    <div className="flex items-center gap-2 mt-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Due {format(new Date(goal.target_date), 'MMM d, yyyy')}
                      </span>
                      <Badge variant={targetDateInfo.variant}>
                        {targetDateInfo.text}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
} 