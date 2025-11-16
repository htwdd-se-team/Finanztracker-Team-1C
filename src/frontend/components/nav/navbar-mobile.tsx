'use client'

import { useMemo} from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SquarePlus } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { TransactionDialog } from '@/components/TransactionDialog'
import { navItems, TabValues } from '@/navigation-config'
import { motion } from 'framer-motion'

export default function NavbarMobile() {
  const router = useRouter()

  const pathname = usePathname()

  const useMemoTab = useMemo(() => {
    const activeTab = pathname.split('/')[1] as TabValues
    if (Object.values(TabValues).includes(activeTab)) {
      return activeTab
    }
    return undefined
  }, [pathname])

  const activeTab = useMemoTab

  const handleTabClick = (val: TabValues) => {
    router.push(`/${val}`)
  }

  return (
    <div className="sm:hidden block bottom-0 z-50 fixed inset-x-0 bg-background border-t">
      <div className="relative">
        <Tabs key={activeTab ?? 'none'} value={activeTab}>
          <TabsList
            className={`relative grid rounded-none w-full h-14 ${
              navItems.length === 2
                ? 'grid-cols-3'
                : navItems.length === 3
                  ? 'grid-cols-4'
                  : navItems.length === 4
                    ? 'grid-cols-5'
                    : 'grid-cols-5'
            }`}
          >
            {navItems
              .map((item, index) => {
                const totalTabs = navItems.length + 1
                const middleStart = Math.floor(navItems.length / 2)
                const placeholderCount = totalTabs - navItems.length

                const elements = [
                  <TabsTrigger
                    key={item.value}
                    value={item.value}
                    data-active={activeTab === item.value}
                    onClick={() => handleTabClick(item.value)}
                    className="
                    relative flex flex-col justify-center items-center
                    transition
                    data-[active=false]:hover:bg-white/20
                    data-[active=false]:hover:shadow-[0_0_8px_rgba(0,0,0,0.15)]
                    data-[active=false]:hover:border
                    data-[active=false]:hover:border-[var(--chart-2)]/70
                    dark:data-[active=false]:hover:bg-white/5
                    dark:data-[active=false]:hover:shadow-[0_0_10px_rgba(255,255,255,0.2)]
                    rounded-md
                    "
                  >
                    {activeTab === item.value && (
                      <motion.div
                        layoutId="active-tab-mobile"
                        className="absolute inset-0 bg-primary/20 border-1 border-primary rounded-md"
                        transition={{ type: 'spring', duration: 0.3 }}
                      />
                    )}
                    <item.icon className="z-10 relative size-7" />
                  </TabsTrigger>,
                ]

                if (index === middleStart - 1) {
                  elements.push(
                    ...Array.from({ length: placeholderCount }, (_, i) => (
                      <div
                        key={`placeholder-${index}-${i}`}
                        className="flex flex-col justify-center items-center"
                      />
                    ))
                  )
                }

                return elements
              })
              .flat()}
          </TabsList>
        </Tabs>

        {/* Floating Button */}
        <TransactionDialog>
          <Button className="
            -top-6 left-1/2 z-10 -translate-x-1/2
            absolute flex justify-center items-center
            w-16 h-16
            transition
            bg-primary
            hover:bg-primary/95 hover:scale-105 hover:shadow-[0_0_10px_rgba(0,0,0,0.4),_0_0_6px_var(--primary)]
            shadow-lg rounded-full text-primary-foreground
            "
          >
            <SquarePlus className="size-8" />
          </Button>
        </TransactionDialog>
      </div>
    </div>
  )
}
