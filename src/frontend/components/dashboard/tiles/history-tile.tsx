'use client'

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
          withCategory: false,
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
      color: 'hsl(var(--chart-1))',
    },
  } satisfies ChartConfig

  return (
    <Card className="h-48 lg:h-64">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 font-medium text-sm">
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
