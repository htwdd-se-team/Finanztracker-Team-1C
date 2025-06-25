import { Spinner } from '@/components/ui/spinner'
import Background from '../background'
import { TrendingUp } from 'lucide-react'

const FinAppLogo = () => {
  return (
    <div className="flex justify-center items-center mb-8">
      <div className="relative flex items-center space-x-2">
        <div className="relative flex justify-center items-center bg-primary shadow-lg rounded-lg w-10 h-10">
          <TrendingUp className="w-6 h-6 text-background" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-foreground text-2xl tracking-tight">
            Fin<span className="text-primary">App</span>
          </span>
          <span className="text-muted-foreground text-xs uppercase tracking-wider">
            Finance Manager
          </span>
        </div>
      </div>
    </div>
  )
}

export const AppLoader = () => {
  return (
    <div className="z-50 fixed inset-0 flex flex-col justify-center items-center bg-background">
      <Background />
      <div className="flex flex-col items-center">
        <FinAppLogo />
        <Spinner size="lg" className="bg-primary" />
      </div>
    </div>
  )
}
