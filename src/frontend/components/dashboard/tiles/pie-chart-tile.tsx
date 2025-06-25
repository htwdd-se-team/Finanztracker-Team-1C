import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart } from 'lucide-react'

function PieChartTile() {
  return (
    <Card className="h-48 lg:h-64">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 font-medium text-sm">
          <PieChart className="w-4 h-4" />
          Kategorien
        </CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center items-center h-32">
        <p className="text-muted-foreground text-sm">Pie Chart Placeholder</p>
      </CardContent>
    </Card>
  )
}

export default PieChartTile
