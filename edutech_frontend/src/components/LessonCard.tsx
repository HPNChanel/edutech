import { forwardRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { 
  Clock, 
  Calendar, 
  User, 
  PlayCircle, 
  CheckCircle, 
  BookOpen,
  RotateCcw,
  Star
} from 'lucide-react'

interface LessonCardProps {
  id: string
  title: string
  summary?: string
  description?: string
  duration?: number // in minutes
  createdAt?: string
  updatedAt?: string
  author?: string
  category?: string
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced'
  progress?: number // 0-100 percentage
  isCompleted?: boolean
  isBookmarked?: boolean
  rating?: number // 1-5 stars
  totalRatings?: number
  thumbnail?: string
  tags?: string[]
  onClick?: () => void
  onBookmarkToggle?: () => void
  className?: string
  variant?: 'default' | 'compact' | 'featured'
  showProgress?: boolean
  showMetadata?: boolean
  actionText?: string
  disabled?: boolean
}

const LessonCard = forwardRef<HTMLDivElement, LessonCardProps>(({
  id,
  title,
  summary,
  description,
  duration,
  createdAt,
  updatedAt,
  author,
  category,
  difficulty = 'Beginner',
  progress = 0,
  isCompleted = false,
  isBookmarked = false,
  rating,
  totalRatings,
  thumbnail,
  tags = [],
  onClick,
  onBookmarkToggle,
  className,
  variant = 'default',
  showProgress = true,
  showMetadata = true,
  actionText,
  disabled = false,
  ...props
}, ref) => {
  
  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-100 text-green-800 border-green-200'
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Advanced': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getActionText = () => {
    if (actionText) return actionText
    if (isCompleted) return 'Review'
    if (progress > 0) return 'Continue'
    return 'Start Learning'
  }

  const getActionIcon = () => {
    if (isCompleted) return RotateCcw
    if (progress > 0) return PlayCircle
    return PlayCircle
  }

  const renderRating = () => {
    if (!rating) return null
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-medium">{rating.toFixed(1)}</span>
              {totalRatings && (
                <span className="text-xs text-muted-foreground">
                  ({totalRatings})
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{rating.toFixed(1)} out of 5 stars ({totalRatings} ratings)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  const cardClasses = cn(
    'group cursor-pointer transition-all duration-200',
    'hover:shadow-md hover:shadow-primary/10',
    'hover:border-primary/20',
    {
      'hover:bg-muted/5': !disabled,
      'opacity-60 cursor-not-allowed': disabled,
      'ring-2 ring-primary/20': isCompleted,
    },
    className
  )

  const ActionIcon = getActionIcon()

  if (variant === 'compact') {
    return (
      <Card 
        ref={ref}
        className={cardClasses}
        onClick={disabled ? undefined : onClick}
        {...props}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Thumbnail/Icon */}
            <div className="flex-shrink-0">
              {thumbnail ? (
                <img 
                  src={thumbnail} 
                  alt={title}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm truncate">{title}</h3>
                  {summary && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {summary}
                    </p>
                  )}
                  
                  {/* Metadata */}
                  {showMetadata && (
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(duration)}
                        </span>
                      )}
                      {difficulty && (
                        <Badge variant="outline" className={`text-xs ${getDifficultyColor(difficulty)}`}>
                          {difficulty}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Action */}
                <Button size="sm" variant="ghost" disabled={disabled}>
                  <ActionIcon className="h-4 w-4" />
                </Button>
              </div>

              {/* Progress */}
              {showProgress && progress > 0 && (
                <div className="mt-2">
                  <Progress value={progress} className="h-1" />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (variant === 'featured') {
    return (
      <Card 
        ref={ref}
        className={cn(cardClasses, 'overflow-hidden')}
        onClick={disabled ? undefined : onClick}
        {...props}
      >
        {/* Thumbnail */}
        {thumbnail && (
          <div className="aspect-video overflow-hidden">
            <img 
              src={thumbnail} 
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {category && (
                  <Badge variant="secondary" className="text-xs">
                    {category}
                  </Badge>
                )}
                <Badge variant="outline" className={`text-xs ${getDifficultyColor(difficulty)}`}>
                  {difficulty}
                </Badge>
                {isCompleted && (
                  <Badge className="text-xs bg-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
              
              <CardTitle className="text-lg leading-6 line-clamp-2">
                {title}
              </CardTitle>
            </div>

            {/* Bookmark */}
            {onBookmarkToggle && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onBookmarkToggle()
                }}
                className="flex-shrink-0"
              >
                <Star className={cn(
                  "h-4 w-4",
                  isBookmarked ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                )} />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Description */}
          {(summary || description) && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {summary || description}
            </p>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{tags.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {/* Metadata */}
          {showMetadata && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                {author && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {author}
                  </span>
                )}
                {duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(duration)}
                  </span>
                )}
              </div>
              
              {renderRating()}
            </div>
          )}

          {/* Progress */}
          {showProgress && progress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Date */}
          {showMetadata && createdAt && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {formatDate(createdAt)}
              {updatedAt && updatedAt !== createdAt && (
                <span> • Updated {formatDate(updatedAt)}</span>
              )}
            </div>
          )}

          {/* Action Button */}
          <Button 
            className="w-full" 
            disabled={disabled}
            variant={isCompleted ? "outline" : "default"}
          >
            <ActionIcon className="mr-2 h-4 w-4" />
            {getActionText()}
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Default variant
  return (
    <Card 
      ref={ref}
      className={cardClasses}
      onClick={disabled ? undefined : onClick}
      {...props}
    >
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {category && (
                <Badge variant="secondary" className="text-xs">
                  {category}
                </Badge>
              )}
              <Badge variant="outline" className={`text-xs ${getDifficultyColor(difficulty)}`}>
                {difficulty}
              </Badge>
              {isCompleted && (
                <Badge className="text-xs bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              )}
            </div>
            
            <CardTitle className="text-lg leading-6 line-clamp-2">
              {title}
            </CardTitle>
          </div>

          {/* Bookmark */}
          {onBookmarkToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onBookmarkToggle()
              }}
              className="flex-shrink-0"
            >
              <Star className={cn(
                "h-4 w-4",
                isBookmarked ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
              )} />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        {(summary || description) && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {summary || description}
          </p>
        )}

        {/* Metadata */}
        {showMetadata && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              {author && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {author}
                </span>
              )}
              {duration && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(duration)}
                </span>
              )}
            </div>
            
            {renderRating()}
          </div>
        )}

        {/* Progress */}
        {showProgress && progress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Date */}
        {showMetadata && createdAt && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {formatDate(createdAt)}
            {updatedAt && updatedAt !== createdAt && (
              <span> • Updated {formatDate(updatedAt)}</span>
            )}
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 4).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 4}
              </Badge>
            )}
          </div>
        )}

        {/* Action Button */}
        <Button 
          className="w-full" 
          disabled={disabled}
          variant={isCompleted ? "outline" : "default"}
        >
          <ActionIcon className="mr-2 h-4 w-4" />
          {getActionText()}
        </Button>
      </CardContent>
    </Card>
  )
})

LessonCard.displayName = 'LessonCard'

export default LessonCard

// Export additional utilities for external use
export const LessonCardSkeleton = () => (
  <Card className="animate-pulse">
    <CardHeader>
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="h-4 w-16 bg-muted rounded"></div>
          <div className="h-4 w-20 bg-muted rounded"></div>
        </div>
        <div className="h-6 bg-muted rounded w-3/4"></div>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <div className="h-3 bg-muted rounded"></div>
        <div className="h-3 bg-muted rounded w-2/3"></div>
      </div>
      <div className="h-2 bg-muted rounded"></div>
      <div className="h-9 bg-muted rounded"></div>
    </CardContent>
  </Card>
)

export const LessonCardGrid = ({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) => (
  <div className={cn(
    'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    className
  )}>
    {children}
  </div>
)
