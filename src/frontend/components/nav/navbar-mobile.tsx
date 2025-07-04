'use client'

import { useMemo, useState } from 'react'
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

  const [activeTab, setActiveTab] = useState<TabValues | undefined>(useMemoTab)

  const handleTabChange = (val: TabValues) => {
    setActiveTab(val)
    router.push(`/${val}`)
  }

  return (
    <div className="sm:hidden block bottom-0 z-50 fixed inset-x-0 bg-background border-t">
      <div className="relative">
        <Tabs
          value={activeTab}
          onValueChange={val => handleTabChange(val as TabValues)}
        >
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
                    data-state="inactive"
                    className="relative flex flex-col justify-center items-center"
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
          <Button className="-top-6 left-1/2 z-10 absolute flex justify-center items-center bg-primary hover:bg-primary/90 shadow-lg rounded-full w-16 h-16 text-primary-foreground transition -translate-x-1/2">
            <SquarePlus className="size-8" />
          </Button>
        </TransactionDialog>
      </div>
    </div>
  )
}
