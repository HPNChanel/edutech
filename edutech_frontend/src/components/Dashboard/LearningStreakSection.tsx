import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Flame, Clock, Focus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'


interface LearningStreakData {
  streak: number
  monthlyTime: {
    total_minutes: number
    formatted_time: string
  }
}

export default function LearningStreakSection() {
  const [data, setData] = useState<LearningStreakData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // For now, we'll use placeholder data since we need to add these endpoints to the dashboard service
        // TODO: Implement actual API calls for streak and monthly time
        const mockData: LearningStreakData = {
          streak: 3,
          monthlyTime: {
            total_minutes: 275,
            formatted_time: "4h 35min"
          }
        }
        
        // Simulate API delay
        setTimeout(() => {
          setData(mockData)
          setIsLoading(false)
        }, 500)
        
      } catch (err) {
        console.error('Error fetching learning streak data:', err)
        setError('Failed to load learning data')
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleStartPomodoro = () => {
    navigate('/focus')
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          <p>{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.reload()}
            className="mt-2"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Learning Streak & Time
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-6 w-48" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-6 w-40" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        ) : data ? (
          <>
            {/* Learning Streak */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-orange-500 rounded-full">
                <Flame className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Consecutive learning days</p>
                <p className="font-semibold text-lg">
                  🔥 {data.streak} consecutive days
                </p>
              </div>
            </div>

            {/* Learning Time */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total learning time this month</p>
                <p className="font-semibold text-lg">
                  🕒 {data.monthlyTime.formatted_time}
                </p>
              </div>
            </div>

            {/* Start Pomodoro Button */}
            <Button 
              onClick={handleStartPomodoro}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              size="lg"
            >
              <Focus className="h-5 w-5 mr-2" />
              Start Pomodoro
            </Button>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
} 