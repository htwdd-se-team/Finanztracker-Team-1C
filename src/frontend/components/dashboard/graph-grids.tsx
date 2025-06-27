'use client'

import BalanceTile from './tiles/balance-tile'
import DeltaTile from './tiles/delta-tile'
import HistoryTile from './tiles/history-tile'
import PieChartTile from './tiles/pie-chart-tile'
import SavingsGoalsTile from './tiles/savings-goals-tile'

function GraphGrids() {
  return (
    <div className="gap-4 grid grid-cols-2 lg:grid-cols-3">
      {/* Kontostand - Full width on mobile, 1 col on desktop */}
      <div className="col-span-2 lg:col-span-1">
        <BalanceTile />
      </div>

      {/* Historie - Full width on mobile, 2 cols on desktop */}
      <div className="col-span-2 lg:col-span-2">
        <HistoryTile />
      </div>

      {/* PieChart - 1 col on mobile, 1 col on desktop */}
      <div className="col-span-1 lg:col-span-1">
        <PieChartTile />
      </div>

      {/* Delta - 1 col on mobile, moves to row 2 col 1 on desktop */}
      <div className="lg:order-first col-span-1 lg:col-span-1 lg:row-start-2">
        <DeltaTile />
      </div>

      {/* Savings Goals - Hidden on mobile, 1 col on desktop */}
      <div className="hidden lg:block lg:col-span-1">
        <SavingsGoalsTile />
      </div>
    </div>
  )
}

export default GraphGrids
