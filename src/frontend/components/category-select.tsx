'use client'

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectSeparator,
} from '@/components/ui/select'
import { useState } from 'react'
import { AddCategoryDialog } from '@/components/create-category-dialog'
import { Category } from './provider/category-provider'
import { IconRender } from '@/lib/icon-map'
import { cn } from '@/lib/utils'
import { getCategoryColorClasses } from '@/lib/color-map'
import { Plus } from 'lucide-react'

interface CategorySelectProps {
  value: string
  onChange: (val: string) => void
  placeholder: string
  categories: Category[]
  getCategoryFromId: (id: number) => Category
}

export function CategorySelect({
  value,
  onChange,
  placeholder,
  categories,
  getCategoryFromId,
}: CategorySelectProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  // Removed unused localCategories state

  return (
    <>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          className={cn(
            'w-full',
            value &&
              getCategoryColorClasses(getCategoryFromId(parseInt(value)).color)
          )}
        >
          {value ? (
            <div className={cn('flex items-center gap-2')}>
              <IconRender
                iconName={getCategoryFromId(parseInt(value)).icon}
                className="w-4 h-4 text-inherit"
              />
              <span>{getCategoryFromId(parseInt(value)).name}</span>
            </div>
          ) : (
            <SelectValue placeholder={placeholder} />
          )}
        </SelectTrigger>
        <SelectContent>
          <div
            className="flex items-center hover:bg-muted px-2 py-1.5 rounded-sm text-muted-foreground text-sm cursor-pointer"
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()
              setDialogOpen(true)
            }}
          >
            <Plus className="mr-2 w-4 h-4" /> Kategorie hinzufügen
          </div>

          <SelectSeparator />

          {categories.map(opt => (
            <SelectItem
              key={opt.id}
              value={opt.id.toString()}
              className={cn(
                'cursor-pointer',
                getCategoryColorClasses(opt.color)
              )}
            >
              <IconRender
                iconName={opt.icon}
                className="w-4 h-4 text-inherit"
              />

              <span>{opt.name}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <AddCategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCategoryCreated={newCategory => {
          onChange(newCategory.id.toString())
        }}
      />
    </>
  )
}
