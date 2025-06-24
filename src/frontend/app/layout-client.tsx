'use client'

import { ReactNode } from 'react'
import { SidebarDesktop } from '@/components/nav/sidebardesktop'
import { SidebarProvider } from '@/components/ui/sidebar'
import { usePathname } from 'next/navigation'
import Background from '@/components/background'
import NavbarMobile from '@/components/nav/navbar-mobile'

const nonLayoutRoutes = ['/login', '/register']

export default function LayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  if (nonLayoutRoutes.includes(pathname)) {
    return (
      <>
        <Background />
        <div className="w-full h-full">{children}</div>
      </>
    )
  }

  return (
    <>
      <Background />
      <SidebarProvider>
        <SidebarDesktop />
        <main className="flex w-full">{children}</main>
      </SidebarProvider>
      <NavbarMobile />
    </>
  )
}
