import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare, 
  FileText, 
  Languages, 
  HelpCircle, 
  X, 
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { aiAssistanceService, type AIInlineRequest, type AIInlineResponse } from '../services/aiAssistanceService'

interface AIInlineAssistantProps {
  selectedText: string
  lessonId: number
  lessonContext?: string
  position: { x: number; y: number }
  onClose: () => void
  onAssistanceGenerated?: (result: string, action: string) => void
}

type AssistanceAction = 'explanation' | 'summary' | 'translate_vi' | 'translate_en' | 'ask_questions'

interface ActionConfig {
  id: AssistanceAction
  label: string
  icon: React.ReactNode
  description: string
  color: string
}

const ASSISTANCE_ACTIONS: ActionConfig[] = [
  {
    id: 'explanation',
    label: 'Explanation',
    icon: <MessageSquare className="h-4 w-4" />,
    description: 'Get a detailed explanation of the selected text',
    color: 'bg-blue-500 hover:bg-blue-600'
  },
  {
    id: 'summary',
    label: 'Summary',
    icon: <FileText className="h-4 w-4" />,
    description: 'Get a concise summary of the main points',
    color: 'bg-green-500 hover:bg-green-600'
  },
  {
    id: 'translate_vi',
    label: 'Translate to Vietnamese',
    icon: <Languages className="h-4 w-4" />,
    description: 'Translate the text to Vietnamese',
    color: 'bg-purple-500 hover:bg-purple-600'
  },
  {
    id: 'translate_en',
    label: 'Translate to English',
    icon: <Languages className="h-4 w-4" />,
    description: 'Translate the text to English',
    color: 'bg-orange-500 hover:bg-orange-600'
  },
  {
    id: 'ask_questions',
    label: 'Study Questions',
    icon: <HelpCircle className="h-4 w-4" />,
    description: 'Generate questions to test your understanding',
    color: 'bg-indigo-500 hover:bg-indigo-600'
  }
]

export const AIInlineAssistant: React.FC<AIInlineAssistantProps> = ({
  selectedText,
  lessonId,
  lessonContext,
  position,
  onClose,
  onAssistanceGenerated
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [activeAction, setActiveAction] = useState<AssistanceAction | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const popupRef = useRef<HTMLDivElement>(null)

  // Debug logging
  useEffect(() => {
    console.log('AI Assistant mounted with:', {
      selectedText: selectedText.substring(0, 50) + '...',
      lessonId,
      position
    })
  }, [])

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  // Simplified positioning for debugging
  const calculatePosition = () => {
    console.log('Calculating position for:', position)
    
    // Simple positioning with small offset
    const calculatedPosition = {
      top: position.y + 10,
      left: position.x + 10
    }
    
    console.log('Calculated position:', calculatedPosition)
    return calculatedPosition
  }

  const handleActionClick = async (action: AssistanceAction) => {
    if (isLoading) return

    setIsLoading(true)
    setActiveAction(action)
    setError(null)
    setResult(null)

    try {
      const request: AIInlineRequest = {
        text: selectedText,
        action,
        lesson_id: lessonId,
        context: lessonContext
      }

      const response: AIInlineResponse = await aiAssistanceService.getInlineAssistance(request)
      
      setResult(response.result)
      onAssistanceGenerated?.(response.result, response.action)

      toast({
        title: "AI Assistance Generated",
        description: `${ASSISTANCE_ACTIONS.find(a => a.id === action)?.label} completed successfully`,
      })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate assistance'
      setError(errorMessage)
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
      setActiveAction(null)
    }
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
    setActiveAction(null)
  }

  const popupPosition = calculatePosition()

  return (
    <div
      ref={popupRef}
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl min-w-80 max-w-md max-h-96 overflow-y-auto"
      style={{
        top: `${popupPosition.top}px`,
        left: `${popupPosition.left}px`,
      }}
    >
      <Card className="border-0 shadow-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
              <CardTitle className="text-sm font-medium">AI Assistant</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Selected text preview */}
          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border-l-2 border-blue-200">
            <span className="font-medium">Selected: </span>
            {selectedText.length > 60 
              ? `${selectedText.substring(0, 60)}...` 
              : selectedText
            }
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {!result && !error && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 mb-3">
                Choose an AI assistance option:
              </p>
              
              <div className="space-y-2">
                {ASSISTANCE_ACTIONS.map((action) => (
                  <Button
                    key={action.id}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start h-auto p-3 hover:bg-gray-50"
                    onClick={() => handleActionClick(action.id)}
                    disabled={isLoading}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className={`p-1.5 rounded text-white ${action.color}`}>
                        {isLoading && activeAction === action.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          action.icon
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-sm">{action.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {action.description}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Results display */}
          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <Badge variant="secondary" className="text-xs">
                  {ASSISTANCE_ACTIONS.find(a => a.id === activeAction)?.label || 'Result'}
                </Badge>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-sm text-gray-800 whitespace-pre-wrap">
                  {result}
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleReset}
                  className="flex-1"
                >
                  Try Another
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={onClose}
                  className="flex-1"
                >
                  Done
                </Button>
              </div>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <Badge variant="destructive" className="text-xs">Error</Badge>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="text-sm text-red-800">
                  {error}
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleReset}
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={onClose}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="text-center py-4">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-500 mb-2" />
              <p className="text-sm text-gray-600">
                Generating {ASSISTANCE_ACTIONS.find(a => a.id === activeAction)?.label.toLowerCase()}...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 