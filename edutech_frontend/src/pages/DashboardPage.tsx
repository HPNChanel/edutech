import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useCurrentUser } from '@/hooks/useAuth'
import { dashboardService, DashboardStats } from '@/services/dashboardService'
import { getPersonalizedWelcome } from '@/utils/timeGreeting'
import MiniChatInterface from '@/components/Chat/MiniChatInterface'
import LearningStreakSection from '@/components/Dashboard/LearningStreakSection'
import TodayGoalsSection from '@/components/Dashboard/TodayGoalsSection'
import { PersonalizedLearning } from '@/components/PersonalizedLearning'
import { 
  BookOpen, 
  Award, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Quote
} from 'lucide-react'

export default function DashboardPage() {
  const { user } = useCurrentUser()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Fetch dashboard statistics - now returns fallback data on error
        const dashboardStats = await dashboardService.getDashboardStats()
        setStats(dashboardStats)

        // For now, we don't need course data since we removed those sections

      } catch (err: unknown) {
        console.error('Dashboard data fetch error:', err)
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        // Only set error for authentication issues
        if (errorMessage.includes('Authentication required')) {
          setError(errorMessage)
        } else {
          // For other errors, just log and continue with empty state
          console.warn('Dashboard loaded with limited data due to:', errorMessage)
          setStats({
            user: { name: user?.name || "User", currentStreak: 0, totalHours: 0, joinedDate: new Date().toISOString() },
            learning: { totalCourses: 0, completedCourses: 0, inProgressCourses: 0, totalLessons: 0, completedLessons: 0, averageProgress: 0, todayProgress: 0, weeklyGoal: 100, weeklyProgress: 0 },
            achievements: { totalAchievements: 0, recentAchievements: [] },
            activity: { dailyActivity: [], weeklyStats: { totalTime: 0, lessonsCompleted: 0, averageDaily: 0, streak: 0, improvement: 0 }, monthlyStats: { totalTime: 0, coursesCompleted: 0, lessonsCompleted: 0, averageDaily: 0, topCategories: [] } }
          })
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [user?.name])



  const handleRetry = () => {
    window.location.reload()
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetry}
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

  // Get personalized welcome message
  const { greeting, quote } = getPersonalizedWelcome(user?.name)

  return (
    <div className="space-y-6">
      {/* Enhanced Welcome Header */}
      <div className="relative overflow-hidden">
        <Card className="relative border-none bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <CardContent className="p-8">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-80" />
                <Skeleton className="h-6 w-96" />
                <Skeleton className="h-4 w-64" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-yellow-500" />
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {greeting}
                    </h1>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 mb-6">
                  <Quote className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                  <p className="text-lg text-muted-foreground italic font-medium">
                    "{quote}"
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="text-sm">
                    <Clock className="h-3 w-3 mr-1" />
                    {stats?.user.currentStreak || 0} day streak
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    <Award className="h-3 w-3 mr-1" />
                    {stats?.learning.completedCourses || 0} courses completed
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    <BookOpen className="h-3 w-3 mr-1" />
                    {stats?.user.totalHours || 0} hours learned
                  </Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - New Sections */}
        <div className="lg:col-span-2 space-y-6">
          {/* Learning Streak & Time Section */}
          <LearningStreakSection />

          {/* Today's Learning Goals Section */}
          <TodayGoalsSection />

          {/* AI Personalized Learning Suggestions */}
          <PersonalizedLearning />
        </div>

        {/* Right Column - AI Assistant */}
        <div className="lg:col-span-1">
          <MiniChatInterface />
        </div>
      </div>
    </div>
  )
}
