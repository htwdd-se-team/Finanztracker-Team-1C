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

interface CategorySelectProps {
  value: string
  onChange: (val: string) => void
  placeholder: string
  options: { label: string; value: string }[]
}

export function CategorySelect({
  value,
  onChange,
  placeholder,
  options,
}: CategorySelectProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <div
            className="cursor-pointer px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted rounded-sm"
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()
              setDialogOpen(true)
            }}
          >
            + Kategorie hinzufügen
          </div>

          <SelectSeparator />

          {options.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <AddCategoryDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}
