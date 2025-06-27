'use client'

import { IconNames, IconRender } from '@/lib/icon-map'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface IconPickerProps {
  value?: IconNames
  onValueChange: (icon: IconNames) => void
  className?: string
}

export function IconPicker({
  value,
  onValueChange,
  className,
}: IconPickerProps) {
  // Get all category icons (excluding UI icons)
  const categoryIcons = Object.values(IconNames)

  return (
    <div className={cn('space-y-3', className)}>
      <div className="gap-2 grid grid-cols-4 sm:grid-cols-6 p-2 max-h-48 overflow-y-auto">
        {categoryIcons.map(icon => {
          const isSelected = value === icon

          return (
            <button
              key={icon}
              type="button"
              onClick={() => onValueChange(icon)}
              className={cn(
                'relative p-2 rounded-md border-2 transition-all hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                isSelected ? 'border-primary bg-primary/5' : 'border-border'
              )}
              title={icon.replace('-', ' ')}
            >
              <IconRender iconName={icon} className="mx-auto w-5 h-5" />
              {isSelected && (
                <Check className="-top-1 -right-1 absolute bg-background rounded-full w-3 h-3 text-primary" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Compact icon picker for smaller spaces
export function CompactIconPicker({
  value,
  onValueChange,
  className,
}: IconPickerProps) {
  const categoryIcons = Object.values(IconNames).filter(
    iconName =>
      ![
        'plus',
        'edit',
        'trash2',
        'search',
        'filter',
        'calendar',
        'settings',
        'tag',
        'question-mark',
      ].includes(iconName)
  )

  return (
    <div
      className={cn(
        'grid grid-cols-8 gap-1 max-h-32 overflow-y-auto',
        className
      )}
    >
      {categoryIcons.map(icon => {
        const isSelected = value === icon

        return (
          <button
            key={icon}
            type="button"
            onClick={() => onValueChange(icon)}
            className={cn(
              'relative p-1.5 rounded border transition-all hover:bg-muted',
              isSelected ? 'border-primary bg-primary/5' : 'border-border'
            )}
            title={icon.replace('-', ' ')}
          >
            <IconRender iconName={icon} className="mx-auto w-4 h-4" />
            {isSelected && (
              <Check className="-top-0.5 -right-0.5 absolute bg-background rounded-full w-2.5 h-2.5 text-primary" />
            )}
          </button>
        )
      })}
    </div>
  )
}
