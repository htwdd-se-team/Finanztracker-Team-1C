'use client'

import { useId } from 'react'
import { CalendarIcon, RotateCcw } from 'lucide-react'
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
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import MultipleSelector, { Option } from '@/components/ui/multiselect'
import { useCategory } from '@/components/provider/category-provider'
import { ApiEntrySortBy, ApiTransactionType } from '@/__generated__/api'

interface TableFiltersProps {
  amountRange: [number, number]
  onAmountRangeChange: (range: [number, number]) => void
  amountFilterEnabled: boolean
  onAmountFilterEnabledChange: (enabled: boolean) => void
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
}

export function TableFilters({
  amountRange,
  onAmountRangeChange,
  amountFilterEnabled,
  onAmountFilterEnabledChange,
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
}: TableFiltersProps) {
  const { categories } = useCategory()
  const id = useId()

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

  return (
    <div className="space-y-4 bg-background mb-4 p-4 border rounded-lg">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Filter</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Zurücksetzen
        </Button>
      </div>

      <div className="gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Amount Range Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={amountFilterEnabled}
                onCheckedChange={onAmountFilterEnabledChange}
                id="amount-filter-toggle"
              />
              <LabelUI htmlFor="amount-filter-toggle" className="leading-6">
                Betragsspanne (€)
              </LabelUI>
            </div>
            {amountFilterEnabled && (
              <output className="font-medium tabular-nums text-sm">
                {(amountRange[0] / 100).toFixed(2)} -{' '}
                {(amountRange[1] / 100).toFixed(2)}
              </output>
            )}
          </div>
          <Slider
            value={amountRange}
            onValueChange={onAmountRangeChange}
            min={0}
            max={50000}
            step={100}
            aria-label="Betragsspanne"
            disabled={!amountFilterEnabled}
            className={!amountFilterEnabled ? 'opacity-50' : ''}
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
              <p className="text-sm text-center">Keine Kategorien gefunden</p>
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
              onDateRangeChange({ start: range?.start, end: range?.end })
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

        {/* Description Input */}
        <div className="space-y-2">
          <LabelUI htmlFor={`description-${id}`}>Beschreibung</LabelUI>
          <Input
            id={`description-${id}`}
            placeholder="Nach Beschreibung suchen..."
            value={description}
            onChange={e => onDescriptionChange(e.target.value)}
          />
        </div>

        {/* Transaction Type and Sort By - Mobile: 2 columns, Desktop: separate items */}
        <div className="gap-4 grid grid-cols-2 col-span-1 md:col-span-2 lg:col-span-2">
          {/* Transaction Type Select */}
          <div className="space-y-2">
            <LabelUI>Transaktionstyp</LabelUI>
            <Select
              value={transactionType || 'all'}
              onValueChange={value =>
                onTransactionTypeChange(
                  value === 'all' ? undefined : (value as ApiTransactionType)
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
              onValueChange={value => onSortByChange(value as ApiEntrySortBy)}
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
    </div>
  )
}
