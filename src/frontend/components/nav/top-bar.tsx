'use client'

import FinAppLogo from '@/components/nav/finapp-logo'
import { Button } from '@/components/ui/button'
import { UserRoundCog } from 'lucide-react'
import { usePathname , useRouter } from 'next/navigation'
import { cn } from "@/lib/utils"

export function TopBar() {
  const router = useRouter()
  const pathname = usePathname()
  const isActive = pathname.startsWith('/profile')

  return (
    <header className="
      flex items-center justify-end
      px-4 py-2 h-12 z-5 w-full
      bg-sidebar-primary/10 dark:bg-secondary/80
      shadow-[0_2px_6px_-2px_rgba(0,0,0,0.3)] dark:border-b dark:border-border
      "
    >
      <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            disabled={isActive}
            variant="ghost"
            onClick={() => router.push('/profile')}
            className={cn(
            `
            h-9 w-9 p-0 rounded-xl transition
            // LIGHT
            bg-white/30
            border border-white/20
            shadow-[0_0_6px_rgba(0,0,0,0.08),_0_0_6px_rgba(255,255,255,0.6)]
            hover:bg-[var(--chart-1)]/50
            hover:shadow-[0_0_8px_rgba(0,0,0,0.12),_0_0_8px_rgba(255,255,255,0.75)]
            active:shadow-inner
            // DARK
            dark:bg-white/5
            dark:border-white/5
            dark:backdrop-blur-sm
            dark:shadow-[0_0_8px_-2px_rgba(255,255,255,0.3)]
            dark:hover:bg-[var(--chart-1)]/50
            dark:hover:shadow-[0_0_10px_-1px_rgba(255,255,255,0.45)]
            disabled:opacity-90
            disabled:text-foreground
            `,
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