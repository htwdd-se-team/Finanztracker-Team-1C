import {Home, ChartNoAxesCombined, SquarePlus, TableProperties, UserRoundCog} from "lucide-react"
 
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
 
// Menu items.
const items = [
  {
    title: "Übersicht",
    url: "#",
    icon: Home,
  },
  {
    title: "Graphen",
    url: "#",
    icon: ChartNoAxesCombined,
  },
  {
    title: "Tabellen",
    url: "#",
    icon: TableProperties,
  },
  {
    title: "Profil",
    url: "#",
    icon: UserRoundCog,
  },
  {
    title: "Neuer Eintrag",
    url: "#",
    icon: SquarePlus,
  },
]
 
export function SidebarDesktop() {
  return (
    <Sidebar collapsible="none" className="h-full">
      <SidebarContent >
        <SidebarGroup >
          <SidebarGroupLabel>Platzhalter??</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu >
              {items.map((item, index) => {
                const isLast = index === items.length - 1
                return (
                  <SidebarMenuItem key={item.title}>
                    {isLast && (
                      <div className="my-3 h-px bg-border rounded" />
                    )}
                    <SidebarMenuButton asChild>
                      <a
                        href={item.url}
                        className="flex items-center gap-2 px-3 py-2 rounded-md transition hover:bg-muted"
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}