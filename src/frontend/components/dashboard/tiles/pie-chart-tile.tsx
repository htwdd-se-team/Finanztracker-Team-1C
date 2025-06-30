"use client"

import {PieChartIcon, Loader2} from 'lucide-react'
import { Label, Pie, PieChart, ResponsiveContainer} from "recharts"
import { Card, CardContent, CardTitle} from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip} from "@/components/ui/chart"
import { useMemo } from 'react'
import { useCategory } from '@/components/provider/category-provider'
import { apiClient } from '@/api/api-client'
import { useQuery } from '@tanstack/react-query'
import { DateTime } from 'luxon'
import { ApiGranularity, ApiTransactionType } from '@/__generated__/api'
import { IconMap } from '@/lib/icon-map'

export default function PieChartTile({ timeRange }: { timeRange: string }) {
  const { categories, getCategoryFromId } = useCategory()

  const colorPalette = [
    "var(--color-chart-1)",
    "var(--color-chart-2)",
    "var(--color-chart-3)",
    "var(--color-chart-4)",
    "var(--color-chart-5)",
  ]

  const days = timeRange === 'all' ? 365 : Number(timeRange.split('d')[0])
  const today = DateTime.now()
  const startDate = today.minus({ days })

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', 'pie-chart-tile', timeRange],
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

  if (isLoading || !data) {
    return (
      <Card className="h-24 lg:h-32">
        <CardContent className="flex justify-center items-center h-full">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

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
      ([name, value], idx) => {
        const category = categories.find(cat => cat.name === name)
        return {
          kategorie: name,
          ausgaben: value,
          fill: colorPalette[idx % colorPalette.length],
          icon: category?.icon
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

const RADIAN = Math.PI / 180

function renderCustomizedLabel({ cx, cy, midAngle, innerRadius, outerRadius, index }) {
  if (typeof index !== "number" || !chartData[index]) return null
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  const IconComponent = IconMap[chartData[index].icon as keyof typeof IconMap]

  return (
    <foreignObject
      x={x - 12}
      y={y - 12}
      width={24}
      height={24}
      style={{ overflow: 'visible' }}
    >
      <div className="flex justify-center items-center w-6 h-6 pointer-events-none">
        <IconComponent className="drop-shadow-sm w-4 h-4 text-white" />
      </div>
    </foreignObject>
  )
}

  return (
    <Card className="flex flex-col p-0 h-48 lg:h-64">
      <CardTitle className="flex items-center gap-1 mx-2 mt-2 -mb-5 font-medium">
        <PieChartIcon className="w-4 h-4 shrink-0" />
        Kategorien
      </CardTitle>
      <CardContent className="flex flex-1 justify-center items-center w-full h-full overflow-hidden p-0 m-0">
        <ChartContainer
          config={chartConfig}
          className="flex justify-center items-center w-full max-h-full aspect-square p-0"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <ChartTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload
                    return (
                      <div className="bg-background p-2 rounded shadow text-xs">
                        <div className="font-semibold">{item.kategorie}</div>
                        <div>{item.ausgaben.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €</div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Pie
                data={chartData}
                dataKey="ausgaben"
                innerRadius="50%"
                outerRadius="95%"
                labelLine={false}
                label={renderCustomizedLabel}
              >
                <Label
                  position="center"
                  content={({ viewBox }) => {
                    if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="fill-foreground font-bold text-xl"
                        >
                          {totalAmount.toLocaleString('de-DE', { 
                            style: 'currency', 
                            currency: 'EUR' , 
                            minimumFractionDigits: 0, 
                            maximumFractionDigits: 0})}
                        </text>
                      )
                    }
                    return null
                  }}
                  />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
