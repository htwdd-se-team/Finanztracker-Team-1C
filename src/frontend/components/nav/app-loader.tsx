import { Spinner } from '@/components/ui/spinner'
import Background from '../background'

// CSS-based FinApp Logo Component
const FinAppLogo = () => {
  return (
    <div className="flex justify-center items-center mb-8">
      {/* Logo Container */}
      <div className="relative flex items-center space-x-2">
        {/* Icon - Financial Chart/Growth Symbol */}
        <div className="relative flex justify-center items-center bg-primary shadow-lg rounded-lg w-10 h-10">
          {/* Chart bars */}
          <div className="flex items-end space-x-0.5">
            <div className="bg-background rounded-sm w-1 h-3"></div>
            <div className="bg-background rounded-sm w-1 h-5"></div>
            <div className="bg-background rounded-sm w-1 h-2"></div>
            <div className="bg-background rounded-sm w-1 h-6"></div>
          </div>
          {/* Growth arrow */}
          <div className="-top-1 -right-1 absolute w-3 h-3">
            <div className="border-primary border-b-2 border-l-2 w-0 h-0 rotate-45 transform"></div>
          </div>
        </div>

        {/* Text Logo */}
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
