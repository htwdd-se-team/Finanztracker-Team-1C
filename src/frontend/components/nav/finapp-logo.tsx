import { cn } from '@/lib/utils'
import { TrendingUp } from 'lucide-react'

const FinAppLogo = ({ className }: { className?: string }) => {
  return (
    <div className={cn('flex justify-center items-center mb-8', className)}>
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

export default FinAppLogo
