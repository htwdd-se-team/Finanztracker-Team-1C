'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type SelectorTileProps = {
  value: string
  onValueChange: (value: string) => void
  className?: string
}

function SelectorTile({ value, onValueChange, className }: SelectorTileProps) {
  const tabTriggerClass =
    'bg-[var(--card)] data-[state=active]:border-[var(--color-chart-2)] data-[state=active]:bg-[color:var(--color-chart-2)/0.1]'

  return (
    <Card className={cn('h-18 ', className)}>
      <CardContent className="flex flex-col justify-center p-0 h-full">
        <Tabs value={value} onValueChange={onValueChange} className="">
          <TabsList className="grid grid-cols-2 grid-rows-2 bg-var(--card) rounded-[calc(var(--radius)-2px)] w-full h-full">
            <TabsTrigger value="7d" className={tabTriggerClass}>
              Woche
            </TabsTrigger>
            <TabsTrigger value="30d" className={tabTriggerClass}>
              Monat
            </TabsTrigger>
            <TabsTrigger value="90d" className={tabTriggerClass}>
              Quartal
            </TabsTrigger>
            <TabsTrigger value="all" className={tabTriggerClass}>
              Gesamt
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default SelectorTile
