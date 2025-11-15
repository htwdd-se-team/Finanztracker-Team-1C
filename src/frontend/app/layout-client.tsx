'use client'

import { ReactNode } from 'react'
import { SidebarDesktop } from '@/components/nav/sidebardesktop'
import { SidebarProvider } from '@/components/ui/sidebar'
import { usePathname } from 'next/navigation'
import Background from '@/components/background'
import NavbarMobile from '@/components/nav/navbar-mobile'
import { CategoryProvider } from '@/components/provider/category-provider'
import { UserProvider, useUser } from '@/components/provider/user-provider'
import { AppLoader } from '@/components/nav/app-loader'
import { TopBar } from '@/components/nav/top-bar'

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
    <UserProvider>
      <CategoryProvider>
        <LoggedInLayout>{children}</LoggedInLayout>
      </CategoryProvider>
    </UserProvider>
  )
}

const LoggedInLayout = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading } = useUser()

  if (!isAuthenticated || isLoading) {
    return <AppLoader />
  }

  return (
    <>
      <Background />
      <div className="flex flex-col w-full relative">
        <TopBar />
        <SidebarProvider>
          <SidebarDesktop />
          <main className="flex-1 mb-20 sm:mb-0 w-full sm:h-screen overflow-auto">
            {children}
          </main>
        </SidebarProvider>
        <NavbarMobile />
      </div>
    </>
  )
}
