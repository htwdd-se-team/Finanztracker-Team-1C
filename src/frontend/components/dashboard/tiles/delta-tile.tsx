import { ApiGranularity, ApiTransactionType } from '@/__generated__/api'
import { apiClient } from '@/api/api-client'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { Triangle } from 'lucide-react'
import { DateTime } from 'luxon'
import { useMemo } from 'react'

function DeltaTile() {
  const today = DateTime.now()
  const startDate = today.minus({ days: 31 })

  const { data } = useQuery({
    queryKey: ['transactions', 'delta-tile'],
    queryFn: () =>
      apiClient.analytics.analyticsControllerGetTransactionBreakdown({
        startDate: startDate.toISO(),
        endDate: today.toISO(),
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

  return (
    <Card className="grid grid-rows-[auto_1fr] p-1.5 h-48">
      <CardTitle className="flex items-center gap-1 mb-0 pb-0 font-medium leading-tight">
        <Triangle className="w-4 h-4 shrink-0" /> Delta
      </CardTitle>
      <CardContent className="-mt-4 p-0">
        <div className="grid grid-cols-4 mt-0 h-full">
          {/* Linker Bereich: Werte (3 Spalten) */}
          <div className="flex flex-col space-y-1 col-span-3">
            <div>
              <div className="font-semibold text-sm">Einnahmen:</div>
              <div className="font-bold text-green-600 text-base">
                {income.toLocaleString('de-DE', {
                  style: 'currency',
                  currency: 'EUR',
                })}
              </div>
            </div>
            <div>
              <div className="font-semibold text-sm">Ausgaben:</div>
              <div className="font-bold text-red-600 text-base">
                {expense.toLocaleString('de-DE', {
                  style: 'currency',
                  currency: 'EUR',
                })}
              </div>
            </div>
            <div className="my-1 border-t border-black border-dashed w-9/12"></div>
            <div>
              <div className="flex items-center gap-1 font-semibold text-sm">
                {' '}
                Delta:
              </div>
              <div
                className={`text-base font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}
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
            <div className="relative flex-shrink-0 bg-gray-200 shadow-md border border-gray-400 rounded-full w-2 h-32">
              {/* Roter (Ausgaben) Teil oben */}
              <div
                className="top-0 left-0 absolute bg-red-500/70 rounded-t-full w-full"
                style={{ height: `${expensePercent * 100}%` }}
              />
              {/* Grüner (Einnahmen) Teil unten */}
              <div
                className="bottom-0 left-0 absolute bg-green-500/70 rounded-b-full w-full"
                style={{ height: `${incomePercent * 100}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
export default DeltaTile
