'use client'

import { Loader2, PieChartIcon } from 'lucide-react'
import { Pie, PieChart, ResponsiveContainer, Cell, Label } from 'recharts'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/api-client'
import { useCategory } from '@/components/provider/category-provider'
import { IconMap, IconNames } from '@/lib/icon-map'
import { cn } from '@/lib/utils'

interface TransformedChartData {
  id: number
  name: string
  value: number // €
  icon: IconNames
  color: string
}

const chartConfig = {
  value: { label: 'Betrag' },
} satisfies ChartConfig

// Farbschemata
const incomeColors = [
  'hsl(140, 60%, 45%)',
  'hsl(140, 55%, 55%)',
  'hsl(140, 50%, 65%)',
  'hsl(140, 45%, 75%)',
]

const expenseColors = [
  'hsl(0, 70%, 55%)',
  'hsl(0, 65%, 65%)',
  'hsl(0, 60%, 75%)',
  'hsl(0, 55%, 85%)',
]

interface PieLabelProps {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  index: number
}

export default function CapitalPieChart({ className }: { className?: string }) {
  const { getCategoryFromId } = useCategory()

  // Query: Recurring Entries
  const data = useQuery({
    queryKey: ['capital-pie-chart'],
    queryFn: async () => {
      const res = await apiClient.entries.entryControllerGetScheduledEntries({ take: 999 })
      return res.data.entries
    },
    select: entries => {
      const incomeTotals: Record<number, number> = {}
      const expenseTotals: Record<number, number> = {}

      entries.forEach(entry => {
        if (!entry.categoryId) return

        const value = entry.amount / 100
        const categoryId = entry.categoryId

        if (entry.type === 'INCOME') {
          incomeTotals[categoryId] = (incomeTotals[categoryId] || 0) + value
        } else {
          expenseTotals[categoryId] = (expenseTotals[categoryId] || 0) + value
        }
      })

      const transform = (
        totals: Record<number, number>,
        colors: string[]
      ): TransformedChartData[] =>
        Object.entries(totals).map(([categoryId, total], idx) => {
          const category = getCategoryFromId(Number(categoryId))
          return {
            id: category.id,
            name: category.name,
            value: total,
            icon: category.icon,
            color: colors[idx % colors.length],
          }
        })

      const incomeData = transform(incomeTotals, incomeColors)
      const expenseData = transform(expenseTotals, expenseColors)

      return {
        incomeData,
        expenseData,
        pieData: [...incomeData, ...expenseData],
      }
    },
  })

  // Query: Available Capital
  const availableCapitalQuery = useQuery({
    queryKey: ['available-capital'],
    queryFn: async () => {
      const res = await apiClient.analytics.analyticsControllergetAvailableCapital()
      return Number(res.data.availableCapital) / 100
    },
  })

  const isLoading =
    data.isLoading || availableCapitalQuery.isLoading

  if (isLoading || !data.data || availableCapitalQuery.data == null) {
    return (
      <Card className={cn(className)}>
        <CardContent className="flex justify-center items-center h-full">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  const { pieData } = data.data
  const availableCapital = availableCapitalQuery.data
  const RADIAN = Math.PI / 180

  const renderLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    index,
  }: PieLabelProps) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    const item = pieData[index]
    const IconComponent = IconMap[item.icon as keyof typeof IconMap]
    if (!IconComponent) return null

    return (
      <foreignObject x={x - 12} y={y - 12} width={24} height={24} style={{ overflow: 'visible' }}>
        <div className="flex justify-center items-center w-6 h-6">
          <IconComponent className="text-white drop-shadow-md w-4 h-4" />
        </div>
      </foreignObject>
    )
  }

  return (
    <Card className={cn('p-1.5', className)}>
      <CardTitle className="flex items-center gap-1 -mb-5 font-medium">
        <PieChartIcon className="w-4 h-4" />
        Daueraufträge — Einnahmen & Ausgaben
      </CardTitle>

      <CardContent className="flex justify-center items-center p-0 m-0 w-full h-full overflow-hidden">
        <ChartContainer
          config={chartConfig}
          className="flex justify-center items-center w-full md:max-h-[200px] aspect-square"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <ChartTooltip />

              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius="50%"
                outerRadius="95%"
                labelLine={false}
                label={renderLabel}
                dataKey="value"
                stroke="var(--background)"
                strokeWidth={1}
              >
                {pieData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}

                <Label
                  position="center"
                  content={({ viewBox }) => {
                    if (!viewBox || !('cx' in viewBox)) return null
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-foreground font-bold text-lg lg:text-xl"
                      >
                        {availableCapital.toLocaleString('de-DE', {
                          style: 'currency',
                          currency: 'EUR',
                          maximumFractionDigits: 0,
                        })}
                      </text>
                    )
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