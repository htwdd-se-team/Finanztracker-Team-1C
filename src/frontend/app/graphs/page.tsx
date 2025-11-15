import Background from '@/components/background'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Calendar,
  Target,
  Wallet,
} from 'lucide-react'

export default function GraphsPage() {
  const chartCards = [
    {
      icon: <BarChart3 className="w-8 h-8 text-blue-500" />,
      title: 'Ausgaben nach Kategorien',
      description: 'Visualisierung Ihrer Ausgaben pro Kategorie',
    },
    {
      icon: <PieChart className="w-8 h-8 text-green-500" />,
      title: 'Einnahmen vs. Ausgaben',
      description: 'Verhältnis zwischen Einnahmen und Ausgaben',
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-purple-500" />,
      title: 'Ausgabentrends',
      description: 'Entwicklung Ihrer Ausgaben über Zeit',
    },
    {
      icon: <Calendar className="w-8 h-8 text-orange-500" />,
      title: 'Monatliche Übersicht',
      description: 'Detaillierte Monatsauswertungen',
    },
    {
      icon: <Target className="w-8 h-8 text-red-500" />,
      title: 'Budget-Tracking',
      description: 'Verfolgung Ihrer Budgetziele',
    },
    {
      icon: <Wallet className="w-8 h-8 text-indigo-500" />,
      title: 'Saldo-Verlauf',
      description: 'Entwicklung Ihres Kontostands',
    },
  ]

  return (
    <div className="relative flex flex-col">
      <Background />
      <div className="z-10 relative flex-1 p-4 sm:p-6 overflow-auto">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="flex justify-center items-center gap-3 mb-2 font-bold text-3xl">
              Finanzanalysen
            </h1>
            <p className="text-muted-foreground text-lg">
              Visualisieren Sie Ihre Finanzdaten mit interaktiven Diagrammen
            </p>
          </div>

          {/* Chart Preview Cards */}
          <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {chartCards.map((chart, index) => (
              <Card
                key={index}
                className="opacity-75 hover:opacity-90 hover:shadow-lg border-2 border-dashed transition-shadow duration-200"
              >
                <CardHeader className="pb-3 text-center">
                  <div className="flex justify-center mb-3">{chart.icon}</div>
                  <CardTitle className="text-lg">{chart.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-muted-foreground text-sm text-center">
                    {chart.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Feature List */}
        </div>
      </div>
    </div>
  )
}
