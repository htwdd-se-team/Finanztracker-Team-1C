import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Target } from 'lucide-react'

function SavingsGoalsTile() {
  return (
    <Card className="h-48 lg:h-64">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 font-medium text-sm">
          <Target className="w-4 h-4" />
          Sparziele
        </CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center items-center h-32">
        <p className="text-muted-foreground text-sm">Sparziele Placeholder</p>
      </CardContent>
    </Card>
  )
}

export default SavingsGoalsTile
