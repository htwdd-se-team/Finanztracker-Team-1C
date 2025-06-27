import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'

function DeltaTile() {
  const mockIncome = 2500.0
  const mockExpense = 1800.0
  const delta = mockIncome - mockExpense
  const isPositive = delta > 0

  return (
    <Card className="h-48 lg:h-64">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 font-medium text-sm">
          {isPositive ? (
            <TrendingUp className="w-4 h-4 text-green-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500" />
          )}
          Einnahmen/Ausgaben
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between">
          <span className="text-muted-foreground text-sm">Einnahmen:</span>
          <span className="font-medium text-green-600 text-sm">
            +
            {mockIncome.toLocaleString('de-DE', {
              style: 'currency',
              currency: 'EUR',
            })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground text-sm">Ausgaben:</span>
          <span className="font-medium text-red-600 text-sm">
            -
            {mockExpense.toLocaleString('de-DE', {
              style: 'currency',
              currency: 'EUR',
            })}
          </span>
        </div>
        <div className="flex justify-between pt-2 border-t">
          <span className="font-medium text-sm">Delta:</span>
          <span
            className={`text-sm font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}
          >
            {isPositive ? '+' : ''}
            {delta.toLocaleString('de-DE', {
              style: 'currency',
              currency: 'EUR',
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export default DeltaTile
