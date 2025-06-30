'use client'

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { TrendingUp, Loader2 } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { apiClient } from '@/api/api-client'
import { useQuery } from '@tanstack/react-query'
import { DateTime } from 'luxon'
import { ApiGranularity } from '@/__generated__/api'

type HistoryTileProps = {
  timeRange: string // 1d, 7d, 30d, 90d, 180d, all
}

const chartConfig = {
  kontostand: {
    label: 'Kontostand',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig

export default function HistoryTile({ timeRange }: HistoryTileProps) {
  const days = timeRange === 'all' ? 365 : Number(timeRange.split('d')[0])
  const today = DateTime.now()
  const startDate = today.minus({ days: days })

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', 'history-tile', timeRange],
    queryFn: () =>
      apiClient.analytics.analyticsControllerGetTransactionBalanceHistory({
        startDate: startDate.toISO(),
        endDate: today.toISO(),
        granularity: ApiGranularity.DAY,
      }),
  })

   if (isLoading || !data) {
    return (
      <Card className="h-24 lg:h-32">
        <CardContent className="flex justify-center items-center h-full">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  const graphData = data.data.map(item => ({
    date: new Date(item.date).toISOString(),
    kontostand: Math.round(Number(item.value) / 100),
  }))

  const roundedMinY =
    Math.floor(Math.min(...graphData.map(item => item.kontostand)) / 1000) *
    1000
  const roundedMaxY =
    Math.ceil(Math.max(...graphData.map(item => item.kontostand)) / 1000) * 1000

  return (
    <Card className="p-1.5 h-48">
      <CardHeader className="flex flex-row justify-between p-0">
        <CardTitle className="flex items-center gap-1 font-medium">
          <TrendingUp className="w-4 h-4 shrink-0" /> Kontoverlauf
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ChartContainer
          config={chartConfig}
          className="-mt-2 mb-0 w-full h-[150px] aspect-auto"
        >
          <AreaChart
            data={graphData}
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillKontostand" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-chart-2)"
                  stopOpacity={0.7}
                />
                <stop
                  offset="99%"
                  stopColor="var(--color-chart-2)"
                  stopOpacity={0.05}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <YAxis
              width={50}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              tickCount={3}
              domain={[roundedMinY, 'auto']}
              tickFormatter={value =>
                roundedMaxY >= 10000 ? `${value / 1000}k €` : `${value} €`
              }
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={value => {
                const date = new Date(value)
                const day = date.toLocaleDateString('de-DE', { day: '2-digit' })
                const month = date.toLocaleDateString('de-DE', { month: 'short' })
                return `${day}. ${month}`
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={value => {
                    return new Date(value).toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })
                  }}
                  formatter={value => `${value} €`}
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
