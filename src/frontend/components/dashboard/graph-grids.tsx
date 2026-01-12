'use client'

import { useState, useMemo, useEffect } from 'react'
import SelectorTile from './tiles/selector-tile'
import BalanceTile from './tiles/balance-tile'
import DeltaTile from './tiles/delta-tile'
import HistoryTile from './tiles/history-tile'
import PieChartTileIcons from './tiles/pie-chart-icons-tile'
import { today, getLocalTimeZone, CalendarDate } from '@internationalized/date'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/api-client'

type RangeState = {
  type: string
  startDate: string
  endDate: string
}

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

export default function GraphGrids() {
  const now = today(getLocalTimeZone())

  const [range, setRange] = useSessionRange<RangeState>('dashboard-range', {
    type: 'all',
    startDate: new CalendarDate(1900, 1, 1).toString(),
    endDate: now.toString(),
  })

  const { data: firstTxData } = useQuery({
    queryKey: ['analytics', 'first-transaction-date'],
    queryFn: async () => {
      const res =
        await apiClient.analytics.analyticsControllerGetFirstTransactionDate()
      return res.data
    },
  })

  const computedRange = useMemo(() => {
    if (range.type !== 'all') return range

    const endDate = now.toString()

    if (firstTxData?.date) {
      const d = new Date(firstTxData.date)
      const start = new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate())
      return { ...range, startDate: start.toString(), endDate }
    }

    return { ...range, startDate: new CalendarDate(1900, 1, 1).toString(), endDate }
  }, [range, firstTxData?.date, now])

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

      {/* Row 3: Historie */}
      <HistoryTile
        startDate={computedRange.startDate}
        endDate={computedRange.endDate}
        className="col-span-2 bg-card/90 dark:bg-card/60"
      />

      {/* Row 4: Delta and PieChart */}
      <PieChartTileIcons
        startDate={computedRange.startDate}
        endDate={computedRange.endDate}
        className="col-span-1 bg-card/90 dark:bg-card/60"
      />
      <DeltaTile
        startDate={computedRange.startDate}
        endDate={computedRange.endDate}
        className="col-span-1 bg-card/90 dark:bg-card/60"
      />
    </div>
  )
}
