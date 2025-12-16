'use client'

import { Loader2 } from 'lucide-react'
import { Pie, PieChart, ResponsiveContainer, Cell, Label } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/api-client'
import { IconMap, IconNames } from '@/lib/icon-map'
import { cn } from '@/lib/utils'

interface TransformedChartData {
  id: string
  name: string
  value: number
  icon: IconNames
  color: string
}

interface PieLabelProps {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  index: number
}

const chartConfig = {
  value: { label: 'Betrag' },
} satisfies ChartConfig

const BALANCE_COLOR = 'hsl(210, 60%, 55%)'
const OTHER_INCOME_COLOR = 'hsl(140, 40%, 70%)'
const OTHER_EXPENSE_COLOR = 'hsl(0, 40%, 75%)'
const THRESHOLD_PERCENT = 3

function generateShades(
  hue: number,
  count: number,
  saturation = 60,
  lightnessFrom = 42,
  lightnessTo = 65
): string[] {
  if (count <= 1) {
    return [`hsl(${hue}, ${saturation}%, ${lightnessFrom}%)`]
  }
  const step = (lightnessTo - lightnessFrom) / (count - 1)
  return Array.from({ length: count }, (_, i) =>
    `hsl(${hue}, ${saturation}%, ${lightnessFrom + step * i}%)`
  )
}

function applyThreshold(
  data: TransformedChartData[],
  globalTotal: number,
  otherLabel: string,
  otherColor: string,
  forcedOtherValue = 0
): TransformedChartData[] {
  const large = data.filter(
    d => (d.value / globalTotal) * 100 >= THRESHOLD_PERCENT
  )
  const small = data.filter(
    d => (d.value / globalTotal) * 100 < THRESHOLD_PERCENT
  )
  const otherValue =
    forcedOtherValue + small.reduce((s, d) => s + d.value, 0)
  const otherPercent = (otherValue / globalTotal) * 100
  if (otherPercent < 2) return large
  return [
    ...large,
    {
      id: `other_${otherLabel}`,
      name: otherLabel,
      value: otherValue,
      icon: IconNames.RECEIPT,
      color: otherColor,
    },
  ]
}

export default function CapitalPieChart({ className }: { className?: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['graphs', 'available-capital'],
    queryFn: async () => {
      const res =
        await apiClient.analytics.analyticsControllerGetAvailableCapital()
      return res.data
    },

    select: items => {
      const availableCapital =
        items.find(i => i.key === 'available_capital')!.value / 100
      const balance =
        items.find(i => i.key === 'current_balance')!.value / 100
      const isUncategorized = (key: string) =>
        key === 'scheduled_category_uncategorized'
      const incomeCategories = items.filter(
        i =>
          i.type === 'INCOME' &&
          i.key.startsWith('scheduled_category_') &&
          !isUncategorized(i.key)
      )
      const uncategorizedIncome =
        items
          .filter(i => i.type === 'INCOME' && isUncategorized(i.key))
          .reduce((s, i) => s + i.value, 0) / 100
      const incomes: TransformedChartData[] = incomeCategories.map(i => ({
        id: i.key.replace('scheduled_category_', ''),
        name: i.label,
        value: i.value / 100,
        icon: i.icon as IconNames,
        color: '',
      }))

      const expenseCategories = items.filter(
        i =>
          i.type === 'EXPENSE' &&
          i.key.startsWith('scheduled_category_') &&
          !isUncategorized(i.key)
      )
      const uncategorizedExpense =
        items
          .filter(i => i.type === 'EXPENSE' && isUncategorized(i.key))
          .reduce((s, i) => s + Math.abs(i.value), 0) / 100
      const expenses: TransformedChartData[] = expenseCategories.map(i => ({
        id: i.key.replace('scheduled_category_', ''),
        name: i.label,
        value: Math.abs(i.value / 100),
        icon: i.icon as IconNames,
        color: '',
      }))

      return {
        availableCapital,
        balance,
        incomes,
        expenses,
        uncategorizedIncome,
        uncategorizedExpense,
      }
    },
  })

  if (isLoading || !data) {
    return (
      <Card className={cn(className)}>
        <CardContent className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  const { availableCapital, balance, incomes, expenses, uncategorizedIncome, uncategorizedExpense } = data

  const globalTotal =
    balance +
    incomes.reduce((s, i) => s + i.value, 0) +
    expenses.reduce((s, e) => s + e.value, 0)

  const incomeFinal = applyThreshold(
    incomes,
    globalTotal,
    'Sonstige Einnahmen',
    OTHER_INCOME_COLOR,
    uncategorizedIncome
  )

  const expenseFinal = applyThreshold(
    expenses,
    globalTotal,
    'Sonstige Ausgaben',
    OTHER_EXPENSE_COLOR,
    uncategorizedExpense
  )

  const incomeColors = generateShades(140, incomeFinal.length)
  const expenseColors = generateShades(0, expenseFinal.length)

  const incomeWithColors = incomeFinal.map((item, i) => ({
    ...item,
    color: item.color || incomeColors[i],
  }))

  const expenseWithColors = expenseFinal.map((item, i) => ({
    ...item,
    color: item.color || expenseColors[i],
  }))

  const pieData: TransformedChartData[] = [
    {
      id: 'balance',
      name: 'Kontostand',
      value: balance,
      icon: IconNames.WALLET,
      color: BALANCE_COLOR,
    },
    ...incomeWithColors,
    ...expenseWithColors,
  ]

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
    const IconComponent = IconMap[item.icon]
    if (!IconComponent) return null

    return (
      <foreignObject
        x={x - 12}
        y={y - 12}
        width={24}
        height={24}
        style={{ overflow: 'visible' }}
      >
        <div className="flex items-center justify-center w-6 h-6">
          <IconComponent className="w-4 h-4 text-white drop-shadow-md" />
        </div>
      </foreignObject>
    )
  }

  return (
    <Card className={cn('p-1.5 shadow-none', className)}>
      <CardHeader className="p-0">
        <CardTitle className="ml-2 text-lg">
          Verfügbares Kapital (Monat)
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 flex justify-center items-center">
        <ChartContainer
          config={chartConfig}
          className="w-full aspect-square max-h-[300px] -mt-8"
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
                startAngle={90}
                endAngle={450}
                labelLine={false}
                label={renderLabel}
                dataKey="value"
                stroke="var(--background)"
                strokeWidth={1}
                animationDuration={1400}
                animationEasing="ease-in-out"
              >
                {pieData.map(entry => (
                  <Cell key={entry.id} fill={entry.color} />
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
                        className="fill-foreground font-bold text-3xl"
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
