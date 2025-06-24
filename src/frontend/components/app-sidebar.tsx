'use client'
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
} from '@/components/ui/sidebar'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

import { NavUser } from '@/components/nav/nav-user'
import { AddTransactionDialog } from '@/components/add-transaction-dialog'

export function AppSidebar() {
  const isMobile = useIsMobile()
  return (
    <>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <AddTransactionDialog>
                      <Button
                        className="justify-start w-full"
                        variant="ghost"
                        size="sm"
                      >
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
      {isMobile && (
        <AddTransactionDialog>
          <Button
            className="right-6 bottom-6 fixed shadow-lg rounded-full w-15 h-15 active:scale-95 transition-transform cursor-pointer"
            size="icon"
            variant={'secondary'}
            aria-label="Erstellen"
          >
            <Plus className="size-7" />
          </Button>
        </AddTransactionDialog>
      )}
    </>
  )
}
