'use client'

import { Loader2 } from 'lucide-react'
import { Pie, PieChart, ResponsiveContainer, Cell, Label } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/api-client'
import { useCategory } from '@/components/provider/category-provider'
import { IconMap, IconNames } from '@/lib/icon-map'
import { cn } from '@/lib/utils'

interface TransformedChartData {
  id: number
  name: string
  value: number
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
]

const expenseColors = [
  'hsl(0, 70%, 55%)',
  'hsl(0, 65%, 65%)',
  'hsl(0, 60%, 75%)',
]

interface PieLabelProps {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  index: number
}

const BALANCE_COLOR = 'hsl(210, 60%, 55%)'
const THRESHOLD_PERCENT = 2

export default function CapitalPieChart({ className }: { className?: string }) {
  const { getCategoryFromId } = useCategory()

  // -----------------------------
  // Queries
  // -----------------------------
  const balanceQuery = useQuery({
    queryKey: ['graphs', 'balance'],
    queryFn: async () => {
      const res = await apiClient.user.userControllerGetBalance()
      return Number(res.data.balance) / 100
    },
  })

  const entriesQuery = useQuery({
    queryKey: ['graphs', 'recurring-entries'],
    queryFn: async () => {
      const res = await apiClient.entries.entryControllerGetScheduledEntries({
        take: 30,
      })
      return res.data.entries
    },
  })

  if (
    balanceQuery.isLoading ||
    entriesQuery.isLoading ||
    !balanceQuery.data ||
    !entriesQuery.data
  ) {
    return (
      <Card className={cn(className)}>
        <CardContent className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  const balance = balanceQuery.data
  const entries = entriesQuery.data

  // -----------------------------
  // Upcoming recurring this month
  // -----------------------------
  const today = new Date()
  const y = today.getFullYear()
  const m = today.getMonth()
  const d = today.getDate()

  let upcomingIncome = 0
  let upcomingExpense = 0

  entries.forEach(entry => {
    if (!entry.isRecurring) return
    if (!entry.recurringBaseInterval) return
    const interval = entry.recurringBaseInterval

    const start = new Date(entry.createdAt)
    const monthsSinceStart =
      (y - start.getFullYear()) * 12 + (m - start.getMonth())

    if (monthsSinceStart < 0) return
    if (monthsSinceStart % interval !== 0) return

    if (d >= start.getDate()) return // already executed

    const value = entry.amount / 100
    if (entry.type === 'INCOME') {
      upcomingIncome += value
    } else {
      upcomingExpense += value
    }
  })

  // -----------------------------
  // Totals by category
  // -----------------------------
  const incomeTotals: Record<number, number> = {}
  const expenseTotals: Record<number, number> = {}

  entries.forEach(e => {
    if (!e.categoryId) return
    const v = e.amount / 100

    if (e.type === 'INCOME') {
      incomeTotals[e.categoryId] = (incomeTotals[e.categoryId] || 0) + v
    } else {
      expenseTotals[e.categoryId] = (expenseTotals[e.categoryId] || 0) + v
    }
  })

  const transform = (
    totals: Record<number, number>,
    colors: string[]
  ): TransformedChartData[] =>
    Object.entries(totals).map(([id, value], i) => {
      const c = getCategoryFromId(Number(id))
      return {
        id: c.id,
        name: c.name,
        value,
        icon: c.icon,
        color: colors[i % colors.length],
      }
    })

  const incomeData = transform(incomeTotals, incomeColors)
  const expenseData = transform(expenseTotals, expenseColors)

  // -----------------------------
  // GLOBAL TOTAL (important!)
  // -----------------------------
  const grandTotal =
    balance +
    incomeData.reduce((s, d) => s + d.value, 0) +
    expenseData.reduce((s, d) => s + d.value, 0)

  // -----------------------------
  // Threshold logic (GLOBAL)
  // -----------------------------
  const applyThreshold = (
    data: TransformedChartData[],
    otherLabel: string,
    otherColor: string
  ) => {
    const large = data.filter(
      d => (d.value / grandTotal) * 100 >= THRESHOLD_PERCENT
    )

    const small = data.filter(
      d => (d.value / grandTotal) * 100 < THRESHOLD_PERCENT
    )

    if (!small.length) return large

    return [
      ...large,
      {
        id: -Math.random(),
        name: otherLabel,
        value: small.reduce((s, d) => s + d.value, 0),
        icon: IconNames.RECEIPT,
        color: otherColor,
      },
    ]
  }

  const incomeFinal = applyThreshold(
    incomeData,
    'Sonstige Einnahmen',
    'hsl(140, 40%, 70%)'
  )

  const expenseFinal = applyThreshold(
    expenseData,
    'Sonstige Ausgaben',
    'hsl(0, 40%, 75%)'
  )

  // -----------------------------
  // Final Pie Data
  // -----------------------------
  const pieData: TransformedChartData[] = [
    {
      id: 0,
      name: 'Kontostand',
      value: balance,
      icon: IconNames.WALLET,
      color: BALANCE_COLOR,
    },
    ...incomeFinal,
    ...expenseFinal,
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
    <Card className={cn('p-1.5 border-red shadow-none', className)}>
      <CardHeader className="p-0">
        <CardTitle className="ml-2 text-lg">Monatlich verfügbares Kapital</CardTitle>
      </CardHeader>
      <CardContent className="p-0 m-0 flex justify-center items-center w-full h-full overflow-hidden">
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
                animationDuration={1400}
                animationEasing="ease-in-out"
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
                        className="fill-foreground font-bold text-3xl"
                      >
                        {(balance + upcomingIncome - upcomingExpense).toLocaleString('de-DE', {
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