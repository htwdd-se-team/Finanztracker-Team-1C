import { Plus } from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { NavUser } from './nav-user'
import { Button } from '../ui/button'
import { usePathname } from 'next/navigation'
import { navItems } from '@/navigation-config'
import Link from 'next/link'
import FinAppLogo from '@/components/nav/finapp-logo'
import { TransactionDialog } from '../TransactionDialog'

export function SidebarDesktop() {
  const pathname = usePathname()

  const isActive = (url: string) => pathname === url

  return (
    <Sidebar
      collapsible="none"
      className="hidden sm:flex shadow-2xl shadow-black/5 border-r w-64"
    >
      <SidebarContent>
        <SidebarGroup>
          <FinAppLogo className="text-2xl" />
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link
                      href={item.url}
                      className="flex items-center gap-2 hover:bg-muted px-3 py-2 rounded-md transition"
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarSeparator />
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <TransactionDialog>
                    <Button className="justify-start w-full cursor-pointer">
                      <Plus className="mr-2 w-4 h-4" />
                      Neue Transaktion
                    </Button>
                  </TransactionDialog>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
