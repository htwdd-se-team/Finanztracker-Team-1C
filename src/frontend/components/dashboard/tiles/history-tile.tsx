'use client'

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {TrendingUp } from 'lucide-react'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

type HistoryTileProps = {
  timeRange: string
  // ggf. weitere Props
}


const startDate = new Date('2024-06-26')
  const chartData = []
  let kontostand = 2200 // Startwert
  for (let i = 0; i < 365; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    chartData.push({
      date: date.toISOString().slice(0, 10),
      kontostand: Math.round(kontostand),
    })
    // Schwankung zwischen -10 und +10
    kontostand += Math.floor(Math.random() * 21) - 10
  }


const chartConfig = {
  kontostand: {
    label: "Kontostand",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export default function HistoryTile({ timeRange }: HistoryTileProps) {

  const referenceDate = new Date(); // aktuelles Datum
  let filteredData;
  if (timeRange === "all") {
    filteredData = chartData.filter(item => {
      const date = new Date(item.date);
      return date <= referenceDate; // Nur Werte bis heute
    });
  } else {
    let daysToSubtract = 90;
    if (timeRange === "30d") daysToSubtract = 30;
    if (timeRange === "7d") daysToSubtract = 7;
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    filteredData = chartData.filter(item => {
      const date = new Date(item.date);
      return date >= startDate && date <= referenceDate;
    });
  }

  // Calculate y-axis range
  const yValues = filteredData.map(d => d.kontostand)
  const minY = Math.min(...yValues)
  const maxY = Math.max(...yValues)
  const range = maxY - minY
  const padding = range * 0.1
  {/* Runden, für bessere grafische Darstellung */}
  let roundedMinY, roundedMaxY
  if (maxY >= 10000 || minY <= -10000) {
  // Für hohe Werte: Tausender-Rundung
  roundedMinY = Math.floor((minY - padding) / 1000) * 1000
  roundedMaxY = Math.ceil((maxY + padding) / 1000) * 1000
} else {
  // Normale 10er-Rundung
  roundedMinY = Math.floor((minY - padding) / 10) * 10
  roundedMaxY = Math.ceil(maxY / 10) * 10 + 10
}

  return (
    <Card className="h-48 p-1.5">
      <CardHeader className="p-0 flex flex-row justify-between">
        <CardTitle className="flex items-center gap-1 font-medium">
          <TrendingUp className="w-4 h-4 shrink-0"/> Kontoverlauf
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[150px] w-full -mt-2 mb-0"
        >
          <AreaChart data={filteredData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fillKontostand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-chart-2)" stopOpacity={0.7} />
                <stop offset="99%" stopColor="var(--color-chart-2)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <YAxis
              width={50}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              tickCount={3}
              domain={[roundedMinY, roundedMaxY]}
              tickFormatter={value => roundedMaxY >= 10000 ? `${value / 1000}k €` : `${value} €`}
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="kontostand"
              type="natural"
              fill="url(#fillKontostand)"
              stroke="var(--color-chart-2)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}