'use client'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

import AddTransactionDialog from './add-transaction-dialog'

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
                        className="w-full justify-start"
                        variant="ghost"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Neue Transaktion
                      </Button>
                    </AddTransactionDialog>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      {isMobile && (
        <AddTransactionDialog>
          <Button
            className="fixed bottom-6 right-6 rounded-full active:scale-95 transition-transform shadow-lg cursor-pointer w-15 h-15"
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
