import Background from '@/components/background'
import CapitalPieChart from '@/components/graphs/available-capital'
import SavingsGoal from '@/components/graphs/savings-goal'
import { ChartNoAxesCombined } from 'lucide-react'

export default function GraphsPage() {

  return (
    <div className="mx-auto max-w-4xl relative flex flex-col px-2 sm:px-6 container">
      <Background />
      <div className="z-10 relative flex-1">
        <div className="">
          <div className="">
            <h1 className="flex gap-3 font-bold text-2xl ml-2 mt-4 sm:mt-6 mb-2">
              <ChartNoAxesCombined className="w-8 h-8" />
              Finanzanalysen
            </h1>
            <p className="ml-2 mt-2 mb-6 text-muted-foreground">
              Visualisieren Sie Ihre Finanzdaten mit interaktiven Diagrammen
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-6">
            <CapitalPieChart className="bg-card/90 dark:bg-card/60"/>
            <SavingsGoal className="bg-card/90 dark:bg-card/60"/>
          </div>
        </div>
      </div>
    </div>
  )
}
