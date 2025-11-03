import { ApiGranularity, ApiTransactionType } from '@/__generated__/api'
import { apiClient } from '@/api/api-client'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { Triangle, Loader2 } from 'lucide-react'
import { useMemo } from 'react'

function DeltaTile({
  startDate,
  endDate,
  className,
}: {
  startDate: string
  endDate: string
  className?: string
}) {
  const { data } = useQuery({
    queryKey: ['transactions', 'delta-tile', startDate, endDate],
    enabled: Boolean(startDate && endDate),
    queryFn: () =>
      apiClient.analytics.analyticsControllerGetTransactionBreakdown({
        startDate,
        endDate,
        granularity: ApiGranularity.MONTH,
      }),
    select: data => data.data.data,
  })

  const { income, expense, delta, incomePercent, expensePercent } =
    useMemo(() => {
      if (!data)
        return {
          income: 0,
          expense: 0,
          delta: 0,
          incomePercent: 0.5,
          expensePercent: 0.5,
        }

      // Calculate total income and expenses from API data
      const totalIncome = data
        .filter(item => item.type === ApiTransactionType.INCOME)
        .reduce((sum, item) => sum + parseFloat(item.value) / 100, 0) // Convert from cents to euros

      const totalExpense = data
        .filter(item => item.type === ApiTransactionType.EXPENSE)
        .reduce((sum, item) => sum + parseFloat(item.value) / 100, 0) // Convert from cents to euros

      const calculatedDelta = totalIncome - totalExpense

      // Calculate percentages for the progress bar
      const total = totalIncome + totalExpense
      const incomePercentage = total === 0 ? 0.5 : totalIncome / total
      const expensePercentage = total === 0 ? 0.5 : totalExpense / total

      return {
        income: totalIncome,
        expense: totalExpense,
        delta: calculatedDelta,
        incomePercent: incomePercentage,
        expensePercent: expensePercentage,
      }
    }, [data])

  const isPositive = delta > 0

  if (!income && income !== 0) {
    return (
      <Card className={cn(className)}>
        <CardContent className="flex justify-center items-center h-full">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('p-1.5',className)}>
      <CardTitle className="flex items-center gap-1 mb-0 pb-0 font-medium leading-tight">
        <Triangle className="w-4 h-4 shrink-0" /> Delta
      </CardTitle>
      <CardContent className="-mt-4 p-0">
        <div className="grid grid-cols-4 mt-0 h-full">
          {/* Linker Bereich: Werte (3 Spalten) */}
          <div className="flex flex-col space-y-1 col-span-3">
            <div>
              <div className="font-semibold text-muted-foreground text-sm">
                Einnahmen:
              </div>
              <div
                className="font-bold text-base"
                style={{ color: 'var(--chart-1)' }}
              >
                {income.toLocaleString('de-DE', {
                  style: 'currency',
                  currency: 'EUR',
                })}
              </div>
            </div>
            <div>
              <div className="font-semibold text-muted-foreground text-sm">
                Ausgaben:
              </div>
              <div
                className="font-bold text-base"
                style={{ color: 'color-mix(in srgb, var(--destructive) 80%, white)' }}
              >
                {expense.toLocaleString('de-DE', {
                  style: 'currency',
                  currency: 'EUR',
                })}
              </div>
            </div>
            <div className="my-1 border-t border-border border-dashed w-9/12"></div>
            <div>
              <div className="flex items-center gap-1 font-semibold text-muted-foreground text-sm">
                Delta:
              </div>
              <div
                className={`text-base font-bold`}
                style={{
                  color: isPositive ? 'var(--chart-1)' : 'var(--destructive)',
                }}
              >
                {delta.toLocaleString('de-DE', {
                  style: 'currency',
                  currency: 'EUR',
                })}
              </div>
            </div>
          </div>
          {/* Rechter Bereich: Vertikale Progressbar (1 Spalte) */}
          <div className="flex justify-center items-center col-span-1">
            <div className="relative flex-shrink-0 bg-muted shadow-sm border border-border rounded-full w-2 h-32">
              {/* Expense (Ausgaben) Teil oben */}
              <div
                className="top-0 left-0 absolute rounded-t-full w-full transition-all duration-300"
                style={{
                  height: `${expensePercent * 100}%`,
                  backgroundColor: 'var(--destructive)',
                  opacity: 0.7,
                }}
              />
              {/* Income (Einnahmen) Teil unten */}
              <div
                className="bottom-0 left-0 absolute rounded-b-full w-full transition-all duration-300"
                style={{
                  height: `${incomePercent * 100}%`,
                  backgroundColor: 'var(--chart-1)',
                  opacity: 0.7,
                }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
export default DeltaTile
