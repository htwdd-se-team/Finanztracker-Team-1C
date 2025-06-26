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

const chartData = [
  { date: '2025-04-01', kontostand: 429 },
  { date: '2025-04-02', kontostand: 418 },
  { date: '2025-04-03', kontostand: 408 },
  { date: '2025-04-04', kontostand: 431 },
  { date: '2025-04-05', kontostand: 400 },
  { date: '2025-04-06', kontostand: 368 },
  { date: '2025-04-07', kontostand: 361 },
  { date: '2025-04-08', kontostand: 373 },
  { date: '2025-04-09', kontostand: 347 },
  { date: '2025-04-10', kontostand: 329 },
  { date: '2025-04-11', kontostand: 333 },
  { date: '2025-04-12', kontostand: 330 },
  { date: '2025-04-13', kontostand: 318 },
  { date: '2025-04-14', kontostand: 346 },
  { date: '2025-04-15', kontostand: 347 },
  { date: '2025-04-16', kontostand: 349 },
  { date: '2025-04-17', kontostand: 340 },
  { date: '2025-04-18', kontostand: 327 },
  { date: '2025-04-19', kontostand: 349 },
  { date: '2025-04-20', kontostand: 352 },
  { date: '2025-04-21', kontostand: 361 },
  { date: '2025-04-22', kontostand: 351 },
  { date: '2025-04-23', kontostand: 385 },
  { date: '2025-04-24', kontostand: 368 },
  { date: '2025-04-25', kontostand: 332 },
  { date: '2025-04-26', kontostand: 325 },
  { date: '2025-04-27', kontostand: 349 },
  { date: '2025-04-28', kontostand: 347 },
  { date: '2025-04-29', kontostand: 338 },
  { date: '2025-04-30', kontostand: 333 },
  { date: '2025-05-01', kontostand: 314 },
  { date: '2025-05-02', kontostand: 360 },
  { date: '2025-05-03', kontostand: 386 },
  { date: '2025-05-04', kontostand: 369 },
  { date: '2025-05-05', kontostand: 401 },
  { date: '2025-05-06', kontostand: 429 },
  { date: '2025-05-07', kontostand: 444 },
  { date: '2025-05-08', kontostand: 430 },
  { date: '2025-05-09', kontostand: 450 },
  { date: '2025-05-10', kontostand: 440 },
  { date: '2025-05-11', kontostand: 408 },
  { date: '2025-05-12', kontostand: 426 },
  { date: '2025-05-13', kontostand: 445 },
  { date: '2025-05-14', kontostand: 447 },
  { date: '2025-05-15', kontostand: 473 },
  { date: '2025-05-16', kontostand: 450 },
  { date: '2025-05-17', kontostand: 458 },
  { date: '2025-05-18', kontostand: 419 },
  { date: '2025-05-19', kontostand: 457 },
  { date: '2025-05-20', kontostand: 441 },
  { date: '2025-05-21', kontostand: 485 },
  { date: '2025-05-22', kontostand: 455 },
  { date: '2025-05-23', kontostand: 492 },
  { date: '2025-05-24', kontostand: 471 },
  { date: '2025-05-25', kontostand: 480 },
  { date: '2025-05-26', kontostand: 451 },
  { date: '2025-05-27', kontostand: 453 },
  { date: '2025-05-28', kontostand: 409 },
  { date: '2025-05-29', kontostand: 406 },
  { date: '2025-05-30', kontostand: 409 },
  { date: '2025-05-31', kontostand: 401 },
  { date: '2025-06-01', kontostand: 375 },
  { date: '2025-06-02', kontostand: 345 },
  { date: '2025-06-03', kontostand: 335 },
  { date: '2025-06-04', kontostand: 366 },
  { date: '2025-06-05', kontostand: 325 },
  { date: '2025-06-06', kontostand: 283 },
  { date: '2025-06-07', kontostand: 314 },
  { date: '2025-06-08', kontostand: 296 },
  { date: '2025-06-09', kontostand: 263 },
  { date: '2025-06-10', kontostand: 235 },
  { date: '2025-06-11', kontostand: 231 },
  { date: '2025-06-12', kontostand: 210 },
  { date: '2025-06-13', kontostand: 224 },
  { date: '2025-06-14', kontostand: 236 },
  { date: '2025-06-15', kontostand: 192 },
  { date: '2025-06-16', kontostand: 155 },
  { date: '2025-06-17', kontostand: 182 },
  { date: '2025-06-18', kontostand: 210 },
  { date: '2025-06-19', kontostand: 240 },
  { date: '2025-06-20', kontostand: 220 },
  { date: '2025-06-21', kontostand: 234 },
  { date: '2025-06-22', kontostand: 232 },
  { date: '2025-06-23', kontostand: 260 },
  { date: '2025-06-24', kontostand: 270 },
  { date: '2025-06-25', kontostand: 240 },
  { date: '2025-06-26', kontostand: 214 },
]

const chartConfig = {
  kontostand: {
    label: "Kontostand",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export default function HistoryTile({ timeRange }: HistoryTileProps) {

const referenceDate = new Date() // <-- aktuelles Datum
let daysToSubtract = 90
if (timeRange === "30d") daysToSubtract = 30
if (timeRange === "7d") daysToSubtract = 7

const startDate = new Date(referenceDate)
startDate.setDate(startDate.getDate() - daysToSubtract)

// Filter, aber prüfe, dass die Einträge im Datenarray auch <= heute sind!
const filteredData = chartData.filter(item => {
  const date = new Date(item.date)
  return date >= startDate && date <= referenceDate
})

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
    <Card className="h-46 p-3">
      <CardHeader className="p-0 flex flex-row justify-between">
        <CardTitle className="flex items-center gap-2 font-medium">
          <TrendingUp className="w-4 h-4 shrink-0"/> Kontoverlauf
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[130px] w-full -mt-2"
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
              width={41}
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

































/*
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/api-client'
import { Loader2, TrendingUp } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import {
  ApiGranularity,
  ApiTransactionBreakdownItemDto,
} from '@/__generated__/api'

function HistoryTile() {
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - 1)

  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics', 'transaction-breakdown'],
    queryFn: async () => {
      const response =
        await apiClient.analytics.analyticsControllerGetTransactionBreakdown({
          startDate: startDate.toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          granularity: ApiGranularity.WEEK,
          // withCategory: false,
        })
      return response.data
    },
  })

  if (isLoading) {
    return (
      <Card className="h-48 lg:h-64">
        <CardContent className="flex justify-center items-center h-full">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="h-48 lg:h-64">
        <CardContent className="flex justify-center items-center h-full">
          <p className="text-muted-foreground text-sm">Fehler beim Laden</p>
        </CardContent>
      </Card>
    )
  }

  const chartData =
    data?.data?.map((item: ApiTransactionBreakdownItemDto, index: number) => ({
      week: `W${index + 1}`,
      balance: parseInt(item.value) / 100,
    })) || []

  const chartConfig = {
    balance: {
      label: 'Saldo',
      color: 'var(--chart-1)',
    },
  } satisfies ChartConfig

  return (
    <Card className="h-48 p-3">
      <CardHeader className="p-0 flex">
        <CardTitle className="flex items-center gap-2 font-medium">
          <TrendingUp className="w-4 h-4" />
          Kontostand Historie
        </CardTitle>
        <CardDescription>Wöchentliche Saldenentwicklung</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-32">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="week"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="balance" fill="var(--color-balance)" radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export default HistoryTile
*/