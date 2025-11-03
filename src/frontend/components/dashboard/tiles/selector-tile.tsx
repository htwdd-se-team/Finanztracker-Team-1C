'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { useState , useRef , useEffect } from 'react'
import { RangeCalendar } from '@/components/ui/calendar-rac'
import { DateInput , dateInputStyle } from '@/components/ui/datefield-rac'
import { today, getLocalTimeZone, startOfMonth, endOfMonth, CalendarDate } from '@internationalized/date'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button as AriaButton, DateRangePicker, Dialog, Group, Label, Popover } from 'react-aria-components'

let hasUserSelectedRange = false

type SelectorTileProps = {
  value: string
  onRangeChange: (range: {
    type: string
    startDate: string
    endDate: string
  }) => void
  className?: string
}

export function SelectorTile({
  value,
  onRangeChange,
  className
}: SelectorTileProps) {
  const [showPicker, setShowPicker] = useState(false)
  const [dateRange, setDateRange] = useState<{ start: CalendarDate; end: CalendarDate }>({
    start: startOfMonth(today(getLocalTimeZone())),
    end: endOfMonth(today(getLocalTimeZone())),
  })

const computeRange = (type: string) => {
  const now = today(getLocalTimeZone())
  let start = now
  let end = now

  if (type === '7d') {
    start = now.subtract({ days: 7 })
  } else if (type === '30d') {
    start = now.subtract({ days: 30 })
  } else if (type === 'all') {
    start = now.subtract({ days: 365 })
  } else if (type === 'individuell') {
    start = dateRange.start
    end = dateRange.end
  }
  onRangeChange({
    type,
    startDate: start.toString(),
    endDate: end.toString(),
  })
}

  useEffect(() => {
  if (!hasUserSelectedRange) {
    hasUserSelectedRange = true
    computeRange('all')
  }
}, [])

  const tabTriggerClass =
    'bg-[var(--card)] data-[state=active]:border-[var(--color-chart-2)] data-[state=active]:bg-[color:var(--color-chart-2)/0.1]'

  const pickerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
      setShowPicker(false)
    }
  }
  document.addEventListener('mousedown', handleClickOutside)
  return () => document.removeEventListener('mousedown', handleClickOutside)
}, [])

  return (
    <Card className={cn('h-18 ', className)}>
      <CardContent className="flex flex-col justify-center p-0 h-full relative">
        <Tabs value={value} onValueChange={(v) => {
          if (v !== 'individuell') computeRange(v) }} className="">
          <TabsList className="grid grid-cols-2 grid-rows-2 bg-var(--card) rounded-[calc(var(--radius)-2px)] w-full h-full">
            <TabsTrigger value="7d" className={tabTriggerClass}>Woche</TabsTrigger>
            <TabsTrigger value="30d" className={tabTriggerClass}>Monat</TabsTrigger>
            <TabsTrigger
              value="individuell"
              className={tabTriggerClass}
              onClick={() => setShowPicker(!showPicker)}
            >Auswahl</TabsTrigger>
            <TabsTrigger value="all" className={tabTriggerClass}>Gesamt</TabsTrigger>
          </TabsList>
        </Tabs>
        {showPicker && (
        <div
        className="fixed inset-0 flex items-center justify-center bg-background/10 backdrop-blur-[6px] z-50 pb-[30vh]"
        >
          <div
          ref={pickerRef}
          className="bg-background p-6 rounded-xl shadow-lg w-80 border-[3px] [border-color:var(--color-chart-2)]">
            <DateRangePicker
            className="pb-0"
            value={dateRange}
            onChange={(range) => {
              if (range?.start && range?.end) setDateRange(range)
            }}
          >
            <Label
              className="font-medium text-foreground text-sm p-1 relative"
              style={{ top: '-4px' }}
            >
              Zeitraum wählen
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
              <AriaButton className="z-10 flex justify-center items-center -ms-9 -me-px rounded-e-md outline-none w-9 text-muted-foreground/80 hover:text-foreground">
                <CalendarIcon size={16} />
              </AriaButton>
            </div>
            <Popover
            className="z-50 bg-background border rounded-md shadow-lg"
            offset={4}
            >
              <Dialog className="p-2 max-h-[inherit] overflow-auto">
                <RangeCalendar />
              </Dialog>
            </Popover>
          </DateRangePicker>
          <div className="flex justify-end mt-3">
            <button
              className="px-2 py-1 rounded-md bg-[var(--color-chart-2)] text-white hover:opacity-90"
              onClick={() => {
                setShowPicker(false)
                computeRange('individuell')
              }}
            >
              Bestätigen
            </button>
          </div>
          </div>
        </div>
      )}
      </CardContent>
    </Card>
  )
}

export default SelectorTile
