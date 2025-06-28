import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Triangle } from 'lucide-react'

function DeltaTile() {
  const mockIncome = 2500.0
  const mockExpense = 1300.0
  const delta = mockIncome - mockExpense
  const isPositive = delta > 0

  // Prozentberechnung
  const total = mockIncome + mockExpense
  const incomePercent = total === 0 ? 0.5 : mockIncome / total
  const expensePercent = total === 0 ? 0.5 : mockExpense / total

  
  return (
  <Card className="h-48 p-1.5 grid grid-rows-[auto_1fr]">
    <CardTitle className="flex items-center gap-1 font-medium mb-0 pb-0 leading-tight">
      <Triangle className="w-4 h-4 shrink-0" /> Delta
    </CardTitle>
    <CardContent className="p-0 -mt-4">
      <div className="grid grid-cols-4 h-full mt-0">
        {/* Linker Bereich: Werte (3 Spalten) */}
        <div className="col-span-3 flex flex-col space-y-1">
          <div>
            <div className="font-semibold text-sm">Einnahmen:</div>
            <div className="text-base font-bold text-green-600">
              {mockIncome.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </div>
          </div>
          <div>
            <div className="font-semibold text-sm">Ausgaben:</div>
            <div className="text-base font-bold text-red-600">
              {mockExpense.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </div>
          </div>
          <div className="my-1 border-t border-black border-dashed w-9/12"></div>
          <div>
            <div className="font-semibold text-sm flex items-center gap-1"> Delta:</div>
            <div className={`text-base font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {delta.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </div>
          </div>
        </div>
        {/* Rechter Bereich: Vertikale Progressbar (1 Spalte) */}
        <div className="col-span-1 flex items-center justify-center">
          <div className="relative w-2 h-32 rounded-full bg-gray-200 flex-shrink-0 border border-gray-400 shadow-md">
            {/* Roter (Ausgaben) Teil oben */}
            <div
              className="absolute left-0 top-0 w-full bg-red-500/70 rounded-t-full"
              style={{ height: `${expensePercent * 100}%` }}
            />
            {/* Grüner (Einnahmen) Teil unten */}
            <div
              className="absolute left-0 bottom-0 w-full bg-green-500/70 rounded-b-full"
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
