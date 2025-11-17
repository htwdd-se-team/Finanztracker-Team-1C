import { cn } from '@/lib/utils'
import Image from 'next/image'

const FinAppLogo = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        'flex justify-center items-center text-left',
        className
      )}
    >
      <div className="relative flex items-center space-x-2">
        <Image
          src="/images/android-chrome-72x72.png"
          alt="FinApp Logo"
          width={48}
          height={48}
          className="relative flex justify-center items-center rounded-lg object-contain"
        />

        <div className="flex flex-col">
          <span className="font-bold text-foreground text-2xl tracking-tight">
            Fin<span className="text-primary">App</span>
          </span>
        </div>
      </div>
    </div>
  )
}

export default FinAppLogo
