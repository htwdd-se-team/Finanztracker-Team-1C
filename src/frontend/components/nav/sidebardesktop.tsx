import { Plus } from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { NavUser } from './nav-user'
import { AddTransactionDialog } from '../add-transaction-dialog'
import { Button } from '../ui/button'
import { usePathname } from 'next/navigation'
import { navItems } from '@/navigation-config'

// Menu items.

export function SidebarDesktop() {
  const pathname = usePathname()

  const isActive = (url: string) => pathname === url

  return (
    <Sidebar collapsible="none" className="h-full">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platzhalter??</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <a
                      href={item.url}
                      className="flex items-center gap-2 hover:bg-muted px-3 py-2 rounded-md transition"
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarSeparator />
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <AddTransactionDialog>
                    <Button className="justify-start w-full" variant="ghost">
                      <Plus className="mr-2 w-4 h-4" />
                      Neue Transaktion
                    </Button>
                  </AddTransactionDialog>
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
