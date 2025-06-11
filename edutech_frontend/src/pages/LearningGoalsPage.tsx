import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Target, Plus, CheckCircle2, Clock } from 'lucide-react'
import { LearningGoal, learningGoalsService } from '@/services/learningGoalsService'
import GoalsList from '@/components/LearningGoals/GoalsList'
import CreateGoalDialog from '@/components/LearningGoals/CreateGoalDialog'
import { Skeleton } from '@/components/ui/skeleton'

export default function LearningGoalsPage() {
  const [activeGoals, setActiveGoals] = useState<LearningGoal[]>([])
  const [completedGoals, setCompletedGoals] = useState<LearningGoal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGoals = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const [active, completed] = await Promise.all([
        learningGoalsService.getGoals(false), // Active goals
        learningGoalsService.getGoals(true)   // Completed goals
      ])
      
      setActiveGoals(active)
      setCompletedGoals(completed)
    } catch (err) {
      console.error('Error fetching goals:', err)
      setError('Failed to load learning goals')
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
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="pt-6 text-center">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Failed to Load Goals</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Target className="h-8 w-8 text-blue-600" />
              Learning Goals
            </h1>
            <p className="text-muted-foreground mt-2">
              Set and track your learning objectives to stay motivated and focused.
            </p>
          </div>
          <CreateGoalDialog onGoalCreated={handleGoalUpdated}>
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Add Goal
            </Button>
          </CreateGoalDialog>
        </div>

        {/* Stats Overview */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Goals</p>
                    <p className="text-2xl font-bold">{activeGoals.length}</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold">{completedGoals.length}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Goals</p>
                    <p className="text-2xl font-bold">{activeGoals.length + completedGoals.length}</p>
                  </div>
                  <Target className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Goals Tabs */}
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Active Goals
              {!isLoading && activeGoals.length > 0 && (
                <Badge variant="secondary">{activeGoals.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Completed
              {!isLoading && completedGoals.length > 0 && (
                <Badge variant="secondary">{completedGoals.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Active Learning Goals</span>
                  {!isLoading && activeGoals.length > 0 && (
                    <CreateGoalDialog onGoalCreated={handleGoalUpdated}>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Goal
                      </Button>
                    </CreateGoalDialog>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : activeGoals.length > 0 ? (
                  <GoalsList goals={activeGoals} onGoalUpdated={handleGoalUpdated} />
                ) : (
                  <div className="text-center py-12">
                    <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-medium mb-2">No active goals yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Create your first learning goal to start tracking your progress!
                    </p>
                    <CreateGoalDialog onGoalCreated={handleGoalUpdated}>
                      <Button size="lg">
                        <Plus className="h-5 w-5 mr-2" />
                        Create Your First Goal
                      </Button>
                    </CreateGoalDialog>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Completed Goals</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : completedGoals.length > 0 ? (
                  <GoalsList goals={completedGoals} onGoalUpdated={handleGoalUpdated} />
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle2 className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-medium mb-2">No completed goals yet</h3>
                    <p className="text-muted-foreground">
                      Keep working on your active goals to see them here when completed!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}