'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { PieChart as PieChartIcon } from 'lucide-react'
import { Label, Pie, PieChart, Cell } from 'recharts'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { useCategory } from '@/components/provider/category-provider'
import { apiClient } from '@/api/api-client'
import { useQuery } from '@tanstack/react-query'
import { DateTime } from 'luxon'
import { ApiGranularity, ApiTransactionType } from '@/__generated__/api'

function PieChartTile() {
  const { categories, getCategoryFromId } = useCategory()

  // const days =  <get from props>
  const today = DateTime.now()
  const startDate = today.minus({ days: 31 })

  const { data } = useQuery({
    queryKey: ['transactions', 'pie-chart-tile'],
    queryFn: () =>
      apiClient.analytics.analyticsControllerGetTransactionBreakdown({
        startDate: startDate.toISO(),
        endDate: today.toISO(),
        granularity: ApiGranularity.MONTH,
        withCategory: true,
      }),
    select: data => data.data.data,
  })

  const { chartData, chartConfig, totalAmount } = useMemo(() => {
    if (!data) return { chartData: [], chartConfig: {}, totalAmount: 0 }

    // Reduce data to categories with proper typing
    const categoryTotals: Record<string, number> = data
      .filter(item => item.type === ApiTransactionType.EXPENSE)
      .reduce(
        (acc, curr) => {
          // Only process items that have a category
          if (curr.category !== undefined) {
            const category = getCategoryFromId(curr.category)
            if (category) {
              const value = parseFloat(curr.value) / 100 // Convert from cents to euros
              acc[category.name] = (acc[category.name] || 0) + value
            }
          }
          return acc
        },
        {} as Record<string, number>
      )

    // Convert to chart data format
    const chartDataArray = Object.entries(categoryTotals).map(
      ([name, value]) => {
        const category = categories.find(cat => cat.name === name)
        return {
          kategorie: name,
          ausgaben: value,
          fill: category?.color || '#8884d8', // fallback color
        }
      }
    )

    // Create dynamic chart config
    const dynamicChartConfig: ChartConfig = {
      ausgaben: {
        label: 'Ausgaben',
      },
    }

    // Add each category to the config
    chartDataArray.forEach(item => {
      const category = categories.find(cat => cat.name === item.kategorie)
      if (category) {
        dynamicChartConfig[item.kategorie] = {
          label: category.name,
          color: category.color,
        }
      }
    })

    const total = chartDataArray.reduce((sum, item) => sum + item.ausgaben, 0)

    return {
      chartData: chartDataArray,
      chartConfig: dynamicChartConfig,
      totalAmount: total,
    }
  }, [data, categories, getCategoryFromId])

  if (!data || chartData.length === 0) return <>{JSON.stringify(data)}</>

  return (
    <Card className="flex flex-col p-0 h-48 lg:h-64">
      <CardTitle className="flex items-center gap-1 mx-2 mt-2 -mb-5 font-medium">
        <PieChartIcon className="w-4 h-4 shrink-0" />
        Kategorien
      </CardTitle>
      <CardContent className="flex flex-1 justify-center items-center w-full h-full overflow-hidden">
        <ChartContainer
          className="flex justify-center items-center w-full max-h-full aspect-square"
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
            >
              {chartData.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={entry.fill} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
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
                          className="fill-foreground font-bold text-xl"
                        >
                          {totalAmount.toLocaleString()} €
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
