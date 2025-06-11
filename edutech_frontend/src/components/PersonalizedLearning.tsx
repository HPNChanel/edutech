import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Brain, 
  BookOpen, 
  Target, 
  TrendingUp, 
  Lightbulb,
  RefreshCw,
  Loader2,
  AlertCircle,
  Clock,
  User
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { aiAssistanceService, type PersonalizedLearningResponse } from '../services/aiAssistanceService'

interface PersonalizedLearningProps {
  className?: string
}

export const PersonalizedLearning: React.FC<PersonalizedLearningProps> = ({ 
  className = '' 
}) => {
  const [suggestions, setSuggestions] = useState<PersonalizedLearningResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const { toast } = useToast()

  const generateSuggestions = async () => {
    if (isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await aiAssistanceService.getPersonalizedLearning()
      setSuggestions(response)
      setLastUpdated(new Date())
      
      toast({
        title: "Learning Suggestions Updated",
        description: "Your personalized recommendations have been generated",
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate suggestions'
      setError(errorMessage)
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Load suggestions on component mount
  useEffect(() => {
    generateSuggestions()
  }, [])

  const formatLastUpdated = () => {
    if (!lastUpdated) return ''
    return lastUpdated.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const SuggestionSection: React.FC<{
    icon: React.ReactNode
    title: string
    content: string
    color: string
    badge?: string
  }> = ({ icon, title, content, color, badge }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className={`p-2 rounded-lg ${color}`}>
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-sm">{title}</h4>
          {badge && <Badge variant="secondary" className="text-xs">{badge}</Badge>}
        </div>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
          {content || 'No specific suggestions available at this time.'}
        </p>
      </div>
    </div>
  )

  return (
    <Card className={`${className} relative overflow-hidden`}>
      {/* Header */}
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Learning Coach</CardTitle>
              <p className="text-sm text-gray-600">
                Personalized recommendations based on your progress
              </p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={generateSuggestions}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isLoading ? 'Generating...' : 'Refresh'}
          </Button>
        </div>

        {lastUpdated && (
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
            <Clock className="h-3 w-3" />
            Last updated: {formatLastUpdated()}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Loading State */}
        {isLoading && !suggestions && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500 mb-3" />
            <p className="text-sm text-gray-600">
              Analyzing your learning data...
            </p>
            <p className="text-xs text-gray-500 mt-1">
              This may take a few moments
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-6">
            <div className="flex items-center justify-center gap-2 text-red-600 mb-3">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Unable to load suggestions</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generateSuggestions}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        )}

        {/* Suggestions Display */}
        {suggestions && !isLoading && (
          <div className="space-y-6">
            {/* Next Lesson Suggestion */}
            <SuggestionSection
              icon={<BookOpen className="h-4 w-4 text-white" />}
              title="Recommended Next Topic"
              content={suggestions.next_lesson_suggestion}
              color="bg-green-500"
              badge="Priority"
            />

            <Separator />

            {/* Learning Tips */}
            <SuggestionSection
              icon={<Lightbulb className="h-4 w-4 text-white" />}
              title="Learning Tips"
              content={suggestions.learning_tips}
              color="bg-yellow-500"
            />

            <Separator />

            {/* Knowledge Gaps */}
            <SuggestionSection
              icon={<Target className="h-4 w-4 text-white" />}
              title="Areas to Review"
              content={suggestions.knowledge_gaps}
              color="bg-red-500"
            />

            <Separator />

            {/* Progress Summary */}
            <SuggestionSection
              icon={<TrendingUp className="h-4 w-4 text-white" />}
              title="Your Progress"
              content={suggestions.user_progress_summary}
              color="bg-blue-500"
            />

            {/* AI Usage Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-700 text-xs">
                <User className="h-3 w-3" />
                <span className="font-medium">
                  AI Analysis • {suggestions.tokens_used} tokens used
                </span>
              </div>
              <p className="text-blue-600 text-xs mt-1">
                Suggestions are updated based on your latest learning activity
              </p>
            </div>
          </div>
        )}

        {/* First Time Message */}
        {!suggestions && !isLoading && !error && (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <h3 className="font-medium text-gray-900 mb-2">
              AI Learning Coach
            </h3>
            <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
              Get personalized learning recommendations based on your study history, goals, and performance.
            </p>
            <Button onClick={generateSuggestions} className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Get My Suggestions
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 