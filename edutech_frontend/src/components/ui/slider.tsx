import React from 'react'
import { cn } from '@/lib/utils'

interface SliderProps {
  value: number[]
  onValueChange: (value: number[]) => void
  max?: number
  min?: number
  step?: number
  className?: string
  disabled?: boolean
}

export function Slider({
  value,
  onValueChange,
  max = 100,
  min = 0,
  step = 1,
  className,
  disabled = false,
  ...props
}: SliderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value)
    onValueChange([newValue])
  }

  return (
    <div className={cn("relative flex items-center select-none touch-none", className)}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value[0] || 0}
        onChange={handleChange}
        disabled={disabled}
        className={cn(
          "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          // Custom slider thumb styles
          "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4",
          "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500",
          "[&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-0",
          "[&::-webkit-slider-thumb]:shadow-md",
          "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full",
          "[&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:cursor-pointer",
          "[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md",
          // Track styles
          "[&::-webkit-slider-track]:bg-gray-200 [&::-webkit-slider-track]:rounded-lg",
          "[&::-moz-range-track]:bg-gray-200 [&::-moz-range-track]:rounded-lg"
        )}
        {...props}
      />
    </div>
  )
} 