'use client'

import { Loader2, PieChartIcon } from 'lucide-react'
import { Pie, PieChart, ResponsiveContainer, Cell, Label } from 'recharts'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from '@/components/ui/chart'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/api-client'
import { ApiGranularity, ApiTransactionType } from 'api-client'
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

// Special category ID for "Andere" (uncategorized from backend)
const ANDERE_CATEGORY_ID = 0

// Threshold: categories below this percentage get merged into "Andere"
const SMALL_CATEGORY_THRESHOLD_PERCENT = 5

export default function PieChartTileIcons({
  startDate,
  endDate,
  className,
}: {
  startDate: string
  endDate: string
  className?: string
}) {
  const { getCategoryFromId } = useCategory()

  const { data } = useQuery({
    queryKey: ['transactions', 'pie-chart-icons', startDate, endDate],
    enabled: Boolean(startDate && endDate),
    queryFn: () =>
      apiClient.analytics.analyticsControllerGetTransactionBreakdown({
        startDate,
        endDate,
        granularity: ApiGranularity.MONTH,
        withCategory: true,
      }),
    select: data => {
      // Aggregate totals by category
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

      // Transform to chart data format
      const transformedData: TransformedChartData[] = Object.entries(
        categoryTotals
      )
        .map(([categoryIdStr, totalValue], idx) => {
          const categoryId = parseInt(categoryIdStr)

          // Handle "Andere" category (ID 0) from backend (uncategorized)
          if (categoryId === ANDERE_CATEGORY_ID) {
            return {
              id: ANDERE_CATEGORY_ID,
              name: 'Andere',
              value: totalValue,
              icon: IconNames.RECEIPT,
              color: colorPalette[idx % colorPalette.length],
            }
          }

          const category = getCategoryFromId(categoryId)
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

      // Calculate total for percentage threshold
      const totalValue = transformedData.reduce(
        (sum, item) => sum + item.value,
        0
      )

      if (totalValue === 0) return transformedData

      // Separate large categories (>= threshold) and small categories (< threshold)
      const largeCategories = transformedData.filter(
        item =>
          item.id !== ANDERE_CATEGORY_ID &&
          (item.value / totalValue) * 100 >= SMALL_CATEGORY_THRESHOLD_PERCENT
      )

      const smallCategories = transformedData.filter(
        item =>
          item.id !== ANDERE_CATEGORY_ID &&
          (item.value / totalValue) * 100 < SMALL_CATEGORY_THRESHOLD_PERCENT
      )

      // Find existing "Andere" from uncategorized transactions
      const existingAndere = transformedData.find(
        item => item.id === ANDERE_CATEGORY_ID
      )
      const andereBaseValue = existingAndere?.value ?? 0

      // Sum small categories into "Andere"
      const smallCategoriesValue = smallCategories.reduce(
        (sum, item) => sum + item.value,
        0
      )

      const andereTotalValue = andereBaseValue + smallCategoriesValue

      // Re-assign colors to large categories
      const result = largeCategories.map((item, idx) => ({
        ...item,
        color: colorPalette[idx % colorPalette.length],
      }))

      // Add "Andere" if there's any value
      if (andereTotalValue > 0) {
        result.push({
          id: ANDERE_CATEGORY_ID,
          name: 'Andere',
          value: andereTotalValue,
          icon: IconNames.RECEIPT,
          color: colorPalette[result.length % colorPalette.length],
        })
      }

      return result
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

  // Empty state placeholder
  if (data.length === 0) {
    return (
      <Card className={cn('p-1.5', className)}>
        <CardTitle className="flex items-center gap-1 -mb-5 font-medium">
          <PieChartIcon className="w-4 h-4 shrink-0" />
          Kategorien
        </CardTitle>
        <CardContent className="flex flex-1 justify-center items-center m-0 p-0 w-full h-full min-h-[200px]">
          <p className="text-muted-foreground text-sm">Keine Daten verfügbar</p>
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
          className="pointer-events-none"
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
