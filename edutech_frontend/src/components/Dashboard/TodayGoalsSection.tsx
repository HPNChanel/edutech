import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Target } from 'lucide-react'
import { LearningGoal, learningGoalsService } from '@/services/learningGoalsService'
import GoalsList from '@/components/LearningGoals/GoalsList'
import CreateGoalDialog from '@/components/LearningGoals/CreateGoalDialog'

export default function TodayGoalsSection() {
  const [goals, setGoals] = useState<LearningGoal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGoals = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const todayGoals = await learningGoalsService.getTodayGoals()
      setGoals(todayGoals)
    } catch (err) {
      console.error('Error fetching today\'s goals:', err)
      setError('Failed to load goals')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchGoals()
  }, [])

  const handleGoalUpdated = () => {
    fetchGoals()
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Today's Learning Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p>{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          Today's Learning Goals
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        ) : goals.length > 0 ? (
          <GoalsList 
            goals={goals} 
            onGoalUpdated={handleGoalUpdated}
          />
        ) : (
          <div className="text-center py-6">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No goals for today</h3>
            <p className="text-muted-foreground mb-4">
              Set your learning goals to stay motivated and track your progress.
            </p>
            <CreateGoalDialog onGoalCreated={handleGoalUpdated} />
          </div>
        )}
      </CardContent>
    </Card>
  )
} 