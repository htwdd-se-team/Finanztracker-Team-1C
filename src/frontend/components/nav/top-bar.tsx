'use client'

import FinAppLogo from '@/components/nav/finapp-logo'
import { Button } from '@/components/ui/button'
import { UserRoundCog } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export function TopBar() {
  const router = useRouter()
  const pathname = usePathname()
  const isActive = pathname.startsWith('/profile')

  return (
    <header className="z-5 flex justify-end items-center bg-sidebar-primary/10 dark:bg-secondary/80 shadow-[0_2px_6px_-2px_rgba(0,0,0,0.3)] px-4 py-2 dark:border-border dark:border-b w-full h-12">
      <div className="flex flex-shrink-0 items-center gap-2">
        <Button
          disabled={isActive}
          variant="ghost"
          onClick={() => router.push('/profile')}
          className={cn(
            `bg-white/30 hover:bg-[var(--chart-1)]/50 dark:bg-white/5 dark:hover:bg-[var(--chart-1)]/50 disabled:opacity-90 shadow-[0_0_6px_rgba(0,0,0,0.08),_0_0_6px_rgba(255,255,255,0.6)] hover:shadow-[0_0_8px_rgba(0,0,0,0.12),_0_0_8px_rgba(255,255,255,0.75)] active:shadow-inner dark:hover:shadow-[0_0_10px_-1px_rgba(255,255,255,0.45)] dark:shadow-[0_0_8px_-2px_rgba(255,255,255,0.3)] dark:backdrop-blur-sm p-0 border border-white/20 dark:border-white/5 rounded-xl w-9 h-9 disabled:text-foreground transition // LIGHT // DARK`,
            isActive &&
              `
              // ACTIVE LIGHT
              bg-[var(--chart-1)]/40
              border-[var(--chart-1)]/80
              shadow-[0_0_12px_rgba(0,0,0,0.35)]

              // ACTIVE DARK
              dark:bg-[var(--chart-1)]/30
              dark:border-[var(--chart-1)]
              dark:shadow-[0_0_10px_-1px_rgba(255,255,255,0.5)]
              `
          )}
        >
          <UserRoundCog className="size-7 text-foreground" />
        </Button>

        <FinAppLogo className="flex-shrink-0" />
      </div>
    </header>
  )
}
