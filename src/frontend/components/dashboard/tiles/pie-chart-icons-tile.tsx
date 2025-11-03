'use client'

import { Loader2, PieChartIcon } from 'lucide-react'
import { Pie, PieChart, ResponsiveContainer, Cell, Label } from 'recharts'

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
import { useCategory } from '@/components/provider/category-provider'
import { IconMap, IconNames } from '@/lib/icon-map'
import { CategoryColors } from '@/lib/color-map'
import { cn } from '@/lib/utils'

interface TransformedChartData {
  id: number
  name: string
  value: number // in €
  icon: IconNames
  color: CategoryColors | string
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

// Threshold in percent - adjust to test different values
// Try 5, 10, or 15 to find the appropriate size
const SMALL_CATEGORY_THRESHOLD_PERCENT = 10

export default function PieChartTileIcons({
  timeRange,
  className,
}: {
  timeRange: string
  className?: string
}) {
  const today = DateTime.now()
  const startDate = today.minus({
    days: timeRange === 'all' ? 365 : Number(timeRange.split('d')[0]),
  })

  const { getCategoryFromId } = useCategory()

  const { data } = useQuery({
    queryKey: ['transactions', 'pie-chart-icons', timeRange],
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

      const transformedData: TransformedChartData[] = Object.entries(
        categoryTotals
      )
        .map(([categoryId, totalValue], idx) => {
          const category = getCategoryFromId(parseInt(categoryId))
          if (category) {
            return {
              id: category.id,
              name: category.name,
              value: totalValue,
              icon: category.icon,
              color: colorPalette[idx % colorPalette.length],
            }
          }
          return null
        })
        .filter((item): item is TransformedChartData => item !== null)

      // Calculate total to determine percentages
      const totalValue = transformedData.reduce(
        (sum, item) => sum + item.value,
        0
      )

      // Separate small and large categories
      const largeCategoriesWithThreshold = transformedData.filter(
        item =>
          (item.value / totalValue) * 100 >= SMALL_CATEGORY_THRESHOLD_PERCENT
      )

      const smallCategories = transformedData.filter(
        item =>
          (item.value / totalValue) * 100 < SMALL_CATEGORY_THRESHOLD_PERCENT
      )

      // Add small categories to "Other" if they exist
      if (smallCategories.length > 0) {
        const otherValue = smallCategories.reduce(
          (sum, item) => sum + item.value,
          0
        )
        largeCategoriesWithThreshold.push({
          id: -1,
          name: 'Sonstiges',
          value: otherValue,
          icon: IconNames.RECEIPT,
          color:
            colorPalette[
              largeCategoriesWithThreshold.length % colorPalette.length
            ],
        })
      }

      return largeCategoriesWithThreshold
    },
  })

  const RADIAN = Math.PI / 180

  if (!data) {
    return (
      <Card className={cn(className)}>
        <CardContent className="flex justify-center items-center h-full">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

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
    const IconComponent = IconMap[data[index]?.icon as keyof typeof IconMap]

    if (!IconComponent) {
      return null
    }

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
    <Card className={cn('p-1.5', className)}>
      <CardTitle className="flex items-center gap-1 -mb-5 font-medium">
        <PieChartIcon className="w-4 h-4 shrink-0" />
        Kategorien
      </CardTitle>
      <CardContent className="flex flex-1 justify-center items-center m-0 p-0 w-full h-full overflow-hidden">
        <ChartContainer
          config={chartConfig}
          className="flex justify-center items-center w-full md:max-h-[200px] aspect-square"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <ChartTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as TransformedChartData
                    return (
                      <div className="bg-background shadow p-2 rounded text-xs">
                        <div className="font-semibold">{item.name}</div>
                        <div>
                          {item.value.toLocaleString('de-DE', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}{' '}
                          €
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
                label={renderCustomizedLabel}
                innerRadius="50%"
                outerRadius="95%"
                dataKey="value"
                stroke="var(--background)"
                strokeWidth={1}
              >
                {data?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color as string} />
                ))}
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
                          className="fill-foreground font-bold text-lg lg:text-xl"
                        >
                          {data
                            .reduce((acc, item) => acc + item.value, 0)
                            .toLocaleString('de-DE', {
                              style: 'currency',
                              currency: 'EUR',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })}
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
