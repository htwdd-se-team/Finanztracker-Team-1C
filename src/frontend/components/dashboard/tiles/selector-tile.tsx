'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useState, useCallback } from 'react'
import { RangeCalendar } from '@/components/ui/calendar-rac'
import { DateInput, dateInputStyle } from '@/components/ui/datefield-rac'
import {
  today,
  getLocalTimeZone,
  startOfMonth,
  CalendarDate,
} from '@internationalized/date'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DateRangePicker, Group, Label } from 'react-aria-components'

enum RangeType {
  WEEK = '7d',
  MONTH = '30d',
  CUSTOM = 'individuell',
  ALL = 'all',
}

const tabTriggerClass = `
  data-[state=inactive]:bg-transparent
  data-[state=active]:border-[var(--color-chart-2)]
  data-[state=active]:bg-[var(--color-chart-2)]/10
  dark:data-[state=inactive]:bg-transparent
  dark:data-[state=active]:border-[var(--color-chart-2)]
  dark:data-[state=active]:bg-[var(--color-chart-2)]/15
  transition
  hover:bg-white/20 hover:shadow-[0_0_8px_rgba(0,0,0,0.15)]
  hover:border hover:border-[var(--chart-2)]/70
  dark:hover:bg-white/5 dark:hover:shadow-[0_0_4px_rgba(255,255,255,0.2)]
  rounded-md
  rounded-md
 `

type SelectorTileProps = {
  value: RangeType | string
  onRangeChange: (range: {
    type: RangeType
    startDate: string
    endDate: string
  }) => void
  className?: string
}

export function SelectorTile({
  value,
  onRangeChange,
  className,
}: SelectorTileProps) {
  const [showPicker, setShowPicker] = useState(false)
  const [dateRange, setDateRange] = useState<{
    start: CalendarDate
    end: CalendarDate
  }>({
    start: startOfMonth(today(getLocalTimeZone())),
    end: today(getLocalTimeZone()),
  })

  const computeRange = useCallback(
    (type: RangeType) => {
      const now = today(getLocalTimeZone())
      let start = now
      let end = now

      if (type === RangeType.WEEK) {
        start = now.subtract({ days: 7 })
      } else if (type === RangeType.MONTH) {
        start = now.subtract({ days: 30 })
      } else if (type === RangeType.ALL) {
        start = now.subtract({ days: 365 })
      } else if (type === RangeType.CUSTOM) {
        start = dateRange.start
        end = dateRange.end
      }
      onRangeChange({
        type,
        startDate: start.toString(),
        endDate: end.toString(),
      })
    },
    [dateRange, onRangeChange]
  )

  return (
    <Card className={cn('h-18', className)}>
      <CardContent className="p-0 m-0 flex flex-col justify-center h-full">
        <Dialog open={showPicker} onOpenChange={setShowPicker}>
          <Tabs
            value={value}
            onValueChange={v => {
              if (v === RangeType.CUSTOM) {
                setShowPicker(true)
              } else {
                computeRange(v as RangeType)
              }
            }}
            className=""
          >
            <TabsList className="
              grid grid-cols-2 grid-rows-2
              w-full h-full
              bg-transparent
              p-0 m-0
              items-stretch
            ">
              <TabsTrigger value={RangeType.WEEK} className={tabTriggerClass}>
                Woche
              </TabsTrigger>
              <TabsTrigger value={RangeType.MONTH} className={tabTriggerClass}>
                Monat
              </TabsTrigger>
              <TabsTrigger value={RangeType.CUSTOM} className={tabTriggerClass}>
                Auswahl
              </TabsTrigger>
              <TabsTrigger value={RangeType.ALL} className={tabTriggerClass}>
                Gesamt
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <DialogContent className="p-4 w-auto">
            <DialogHeader className="pb-2">
              <DialogTitle>Zeitraum wählen</DialogTitle>
            </DialogHeader>
            <DateRangePicker
              className="pb-0"
              value={dateRange}
              onChange={range => {
                if (range?.start && range?.end) setDateRange(range)
              }}
            >
              <div className="flex flex-col gap-2">
                <Label className="font-medium text-sm">Datumsbereich</Label>
                <div className="flex gap-2">
                  <Group className={cn(dateInputStyle, 'flex-1')}>
                    <DateInput slot="start" unstyled />
                    <span
                      aria-hidden="true"
                      className="px-2 text-muted-foreground/70"
                    >
                      -
                    </span>
                    <DateInput slot="end" unstyled />
                  </Group>
                  <button className="flex justify-center items-center px-2 rounded-e-md outline-none text-muted-foreground/80 hover:text-foreground">
                    <CalendarIcon size={16} />
                  </button>
                </div>
                <div className="p-2 border rounded-md w-full overflow-hidden">
                  <RangeCalendar />
                </div>
              </div>
            </DateRangePicker>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPicker(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={() => {
                  setShowPicker(false)
                  computeRange(RangeType.CUSTOM)
                }}
                style={{ backgroundColor: 'var(--color-chart-2)' }}
              >
                Bestätigen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

export default SelectorTile
