'use client'

import { useMemo } from "react"
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { PieChart as PieChartIcon } from 'lucide-react'
import { Label, Pie, PieChart, Cell } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const chartData = [
  { kategorie: "lebensmittel", ausgaben: 275, fill: "var(--chart-1)" },
  { kategorie: "luxus", ausgaben: 200, fill: "var(--chart-2)" },
  { kategorie: "haushalt", ausgaben: 287, fill: "var(--chart-3)" },
  { kategorie: "freizeit", ausgaben: 173, fill: "var(--chart-4)" },
  { kategorie: "transport", ausgaben: 190, fill: "var(--chart-5)" },
]

const chartConfig = {
  ausgaben: {
    label: "Ausgaben",
  },
  lebensmittel: {
    label: "Lebensmittel",
    color: "var(--chart-1)",
  },
  luxus: {
    label: "Luxus",
    color: "var(--chart-2)",
  },
  haushalt: {
    label: "Haushalt",
    color: "var(--chart-3)",
  },
  freizeit: {
    label: "Freizeit",
    color: "var(--chart-4)",
  },
  transport: {
    label: "Transport",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig


function PieChartTile() {
  
  const totalVisitors = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.ausgaben, 0)
  }, [])
  
  return (
    <Card className="h-48 lg:h-64 p-0 flex flex-col">
      <CardTitle className="flex items-center gap-1 font-medium -mb-5 mt-2 mx-2">
        <PieChartIcon className="w-4 h-4 shrink-0" />
        Kategorien
      </CardTitle>
      <CardContent className="overflow-hidden flex-1 flex items-center justify-center h-full w-full">
        <ChartContainer
          className="w-full aspect-square max-h-full flex items-center justify-center"
          config={chartConfig}
          >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="ausgaben"
              nameKey="kategorie"
              innerRadius="65%"
              outerRadius="105%"
              strokeWidth={3}
            > { /*border border-red-500*/}
              {chartData.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={entry.fill} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                    <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-xl font-bold"
                        >
                          {totalVisitors.toLocaleString()} €
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export default PieChartTile
