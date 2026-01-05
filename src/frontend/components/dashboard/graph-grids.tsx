'use client'

import { useState, useEffect } from 'react'
import SelectorTile from './tiles/selector-tile'
import BalanceTile from './tiles/balance-tile'
import DeltaTile from './tiles/delta-tile'
import HistoryTile from './tiles/history-tile'
import PieChartTileIcons from './tiles/pie-chart-icons-tile'
import { today, getLocalTimeZone, CalendarDate } from '@internationalized/date'

function GraphGrids() {
  const now = today(getLocalTimeZone())
  const past = new CalendarDate(1900, 1, 1)
  const [range, setRange] = useSessionRange('dashboard-range', {
    type: 'all',
    startDate: past.toString(),
    endDate: now.toString(),
  })

  function useSessionRange<T>(key: string, defaultValue: T) {
    const [state, setState] = useState<T>(() => {
      if (typeof window === 'undefined') return defaultValue
      const saved = sessionStorage.getItem(key)
      return saved ? JSON.parse(saved) : defaultValue
    })
    useEffect(() => {
      sessionStorage.setItem(key, JSON.stringify(state))
    }, [key, state])
    return [state, setState] as const
  }

  return (
    <div className="gap-2 sm:gap-6 grid grid-cols-2">
      {/* Row 1: Kontostand (Balance + Selector) */}
      <div className="gap-2 sm:gap-6 grid grid-cols-3 col-span-2">
        <BalanceTile className="col-span-2 bg-card/90 dark:bg-card/60" />
        <SelectorTile
          value={range.type}
          onRangeChange={setRange}
          className="col-span-1 bg-card/90 dark:bg-card/60"
        />
      </div>

      {/* Row 3: Historie (Mobile: next row, Desktop: same row) */}
      <HistoryTile
        startDate={range.startDate}
        endDate={range.endDate}
        className="col-span-2 bg-card/90 dark:bg-card/60"
      />

      {/* Row 4: Delta and PieChart */}

      <PieChartTileIcons
        startDate={range.startDate}
        endDate={range.endDate}
        className="col-span-1 bg-card/90 dark:bg-card/60"
      />
      <DeltaTile
        startDate={range.startDate}
        endDate={range.endDate}
        className="col-span-1 bg-card/90 dark:bg-card/60"
      />
    </div>
  )
}

export default GraphGrids
