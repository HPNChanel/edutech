import { useState, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  onSearch?: (value: string) => void
  className?: string
  showClearButton?: boolean
  debounceMs?: number
  disabled?: boolean
}

export default function SearchBar({
  placeholder = "Search lessons...",
  value: controlledValue,
  onChange,
  onSearch,
  className,
  showClearButton = true,
  debounceMs = 300,
  disabled = false
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState('')
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)
  
  // Use controlled value if provided, otherwise use internal state
  const searchValue = controlledValue !== undefined ? controlledValue : internalValue
  
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    
    // Update internal state if not controlled
    if (controlledValue === undefined) {
      setInternalValue(newValue)
    }
    
    // Call onChange immediately
    onChange?.(newValue)
    
    // Debounce the search callback
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    
    if (onSearch && debounceMs > 0) {
      const timer = setTimeout(() => {
        onSearch(newValue)
      }, debounceMs)
      setDebounceTimer(timer)
    } else if (onSearch) {
      onSearch(newValue)
    }
  }, [controlledValue, onChange, onSearch, debounceMs, debounceTimer])
  
  const handleClear = useCallback(() => {
    const clearedValue = ''
    
    // Update internal state if not controlled
    if (controlledValue === undefined) {
      setInternalValue(clearedValue)
    }
    
    // Call callbacks
    onChange?.(clearedValue)
    onSearch?.(clearedValue)
    
    // Clear debounce timer
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      setDebounceTimer(null)
    }
  }, [controlledValue, onChange, onSearch, debounceTimer])
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSearch?.(searchValue)
      
      // Clear debounce timer since we're searching immediately
      if (debounceTimer) {
        clearTimeout(debounceTimer)
        setDebounceTimer(null)
      }
    }
    
    if (e.key === 'Escape') {
      handleClear()
    }
  }, [searchValue, onSearch, debounceTimer, handleClear])
  
  return (
    <div className={cn("relative w-full max-w-sm", className)}>
      <div className="relative">
        {/* Search Icon */}
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        
        {/* Search Input */}
        <Input
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(
            "pl-10 pr-10 w-full rounded-md border border-input bg-background",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            showClearButton && searchValue && "pr-10"
          )}
        />
        
        {/* Clear Button */}
        {showClearButton && searchValue && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0 hover:bg-transparent"
            tabIndex={-1}
          >
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>
    </div>
  )
}

// Export additional search-related utilities
export const useSearchDebounce = (callback: (value: string) => void, delay: number = 300) => {
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)
  
  return useCallback((value: string) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    
    const timer = setTimeout(() => {
      callback(value)
    }, delay)
    
    setDebounceTimer(timer)
    
    // Cleanup function
    return () => {
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [callback, delay, debounceTimer])
}
