'use client'

import { useState } from "react"
import SelectorTile from './tiles/selector-tile'
import BalanceTile from './tiles/balance-tile'
import DeltaTile from './tiles/delta-tile'
import HistoryTile from './tiles/history-tile'
import PieChartTile from './tiles/pie-chart-tile'
import SavingsGoal from "./tiles/savings-goal-tile"

function GraphGrids() {

  const [timeRange, setTimeRange] = useState("90d")
  
  return (
    <div>
      {/* Grid 1st Row */ }
      <div className="gap-2 pt-2 grid grid-cols-3 mx-2">
        {/* Kontostand - Full width on mobile, 1 col on desktop */}
        <div className="col-span-2 w-full h-full justify-center">
          <BalanceTile/>
        </div>
        {/* Time-Range Selector */}
        <div className="col-span-1">
          <SelectorTile value={timeRange} onValueChange={setTimeRange}/>
        </div>
      </div>
      {/* Grid Remaining Rows */ }
      <div className="gap-2 grid grid-cols-2 mt-2 mx-2">
        {/* SparZiel */}
        <div className="col-span-2 lg:col-span:2">
          <SavingsGoal />
        </div>

        {/* Historie - Full width on mobile, 2 cols on desktop */}
        <div className="col-span-2 lg:col-span-2">
          <HistoryTile timeRange={timeRange}/>
        </div>

        {/* PieChart - 1 col on mobile, 1 col on desktop */}
        <div className="col-span-1 lg:col-span-1">
          <PieChartTile />
        </div>

        {/* Delta - 1 col on mobile, moves to row 2 col 1 on desktop */}
        <div className="lg:order-first col-span-1 lg:col-span-1 lg:row-start-2">
          <DeltaTile />
        </div>
      </div>
    </div>
  )
}

export default GraphGrids
