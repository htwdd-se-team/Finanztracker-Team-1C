'use client'

import { useState } from 'react'
import SelectorTile from './tiles/selector-tile'
import BalanceTile from './tiles/balance-tile'
import DeltaTile from './tiles/delta-tile'
import HistoryTile from './tiles/history-tile'
import SavingsGoal from './tiles/savings-goal-tile'
import PieChartTileIcons from './tiles/pie-chart-icons-tile'

function GraphGrids() {
  const [timeRange, setTimeRange] = useState('90d')

  return (
    <div className="gap-2 grid grid-cols-2 lg:grid-cols-3 mx-2 pt-2">
      {/* Row 1: Kontostand (Balance + Selector) */}
      <div className="gap-2 grid grid-cols-3 col-span-2 lg:col-span-3">
        <BalanceTile className="col-span-2" />
        <SelectorTile
          value={timeRange}
          onValueChange={setTimeRange}
          className="col-span-1"
        />
      </div>

      {/* Row 1: Historie (Mobile: next row, Desktop: same row) */}
      <HistoryTile
        timeRange={timeRange}
        className="col-span-2 lg:col-span-3"
      />

      {/* Row 2: Savings Goal - Always full width on second line */}
      <SavingsGoal className="col-span-2 lg:col-span-3 p-1.5" />

      {/* Row 3: Delta and PieChart */}

      <PieChartTileIcons
        timeRange={timeRange}
        className="col-span-1 lg:col-span-1"
      />
      <DeltaTile
        timeRange={timeRange}
        className="col-span-1 lg:col-span-1"
      />
    </div>
  )
}

export default GraphGrids
