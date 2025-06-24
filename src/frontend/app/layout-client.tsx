'use client'

import { ReactNode } from 'react'
import { SidebarDesktop } from '@/components/nav/sidebardesktop'
import { usePathname } from 'next/navigation'
import Background from '@/components/background'
import NavbarMobile from '@/components/nav/navbar-mobile'
import { useIsMobile } from '@/hooks/use-mobile'

const nonLayoutRoutes = ['/login', '/register']

export default function LayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  const isMobile = useIsMobile()

  if (nonLayoutRoutes.includes(pathname)) {
    return (
      <div className="w-full h-full">
        <Background>{children}</Background>
      </div>
    )
  }

  if (isMobile) {
    return (
      <div className="w-full h-full">
        <Background>
          <NavbarMobile>{children}</NavbarMobile>
        </Background>
      </div>
    )
  }

  return (
    <Background>
      <div className="flex h-screen">
        <SidebarDesktop />
        <div className="flex flex-col flex-1">
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </Background>
  )
}
