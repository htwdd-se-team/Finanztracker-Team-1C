'use client'

import { PieChartIcon } from 'lucide-react'
import { Pie, PieChart, ResponsiveContainer, Cell } from 'recharts'

import { Card, CardContent, CardTitle } from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from '@/components/ui/chart'
import { DateTime } from 'luxon'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/api-client'
import { ApiGranularity, ApiTransactionType } from '@/__generated__/api'
import { Category, useCategory } from '@/components/provider/category-provider'
import { IconMap } from '@/lib/icon-map'

interface TransformedChartData extends Category {
  value: number // in €
}

const chartConfig = {
  value: {
    label: 'Ausgaben',
  },
} satisfies ChartConfig

interface LabelProps {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  index: number
  data: TransformedChartData[]
}

const colorPalette = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
]

export default function PieChartTileIcons() {
  const today = DateTime.now()
  const startDate = today.minus({ days: 31 })

  const { getCategoryFromId } = useCategory()

  const { data } = useQuery({
    queryKey: ['transactions', 'delta-tile'],
    queryFn: () =>
      apiClient.analytics.analyticsControllerGetTransactionBreakdown({
        startDate: startDate.toISO(),
        endDate: today.toISO(),
        granularity: ApiGranularity.MONTH,
        withCategory: true,
      }),
    select: data => {
      const categoryTotals = data.data.data
        .filter(item => item.type === ApiTransactionType.EXPENSE)
        .filter(item => item.category !== undefined)
        .reduce(
          (acc, item) => {
            const categoryId = item.category!
            const value = parseFloat(item.value) / 100
            acc[categoryId] = (acc[categoryId] || 0) + value
            return acc
          },
          {} as Record<number, number>
        )

      return Object.entries(categoryTotals)
        .map(([categoryId, totalValue], idx) => {
          const category = getCategoryFromId(parseInt(categoryId))
          if (category) {
            return {
              ...category,
              value: totalValue,
              color: colorPalette[idx % colorPalette.length],
            }
          }
          return null
        })
        .filter((item): item is TransformedChartData => item !== null)
    },
  })

  const RADIAN = Math.PI / 180

  // TODO: Add loading state
  if (!data) return null

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    index,
  }: LabelProps) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    const IconComponent = IconMap[data[index].icon as keyof typeof IconMap]

    return (
      <g>
        <foreignObject
          x={x - 12}
          y={y - 12}
          width={24}
          height={24}
          style={{ overflow: 'visible' }}
        >
          <div className="flex justify-center items-center w-6 h-6">
            <IconComponent className="drop-shadow-sm w-4 h-4 text-white" />
          </div>
        </foreignObject>
      </g>
    )
  }

  return (
    <Card className="flex flex-col p-0 h-48 lg:h-64">
      <CardTitle className="flex items-center gap-1 mx-2 mt-2 -mb-5 font-medium">
        <PieChartIcon className="w-4 h-4 shrink-0" />
        Kategorien
      </CardTitle>
      <CardContent className="flex flex-1 justify-center items-center w-full h-full overflow-hidden">
        <ChartContainer
          config={chartConfig}
          className="flex justify-center items-center w-full max-h-full aspect-square"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <ChartTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload
                    const iconName = item.icon
                    const IconComponent =
                      IconMap[iconName as keyof typeof IconMap]
                    return (
                      <div className="bg-background shadow-md p-2 border rounded-lg">
                        <div className="flex items-center gap-2">
                          {IconComponent && (
                            <IconComponent className="w-4 h-4" />
                          )}
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <div className="text-muted-foreground text-sm">
                          {item.value.toFixed(2)}€
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={props =>
                  renderCustomizedLabel({ ...props, data: data || [] })
                }
                outerRadius="95%"
                innerRadius="30%"
                fill="#8884d8"
                dataKey="value"
                stroke="white"
                strokeWidth={2}
              >
                {data?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

{
  /*
'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { PieChart as PieChartIcon } from 'lucide-react'
import { Label, LabelList, Pie, PieChart, Cell } from 'recharts'
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
import { Category } from '../../provider/category-provider';

function PieChartTile() {
  const { categories, getCategoryFromId } = useCategory()

  const colorPalette = [
    "var(--color-chart-1)",
    "var(--color-chart-2)",
    "var(--color-chart-3)",
    "var(--color-chart-4)",
    "var(--color-chart-5)",
  ]

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
      ([name, value], idx) => {
        const category = categories.find(cat => cat.name === name)
        const emojiIcons = ["🍏", "🏠", "🚗", "🍔", "💡"]
        return {
          kategorie: name,
          ausgaben: value,
          fill: colorPalette[idx % colorPalette.length],
          icon: emojiIcons[idx % emojiIcons.length] // fallback color
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
              labelLine={false}
            >
              {chartData.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={entry.fill} />
              ))}
              <LabelList
                dataKey="icon"
                position="center"
                fontSize={18}
                className="pointer-events-none"
              />
              <LabelList
                dataKey="ausgaben"
                position="outside"
                fontSize={13}
                formatter={v => v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                className="pointer-events-none"
              />
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
*/
}

{
  /*

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

  const colorPalette = [
    "var(--color-chart-1)",
    "var(--color-chart-2)",
    "var(--color-chart-3)",
    "var(--color-chart-4)",
    "var(--color-chart-5)",
  ]

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
      ([name, value], idx) => {
        const category = categories.find(cat => cat.name === name)
        return {
          kategorie: name,
          ausgaben: value,
          fill: colorPalette[idx % colorPalette.length] // fallback color
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

*/
}
