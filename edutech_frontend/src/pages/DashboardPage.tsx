import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth, useCurrentUser } from '@/hooks/useAuth'
import { dashboardService, DashboardStats, CourseRecommendation, CourseProgress } from '@/services/dashboardService'
import { 
  BookOpen, 
  Award, 
  Clock, 
  TrendingUp, 
  ArrowRight,
  PlayCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'

export default function DashboardPage() {
  const { user } = useCurrentUser()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [ongoingCourses, setOngoingCourses] = useState<CourseProgress[]>([])
  const [recommendations, setRecommendations] = useState<CourseRecommendation[]>([])
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

        // For now, set empty arrays since we don't have these endpoints yet
        setOngoingCourses([])
        setRecommendations([])

      } catch (err: any) {
        console.error('Dashboard data fetch error:', err)
        // Only set error for authentication issues
        if (err.message.includes('Authentication required')) {
          setError(err.message)
        } else {
          // For other errors, just log and continue with empty state
          console.warn('Dashboard loaded with limited data due to:', err.message)
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

  const getDifficultyColor = (difficulty: 'Beginner' | 'Intermediate' | 'Advanced') => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800'
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'Advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

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

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.name || 'Learner'}! 👋
            </h1>
            <p className="text-muted-foreground">
              Ready to continue your learning journey? Let's make today count!
            </p>
          </>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-muted-foreground">Total Courses</span>
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold">{stats?.learning.totalCourses || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Award className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-muted-foreground">Completed</span>
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold">{stats?.learning.completedCourses || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-muted-foreground">Hours Learned</span>
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold">{stats?.user.totalHours || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-muted-foreground">Current Streak</span>
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold">{stats?.user.currentStreak || 0} days</span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Continue Learning */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Continue Learning</h2>
          <Button variant="ghost" size="sm">
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-2 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : ongoingCourses.length > 0 ? (
            ongoingCourses.map((course) => (
              <Card key={course.courseId} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 line-clamp-1">
                          {course.courseTitle}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800`}>
                          {course.category.name}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        by {course.instructor}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{course.progress.percentage}%</span>
                      </div>
                      <Progress value={course.progress.percentage} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {course.progress.completedLessons} of {course.progress.totalLessons} lessons completed
                      </p>
                    </div>

                    <Button className="w-full" size="sm">
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Continue Learning
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-full">
              <CardContent className="pt-6 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No courses in progress</h3>
                <p className="text-muted-foreground mb-4">
                  Start learning by enrolling in a course below.
                </p>
                <Button>Browse Courses</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Recommended for You</h2>
          <Button variant="ghost" size="sm">
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-4">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="flex-shrink-0 w-80">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : recommendations.length > 0 ? (
            recommendations.map((recommendation) => (
              <Card key={recommendation.course.id} className="flex-shrink-0 w-80 hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">
                          {recommendation.course.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(recommendation.course.difficulty)}`}>
                          {recommendation.course.difficulty}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {recommendation.course.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {recommendation.course.totalLessons} lessons • {recommendation.course.duration}h
                      </p>
                      <p className="text-xs text-primary font-medium">
                        {recommendation.reason.title}
                      </p>
                    </div>

                    <Button className="w-full" variant="outline" size="sm">
                      Start Course
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="flex-shrink-0 w-full">
              <CardContent className="pt-6 text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No recommendations yet</h3>
                <p className="text-muted-foreground">
                  Complete more lessons to get personalized recommendations.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
