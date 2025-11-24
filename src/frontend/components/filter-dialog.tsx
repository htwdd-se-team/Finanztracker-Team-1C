'use client'

import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { DateValue, parseDate } from '@internationalized/date'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { CategorySelect } from '@/components/category-select'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DateRangePicker } from 'react-aria-components'
import { RangeCalendar } from '@/components/ui/calendar-rac'

import { CompactIconPicker } from '@/components/ui/icon-picker'
import { IconNames, IconRender } from '@/lib/icon-map'
import { Plus, Calendar } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { getCategoryColorClasses } from '@/lib/color-map'
import { apiClient } from '@/api/api-client'
import { useQueryClient } from '@tanstack/react-query'
import { useCategory } from '@/components/provider/category-provider'
import {
  ApiFilterResponseDto,
  ApiCreateFilterDto,
  ApiUpdateFilterDto,
} from '@/__generated__/api'
import { ApiFilterSortOption, ApiTransactionType } from '@/__generated__/api'

interface FilterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // If provided, dialog is in edit mode and fields are prefilled
  initialFilter?: ApiFilterResponseDto | null
  // Called after successful save with the saved filter
  onSaveSuccess?: (filter: ApiFilterResponseDto) => void
}

export default function FilterDialog({
  open,
  onOpenChange,
  initialFilter,
  onSaveSuccess,
}: FilterDialogProps) {
  const queryClient = useQueryClient()
  const { categories } = useCategory()

  // Form state
  const [title, setTitle] = useState('')
  const [icon, setIcon] = useState<IconNames | undefined>(undefined)
  const [useAmountRange, setUseAmountRange] = useState(false)
  const [amountRange, setAmountRange] = useState<[number, number]>([0, 50000])
  const [selectedCategories, setSelectedCategories] = useState<number[]>([])
  const [dateRange, setDateRange] = useState<{
    start?: DateValue
    end?: DateValue
  }>({})
  const [searchText, setSearchText] = useState<string>('')
  const [transactionType, setTransactionType] = useState<
    ApiTransactionType | undefined
  >(undefined)
  const [sortOption, setSortOption] = useState<ApiFilterSortOption | undefined>(
    ApiFilterSortOption.NEWEST_FIRST
  )
  const [isSaving, setIsSaving] = useState(false)
  const [datePopoverOpen, setDatePopoverOpen] = useState(false)

  // when initialFilter changes (edit mode) populate fields
  useEffect(() => {
    if (initialFilter) {
      setTitle(initialFilter.title || '')
      setIcon((initialFilter.icon as IconNames) || undefined)
      setSearchText(initialFilter.searchText || '')
      setTransactionType(initialFilter.transactionType || undefined)
      setSortOption(
        initialFilter.sortOption || ApiFilterSortOption.NEWEST_FIRST
      )

      // Check if amount range is set (either minPrice or maxPrice is defined)
      if (
        (initialFilter.minPrice !== null &&
          initialFilter.minPrice !== undefined) ||
        (initialFilter.maxPrice !== null &&
          initialFilter.maxPrice !== undefined)
      ) {
        setUseAmountRange(true)
        setAmountRange([
          initialFilter.minPrice || 0,
          initialFilter.maxPrice || 0,
        ])
      } else {
        setUseAmountRange(false)
      }

      if (initialFilter.dateFrom || initialFilter.dateTo) {
        setDateRange({
          start: initialFilter.dateFrom
            ? parseDate(initialFilter.dateFrom.split('T')[0])
            : undefined,
          end: initialFilter.dateTo
            ? parseDate(initialFilter.dateTo.split('T')[0])
            : undefined,
        })
      } else {
        setDateRange({})
      }
      setSelectedCategories(initialFilter.categoryIds || [])
    } else {
      // reset form for create
      setTitle('')
      setIcon(undefined)
      setUseAmountRange(false)
      setAmountRange([0, 50000])
      setSelectedCategories([])
      setDateRange({})
      setSearchText('')
      setTransactionType(undefined)
      setSortOption(ApiFilterSortOption.NEWEST_FIRST)
    }
  }, [initialFilter])

  // guard: ensure end date is after start when user picks second date
  const handleDateRangeChange = (range: {
    start?: DateValue
    end?: DateValue
  }) => {
    if (range.start && range.end) {
      const s = new Date(range.start.toString())
      const e = new Date(range.end.toString())
      if (e < s) {
        // ignore invalid set, or swap
        setDateRange({ start: range.start, end: range.start })
        return
      }
    }
    setDateRange(range)

    // if a valid range was selected, close the date popover
    if (range.start && range.end) {
      const s = new Date(range.start.toString())
      const e = new Date(range.end.toString())
      if (e >= s) {
        setDatePopoverOpen(false)
      }
    }
  }

  const handleSave = async () => {
    if (!title || title.trim().length === 0) {
      toast.error('Titel ist erforderlich')
      return
    }

    setIsSaving(true)

    try {
      const payload: ApiCreateFilterDto | ApiUpdateFilterDto = {
        title,
        icon,
        minPrice: useAmountRange ? amountRange[0] : undefined,
        maxPrice: useAmountRange ? amountRange[1] : undefined,
        dateFrom: dateRange.start ? dateRange.start.toString() : undefined,
        dateTo: dateRange.end ? dateRange.end.toString() : undefined,
        searchText: searchText || undefined,
        transactionType: transactionType || undefined,
        sortOption: sortOption,
        categoryIds:
          selectedCategories.length > 0 ? selectedCategories : undefined,
      }

      if (initialFilter && initialFilter.id) {
        // For updates, explicitly send null for cleared price range to ensure backend updates it
        const updatePayload = {
          ...payload,
          minPrice: useAmountRange ? amountRange[0] : null,
          maxPrice: useAmountRange ? amountRange[1] : null,
        } as ApiUpdateFilterDto

        await apiClient.filters.filterControllerUpdate(
          initialFilter.id,
          updatePayload
        )
        toast.success('Filter aktualisiert')

        // Refetch filters to get updated data
        const updatedFilters = await queryClient.fetchQuery({
          queryKey: ['filters'],
          queryFn: async () => {
            const res = await apiClient.filters.filterControllerList()
            return res.data
          },
        })

        // Find and call the saved filter callback
        const updatedFilter = updatedFilters?.find(
          f => f.id === initialFilter.id
        )
        if (updatedFilter && onSaveSuccess) {
          onSaveSuccess(updatedFilter)
        }
      } else {
        await apiClient.filters.filterControllerCreate(
          payload as ApiCreateFilterDto
        )
        toast.success('Filter erstellt')
      }

      queryClient.invalidateQueries({ queryKey: ['filters'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      toast.error('Fehler beim Speichern des Filters')
    }

    setIsSaving(false)
  }

  const handleDelete = async () => {
    if (!initialFilter) return
    try {
      await apiClient.filters.filterControllerDelete(initialFilter.id)
      toast.success('Filter gelöscht')
      queryClient.invalidateQueries({ queryKey: ['filters'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      toast.error('Fehler beim Löschen des Filters')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialFilter ? 'Filter bearbeiten' : 'Filter erstellen'}
          </DialogTitle>
          <DialogDescription>
            Erstelle oder bearbeite gespeicherte Filter zur schnellen
            Wiederverwendung
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-2">Titel</Label>
            <div className="flex gap-2">
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="z. B. Monatliche Einkäufe"
                required
                className="flex-1"
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[42px] px-0 justify-center cursor-pointer"
                    title="Icon auswählen"
                  >
                    {icon ? (
                      <IconRender iconName={icon} className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[320px]">
                  <CompactIconPicker
                    value={icon}
                    onValueChange={val => setIcon(val)}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Betragsspanne (€)</Label>
              <Switch
                checked={useAmountRange}
                onCheckedChange={setUseAmountRange}
                className="cursor-pointer"
              />
            </div>

            {useAmountRange && (
              <div>
                <div className="mb-2 text-sm">
                  {(amountRange[0] / 100).toFixed(2)} -{' '}
                  {(amountRange[1] / 100).toFixed(2)}
                </div>
                <Slider
                  value={amountRange}
                  onValueChange={(v: [number, number]) => setAmountRange(v)}
                  min={0}
                  max={500000}
                  step={100}
                />
              </div>
            )}
          </div>
          <div>
            <Label className="mb-2">Kategorien</Label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {selectedCategories.map(categoryId => {
                  const category = categories.find(c => c.id === categoryId)
                  if (!category) return null
                  return (
                    <div
                      key={categoryId}
                      className={cn(
                        'flex items-center gap-2 px-2 py-1 rounded-md',
                        getCategoryColorClasses(category.color)
                      )}
                    >
                      <IconRender
                        iconName={category.icon}
                        className="w-4 h-4 text-inherit"
                      />
                      <span>{category.name}</span>
                      <button
                        onClick={() => {
                          setSelectedCategories(prev =>
                            prev.filter(id => id !== categoryId)
                          )
                        }}
                        className="text-inherit hover:opacity-70 cursor-pointer"
                        title="Kategorie entfernen"
                      >
                        ×
                      </button>
                    </div>
                  )
                })}
              </div>
              <CategorySelect
                value=""
                onChange={val => {
                  if (val && !selectedCategories.includes(parseInt(val))) {
                    setSelectedCategories(prev => [...prev, parseInt(val)])
                  }
                }}
                placeholder={
                  selectedCategories.length > 0
                    ? 'Weitere Kategorie hinzufügen'
                    : 'Kategorie auswählen'
                }
                categories={categories.filter(
                  c => !selectedCategories.includes(c.id)
                )}
                getCategoryFromId={id =>
                  categories.find(c => c.id === id) || categories[0]
                }
              />
            </div>
          </div>{' '}
          <div>
            <Label className="mb-2">Datumsbereich</Label>
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => {}}
                className="w-full justify-start text-left font-normal"
              >
                <Calendar className="mr-2 h-4 w-4" />
                <span>
                  {dateRange.start && dateRange.end
                    ? `${new Date(dateRange.start.toString()).toLocaleDateString()} - ${new Date(
                        dateRange.end.toString()
                      ).toLocaleDateString()}`
                    : 'Zeitraum auswählen'}
                </span>
              </Button>
              <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <div className="absolute inset-0 cursor-pointer" />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <DateRangePicker
                    value={
                      dateRange.start && dateRange.end
                        ? { start: dateRange.start, end: dateRange.end }
                        : null
                    }
                    onChange={r =>
                      handleDateRangeChange({ start: r?.start, end: r?.end })
                    }
                  >
                    <RangeCalendar className="border-0" />
                  </DateRangePicker>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div>
            <Label className="mb-2">Beschreibung</Label>
            <Input
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="Nach Beschreibung suchen..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-2">Transaktionstyp</Label>
              <Select
                value={transactionType || 'all'}
                onValueChange={(v: string) =>
                  setTransactionType(
                    v === 'all' ? undefined : (v as ApiTransactionType)
                  )
                }
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="Alle Transaktionen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                    value="all"
                  >
                    Alle Transaktionen
                  </SelectItem>
                  <SelectItem
                    className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                    value={ApiTransactionType.EXPENSE}
                  >
                    {'Ausgabe'}
                  </SelectItem>
                  <SelectItem
                    className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                    value={ApiTransactionType.INCOME}
                  >
                    {'Einnahme'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2">Sortierung</Label>
              <Select
                value={sortOption}
                onValueChange={(v: string) =>
                  setSortOption(v as ApiFilterSortOption)
                }
              >
                <SelectTrigger className="cursor-pointer w-full">
                  <div className="w-full truncate">
                    <SelectValue className="block w-full truncate" />
                  </div>
                </SelectTrigger>
                <SelectContent className="truncate">
                  <SelectItem
                    className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                    value={ApiFilterSortOption.HIGHEST_AMOUNT}
                  >
                    {'Höchster Betrag zuerst'}
                  </SelectItem>
                  <SelectItem
                    className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                    value={ApiFilterSortOption.LOWEST_AMOUNT}
                  >
                    {'Niedrigster Betrag zuerst'}
                  </SelectItem>
                  <SelectItem
                    className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                    value={ApiFilterSortOption.OLDEST_FIRST}
                  >
                    {'Älteste zuerst'}
                  </SelectItem>
                  <SelectItem
                    className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                    value={ApiFilterSortOption.NEWEST_FIRST}
                  >
                    {'Neueste zuerst'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="flex gap-2 w-full justify-between">
            <div>
              {initialFilter && (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isSaving}
                  className="cursor-pointer hover:bg-destructive/90"
                >
                  Löschen
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <DialogClose asChild>
                <Button variant="outline" className="cursor-pointer">
                  Abbrechen
                </Button>
              </DialogClose>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
              >
                {isSaving
                  ? 'Speichert...'
                  : initialFilter
                    ? 'Speichern'
                    : 'Erstellen'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
