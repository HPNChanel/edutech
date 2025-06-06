import * as React from "react"
import { cn } from "@/lib/utils"
import { RefreshCw, Loader2 } from "lucide-react"

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "default" | "secondary" | "destructive"
  icon?: "refresh" | "loader"
  speed?: "slow" | "normal" | "fast"
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ 
    className, 
    size = "md", 
    variant = "default", 
    icon = "loader",
    speed = "normal",
    ...props 
  }, ref) => {
    const sizeClasses = {
      sm: "h-4 w-4",
      md: "h-6 w-6", 
      lg: "h-8 w-8",
      xl: "h-12 w-12"
    }

    const variantClasses = {
      default: "text-primary",
      secondary: "text-muted-foreground",
      destructive: "text-destructive"
    }

    const speedClasses = {
      slow: "animate-spin [animation-duration:2s]",
      normal: "animate-spin",
      fast: "animate-spin [animation-duration:0.5s]"
    }

    const IconComponent = icon === "refresh" ? RefreshCw : Loader2

    return (
      <div
        ref={ref}
        className={cn("flex items-center justify-center", className)}
        {...props}
      >
        <IconComponent
          className={cn(
            sizeClasses[size],
            variantClasses[variant],
            speedClasses[speed]
          )}
        />
      </div>
    )
  }
)

Spinner.displayName = "Spinner"

export { Spinner }

// Loading overlay component
export const LoadingOverlay = ({ 
  isLoading, 
  children, 
  message = "Loading..." 
}: {
  isLoading: boolean
  children: React.ReactNode
  message?: string
}) => (
  <div className="relative">
    {children}
    {isLoading && (
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-center space-y-2">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    )}
  </div>
)
