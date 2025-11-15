'use client'

import { useState } from 'react'
import SelectorTile from './tiles/selector-tile'
import BalanceTile from './tiles/balance-tile'
import DeltaTile from './tiles/delta-tile'
import HistoryTile from './tiles/history-tile'
import SavingsGoal from './tiles/savings-goal-tile'
import PieChartTileIcons from './tiles/pie-chart-icons-tile'
import { today, getLocalTimeZone } from '@internationalized/date'

function GraphGrids() {
  const now = today(getLocalTimeZone())
  const oneYearAgo = now.subtract({ years: 1 })
  const [range, setRange] = useState({
    type: 'all',
    startDate: oneYearAgo.toString(),
    endDate: now.toString(),
  })

  return (
    <div className="gap-2 grid grid-cols-2 lg:grid-cols-3 mx-2 pt-2">
      {/* Row 1: Kontostand (Balance + Selector) */}
      <div className="gap-2 grid grid-cols-3 col-span-2 lg:col-span-3">
        <BalanceTile className="col-span-2 bg-card/90 dark:bg-card/30" />
        <SelectorTile
          value={range.type}
          onRangeChange={setRange}
          className="col-span-1 bg-card/90 dark:bg-card/30"
        />
      </div>

      {/* Row 1: Historie (Mobile: next row, Desktop: same row) */}
      <HistoryTile
        startDate={range.startDate}
        endDate={range.endDate}
        className="col-span-2 lg:col-span-3 bg-card/90 dark:bg-card/30"
      />

      {/* Row 2: Savings Goal - Always full width on second line */}
      <SavingsGoal className="col-span-2 lg:col-span-3 p-1.5 bg-card/90 dark:bg-card/30" />

      {/* Row 3: Delta and PieChart */}

      <PieChartTileIcons
        startDate={range.startDate}
        endDate={range.endDate}
        className="col-span-1 lg:col-span-1 bg-card/90 dark:bg-card/30"
      />
      <DeltaTile
        startDate={range.startDate}
        endDate={range.endDate}
        className="col-span-1 lg:col-span-1 bg-card/90 dark:bg-card/30"
      />
    </div>
  )
}

export default GraphGrids
