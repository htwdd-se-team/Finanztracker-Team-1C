'use client'

import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ReferenceLine } from 'recharts'
import { TrendingUp, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { apiClient } from '@/api/api-client'
import { useQuery } from '@tanstack/react-query'
import { ApiGranularity } from '@/__generated__/api'
import { cn } from '@/lib/utils'

type HistoryTileProps = {
  startDate: string
  endDate: string
  className?: string
}

const chartConfig = {
  kontostand: {
    label: 'Kontostand',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig

export default function HistoryTile({
  startDate,
  endDate,
  className,
}: HistoryTileProps) {

  const { data: graphData } = useQuery({
    queryKey: ['transactions', 'history-tile', startDate, endDate],
    queryFn: () =>
      apiClient.analytics.analyticsControllerGetTransactionBalanceHistory({
        startDate: startDate,
        endDate: endDate,
        granularity: ApiGranularity.DAY,
      }),
    select: data => {
      const mapped = data.data.map(item => ({
        date: new Date(item.date).toISOString(),
        kontostand: Math.round(Number(item.value) / 100),
      }))
      if (mapped.length > 0) {
        const firstValue = mapped[0].kontostand
        const userStartISO = new Date(startDate).toISOString()

        // Erster eingetragener Kontostand-Value liegt hinter dem Startdate
        if (new Date(mapped[0].date) > new Date(startDate)) {
          mapped.unshift({
            date: userStartISO,
            kontostand: firstValue,
          })
        }
      }
      return mapped
    },
    placeholderData: previousData => previousData,
    })

  if (!graphData) {
    return (
      <Card className={cn(className)}>
        <CardContent className="flex justify-center items-center h-full">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  // Logic behind y-Axis Scale
  const values = graphData.map(item => item.kontostand)
  const trueMin = Math.min(...values)
  const trueMax = Math.max(...values)
  // Add 10% Buffer
  const bufferedMin = trueMin < 0 ? trueMin * 1.15 : trueMin * 0.85
  const bufferedMax = trueMax > 0 ? trueMax * 1.15 : trueMax * 0.85
  const diff = Math.abs(bufferedMax - bufferedMin)
  const step = Math.pow(10, Math.floor(Math.log10(diff)))
  const roundedMinY = Math.floor(bufferedMin / step) * step
  const roundedMaxY = Math.ceil(bufferedMax / step) * step

  const hasPositive = trueMax > 0
  const hasNegative = trueMin < 0

  return (
    <Card className={cn('p-0',className)}>
      <CardHeader className="p-0 m-0">
        <CardTitle className="p-0 ml-1.5 mt-1.5 mb-0 flex gap-1 font-medium">
          <TrendingUp className="w-4 h-4 shrink-0" /> Kontoverlauf
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 mr-1.5 mt-0">
        <ChartContainer
          config={chartConfig}
          className="w-full max-h-[150px] sm:max-h-[200px] -mt-4"
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
            <CartesianGrid vertical={false}/>
            {hasPositive && hasNegative && (
              <ReferenceLine
              y={0} stroke="#999" strokeDasharray="3 3"
              label={{
                value: "0 €",
                position: "left",
                fill: "#666",
                fontSize: 11,
                dx: -3,
              }}/>
            )}
            <YAxis
              width={54}
              tickMargin={2}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              tickCount={3}
              domain={[roundedMinY, roundedMaxY]}
              tickFormatter={value =>
                roundedMaxY >= 10000 ? `${value / 1000}k €` : `${value} €`
              }
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              minTickGap={32}
              tickFormatter={value => {
                const date = new Date(value)
                const day = date.toLocaleDateString('de-DE', { day: '2-digit' })
                const month = date.toLocaleDateString('de-DE', {
                  month: 'short',
                })
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
              type="monotone"
              fill="url(#fillKontostand)"
              stroke="var(--color-chart-2)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
