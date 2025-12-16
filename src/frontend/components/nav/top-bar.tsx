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
            `
            p-0 rounded-lg w-9 h-9
            bg-card/30
            border border-black/10
            hover:bg-card/75
            hover:border-[var(--chart-2)]/70
            dark:bg-white/7
            dark:border-white/7
            dark:hover:bg-white/15
            dark:hover:border-[var(--chart-2)]/70
            dark:hover:shadow-[0_0_10px_-1px_rgba(255,255,255,0.1)]
            transition
            active:shadow-inner
            disabled:text-foreground
            disabled:opacity-90
            `,
            isActive &&
              `
              // ACTIVE LIGHT
              bg-[var(--chart-1)]/40
              border-[var(--chart-1)]/80

              // ACTIVE DARK
              dark:bg-[var(--chart-1)]/25
              dark:border-[var(--chart-1)]
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
