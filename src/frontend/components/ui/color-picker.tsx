'use client'

import { CategoryColors, categoryColorMap } from '@/lib/color-map'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface ColorPickerProps {
  value?: CategoryColors
  onValueChange: (color: CategoryColors) => void
  className?: string
}

export function ColorPicker({
  value,
  onValueChange,
  className,
}: ColorPickerProps) {
  const colors = Object.values(CategoryColors)

  return (
    <div className={cn('grid grid-cols-5 gap-2', className)}>
      {colors.map(color => {
        const isSelected = value === color
        const colorConfig = categoryColorMap[color]

        return (
          <button
            key={color}
            type="button"
            onClick={() => onValueChange(color)}
            className={cn(
              'relative w-8 h-8 rounded-full border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              isSelected ? 'border-foreground' : 'border-border'
            )}
            style={{ backgroundColor: colorConfig.hex }}
            title={colorConfig.name}
          >
            {isSelected && (
              <Check className="absolute inset-0 drop-shadow-sm m-auto w-4 h-4 text-white" />
            )}
          </button>
        )
      })}
    </div>
  )
}

// Alternative color picker with labels
export function ColorPickerWithLabels({
  value,
  onValueChange,
  className,
}: ColorPickerProps) {
  const colors = Object.values(CategoryColors)

  return (
    <div className={cn('grid grid-cols-3 gap-2', className)}>
      {colors.map(color => {
        const isSelected = value === color
        const colorConfig = categoryColorMap[color]

        return (
          <button
            key={color}
            type="button"
            onClick={() => onValueChange(color)}
            className={cn(
              'flex items-center gap-2 p-2 rounded-md border transition-colors hover:bg-muted',
              isSelected ? 'border-primary bg-primary/5' : 'border-border'
            )}
          >
            <div
              className="border rounded-full w-4 h-4"
              style={{ backgroundColor: colorConfig.hex }}
            />
            <span className="text-sm">{colorConfig.name}</span>
            {isSelected && <Check className="ml-auto w-4 h-4 text-primary" />}
          </button>
        )
      })}
    </div>
  )
}
