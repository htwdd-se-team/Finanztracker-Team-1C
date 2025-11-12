'use client'

import { useState } from 'react'
import { CalendarIcon, ChevronDown, RotateCcw, Plus, Edit } from 'lucide-react'
import {
  Button as AriaButton,
  DateRangePicker,
  Dialog,
  Group,
  Label,
  Popover,
} from 'react-aria-components'
import { DateValue } from '@internationalized/date'

import { cn } from '@/lib/utils'
import { RangeCalendar } from '@/components/ui/calendar-rac'
import { DateInput, dateInputStyle } from '@/components/ui/datefield-rac'
import { Label as LabelUI } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from '@/components/ui/select'
import MultipleSelector, { Option } from '@/components/ui/multiselect'
import {
  Accordion,
  AccordionItem,
  AccordionContent,
} from '@/components/ui/accordion'
import { useCategory } from '@/components/provider/category-provider'
import {
  ApiEntrySortBy,
  ApiTransactionType,
  ApiFilterResponseDto,
} from '@/__generated__/api'
import { IconRender } from '@/lib/icon-map'

interface TableFiltersProps {
  amountRange: [number, number]
  maxPrice: number
  onAmountRangeChange: (range: [number, number]) => void
  selectedCategories: number[]
  onCategoriesChange: (categories: number[]) => void
  dateRange: { start?: DateValue; end?: DateValue }
  onDateRangeChange: (range: { start?: DateValue; end?: DateValue }) => void
  description: string
  onDescriptionChange: (description: string) => void
  transactionType?: ApiTransactionType
  onTransactionTypeChange: (type?: ApiTransactionType) => void
  sortBy: ApiEntrySortBy
  onSortByChange: (sortBy: ApiEntrySortBy) => void
  onReset: () => void
  // Filter management props
  selectedFilter: ApiFilterResponseDto | null
  filters: ApiFilterResponseDto[] | undefined
  onFilterChange: (filter: ApiFilterResponseDto | null) => void
  onFilterDialogOpen: (filter: ApiFilterResponseDto | null) => void
}

export function TableFilters({
  amountRange,
  onAmountRangeChange,
  selectedCategories,
  onCategoriesChange,
  dateRange,
  onDateRangeChange,
  description,
  onDescriptionChange,
  transactionType,
  onTransactionTypeChange,
  sortBy,
  onSortByChange,
  onReset,
  maxPrice,
  selectedFilter,
  filters,
  onFilterChange,
  onFilterDialogOpen,
}: TableFiltersProps) {
  const { categories } = useCategory()

  // Fetch max price from backend

  // Convert categories to multiselect options
  const categoryOptions: Option[] = categories.map(category => ({
    value: category.id.toString(),
    label: category.name,
  }))

  // Convert selected category IDs to multiselect values
  const selectedCategoryOptions: Option[] = selectedCategories
    .map(id => categoryOptions.find(opt => opt.value === id.toString()))
    .filter(Boolean) as Option[]

  const handleCategoryChange = (options: Option[]) => {
    const categoryIds = options.map(opt => parseInt(opt.value))
    onCategoriesChange(categoryIds)
  }

  const handleAmountRangeChange = (range: [number, number]) => {
    onAmountRangeChange(range)
  }

  const sortOptions = [
    { value: ApiEntrySortBy.CreatedAtDesc, label: 'Neueste zuerst' },
    { value: ApiEntrySortBy.CreatedAtAsc, label: 'Älteste zuerst' },
    { value: ApiEntrySortBy.AmountDesc, label: 'Höchster Betrag zuerst' },
    { value: ApiEntrySortBy.AmountAsc, label: 'Niedrigster Betrag zuerst' },
  ]

  const transactionTypeOptions = [
    { value: ApiTransactionType.EXPENSE, label: 'Ausgaben' },
    { value: ApiTransactionType.INCOME, label: 'Einnahmen' },
  ]

  // Check if any filters are active (excluding description and sort)
  const hasActiveFilters =
    amountRange[0] != 0 ||
    amountRange[1] != maxPrice ||
    selectedCategories.length > 0 ||
    dateRange.start !== undefined ||
    dateRange.end !== undefined ||
    transactionType !== undefined

  const [accordionOpen, setAccordionOpen] = useState(false)

  return (
    <div className="bg-background mb-4 border rounded-lg">
      {/* Always visible row: Description, filters, and expand/reset buttons */}
      <div className="flex justify-between items-center gap-2 p-4">
        <div className="flex-1">
          <Input
            placeholder="Nach Beschreibung suchen..."
            value={description}
            onChange={e => onDescriptionChange(e.target.value)}
          />
        </div>

        {/* Filter Management */}
        <div className="flex items-center gap-2">
          <Select
            value={selectedFilter?.id?.toString() || 'none'}
            onValueChange={value => {
              if (value === 'none') {
                onFilterChange(null)
                onReset()
                return
              }
              const filter = filters?.find(f => f.id.toString() === value)
              if (filter) {
                onFilterChange(filter)
              }
            }}
          >
            <SelectTrigger className="w-[200px] cursor-pointer hover:bg-accent hover:text-accent-foreground">
              {selectedFilter ? (
                <div className="flex items-center gap-2">
                  {selectedFilter.icon && (
                    <IconRender
                      iconName={selectedFilter.icon}
                      className="w-4 h-4"
                    />
                  )}
                  <span>{selectedFilter.title}</span>
                </div>
              ) : (
                <SelectValue placeholder="Filter auswählen" />
              )}
            </SelectTrigger>
            <SelectContent>
              {/* Create New Filter Button */}
              <Button
                variant="secondary"
                className="px-2 py-1.5 rounded-sm w-full text-sm cursor-pointer"
                onClick={e => {
                  e.preventDefault()
                  e.stopPropagation()
                  onFilterDialogOpen(null)
                }}
              >
                <Plus className="mr-2 w-4 h-4" /> Filter erstellen
              </Button>
              <SelectSeparator />
              <SelectItem
                value="none"
                className="cursor-pointer hover:bg-accent hover:text-accent-foreground group"
              >
                <span className="text-muted-foreground group-hover:text-accent-foreground">
                  Kein Filter
                </span>
              </SelectItem>
              <SelectSeparator />
              {filters?.map(filter => (
                <SelectItem
                  key={filter.id}
                  value={filter.id.toString()}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {filter.icon && (
                      <IconRender iconName={filter.icon} className="w-4 h-4" />
                    )}
                    <span>{filter.title}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedFilter && (
            <Button
              variant="outline"
              size="icon"
              className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
              onClick={() => {
                onFilterDialogOpen(selectedFilter)
              }}
              title="Filter bearbeiten"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Expand and Reset Buttons */}
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="flex items-center gap-2"
              title="Filter zurücksetzen"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAccordionOpen(!accordionOpen)}
            className="flex items-center gap-2"
            title="Filter öffnen"
          >
            <ChevronDown
              className={cn(
                'w-4 h-4',
                accordionOpen ? 'rotate-180 transition-all' : ''
              )}
            />
          </Button>
        </div>
      </div>
      <div className="relative">
        <Accordion
          type="single"
          value={accordionOpen ? 'filters' : undefined}
          collapsible
          className="w-auto"
        >
          <AccordionItem value="filters" className="border-0">
            <AccordionContent className="px-0 pt-0 pb-0">
              <div className="space-y-4 p-4 border-t">
                {/* Amount Range Slider */}

                <div className="space-y-2">
                  <div className="flex justify-between items-center gap-2">
                    <LabelUI className="leading-6">Betragsspanne (€)</LabelUI>
                    {amountRange && (
                      <output className="font-medium tabular-nums text-sm">
                        {(amountRange[0] / 100).toFixed(2)} -{' '}
                        {(amountRange[1] / 100).toFixed(2)}
                      </output>
                    )}
                  </div>
                  <Slider
                    value={amountRange}
                    onValueChange={handleAmountRangeChange}
                    min={0}
                    max={maxPrice}
                    step={100}
                    aria-label="Betragsspanne"
                  />
                </div>

                {/* Category Multiselect */}
                <div className="space-y-2">
                  <LabelUI>Kategorien</LabelUI>
                  <MultipleSelector
                    commandProps={{
                      label: 'Kategorien auswählen',
                    }}
                    value={selectedCategoryOptions}
                    defaultOptions={categoryOptions}
                    placeholder="Kategorien auswählen"
                    onChange={handleCategoryChange}
                    hideClearAllButton
                    hidePlaceholderWhenSelected
                    emptyIndicator={
                      <p className="text-sm text-center">
                        Keine Kategorien gefunden
                      </p>
                    }
                    badgeClassName="flex items-center gap-1"
                  />
                </div>

                {/* Date Range Picker */}
                <div className="space-y-2">
                  <DateRangePicker
                    className="*:not-first:mt-2"
                    value={
                      dateRange.start && dateRange.end
                        ? { start: dateRange.start, end: dateRange.end }
                        : null
                    }
                    onChange={range =>
                      onDateRangeChange({
                        start: range?.start,
                        end: range?.end,
                      })
                    }
                  >
                    <Label className="font-medium text-foreground text-sm">
                      Datumsbereich
                    </Label>
                    <div className="flex">
                      <Group className={cn(dateInputStyle, 'pe-9')}>
                        <DateInput slot="start" unstyled />
                        <span
                          aria-hidden="true"
                          className="px-2 text-muted-foreground/70"
                        >
                          -
                        </span>
                        <DateInput slot="end" unstyled />
                      </Group>
                      <AriaButton className="z-10 flex justify-center items-center -ms-9 -me-px data-focus-visible:border-ring rounded-e-md outline-none data-focus-visible:ring-[3px] data-focus-visible:ring-ring/50 w-9 text-muted-foreground/80 hover:text-foreground transition-[color,box-shadow]">
                        <CalendarIcon size={16} />
                      </AriaButton>
                    </div>
                    <Popover
                      className="data-[placement=left]:slide-in-from-right-2 data-[placement=top]:slide-in-from-bottom-2 z-50 bg-background data-[placement=bottom]:slide-in-from-top-2 data-[placement=right]:slide-in-from-left-2 shadow-lg border rounded-md outline-hidden text-popover-foreground data-entering:animate-in data-exiting:animate-out data-[entering]:fade-in-0 data-[exiting]:fade-out-0 data-[entering]:zoom-in-95 data-[exiting]:zoom-out-95"
                      offset={4}
                    >
                      <Dialog className="p-2 max-h-[inherit] overflow-auto">
                        <RangeCalendar />
                      </Dialog>
                    </Popover>
                  </DateRangePicker>
                </div>

                {/* Transaction Type and Sort By */}
                <div className="gap-4 grid grid-cols-2">
                  {/* Transaction Type Select */}
                  <div className="space-y-2">
                    <LabelUI>Transaktionstyp</LabelUI>
                    <Select
                      value={transactionType || 'all'}
                      onValueChange={value =>
                        onTransactionTypeChange(
                          value === 'all'
                            ? undefined
                            : (value as ApiTransactionType)
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Alle Transaktionen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Transaktionen</SelectItem>
                        {transactionTypeOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort By Select */}
                  <div className="space-y-2">
                    <LabelUI>Sortierung</LabelUI>
                    <Select
                      value={sortBy}
                      onValueChange={value =>
                        onSortByChange(value as ApiEntrySortBy)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}
