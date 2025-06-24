'use client'

import { ReactNode, useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Home,
  ChartNoAxesCombined,
  TableProperties,
  UserRoundCog,
  SquarePlus,
} from 'lucide-react'
import { SidebarDesktop } from '@/components/nav/sidebardesktop'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Background from '../components/background'
import { Button } from '@/components/ui/button'
import { AddTransactionDialog } from '@/components/add-transaction-dialog'

enum TabValues {
  OVERVIEW = 'overview',
  CHARTS = 'charts',
  TABLE = 'table',
  PROFILE = 'profile',
}

export default function LayoutClient({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState(TabValues.OVERVIEW)
  const router = useRouter()
  useEffect(() => {
    if (window.location.pathname === '/') {
      router.push('/overview')
    }
  })

  return (
    <Background>
      {/* Mobile */}
      <div id="mobile" className="sm:hidden block flex-col pb-20 min-h-screen">
        {children}
        {/* Funktionsleiste unten */}
        <div className="bottom-0 z-50 fixed inset-x-0 bg-background border-t">
          <div className="relative">
            <Tabs
              defaultValue="overview"
              value={activeTab}
              className=""
              onValueChange={val => setActiveTab(val as TabValues)}
            >
              <TabsList className="grid grid-cols-5 rounded-none w-full h-14">
                <TabsTrigger
                  value={TabValues.OVERVIEW}
                  onClick={() => router.push('/overview')}
                  className="flex flex-col justify-center items-center"
                >
                  <Home className="size-7" />
                </TabsTrigger>
                <TabsTrigger
                  value={TabValues.CHARTS}
                  onClick={() => router.push('/graphs')}
                  className="flex flex-col justify-center items-center"
                >
                  <ChartNoAxesCombined className="size-7" />
                </TabsTrigger>
                {/* Platzhalter für mittleren Tab */}
                <div />
                <TabsTrigger
                  value={TabValues.TABLE}
                  onClick={() => router.push('/table')}
                  className="flex flex-col justify-center items-center"
                >
                  <TableProperties className="size-7" />
                </TabsTrigger>
                <TabsTrigger
                  value={TabValues.PROFILE}
                  onClick={() => router.push('/profile')}
                  className="flex flex-col justify-center items-center"
                >
                  <UserRoundCog className="size-7" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {/* Floating Button */}
            <AddTransactionDialog>
              <Button
                className="-top-6 left-1/2 z-10 absolute flex justify-center items-center bg-primary hover:bg-primary/90 shadow-lg rounded-full w-16 h-16 text-primary-foreground transition -translate-x-1/2"
                // OnClick Handler
              >
                <SquarePlus className="size-8" />
              </Button>
            </AddTransactionDialog>
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div id="desktop" className="hidden sm:flex h-screen">
        <SidebarDesktop />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </Background>
  )
}
