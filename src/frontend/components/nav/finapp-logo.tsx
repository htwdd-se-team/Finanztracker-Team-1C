import { cn } from '@/lib/utils'
import Image from 'next/image'

const FinAppLogo = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        'flex justify-center items-center mb-8 text-left',
        className
      )}
    >
      <div className="relative flex items-center space-x-2">
        <Image
          src="/images/logo-high-res.png"
          alt="FinApp Logo"
          width={48}
          height={48}
          className="relative flex justify-center items-center shadow-lg rounded-lg object-contain"
        />

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
