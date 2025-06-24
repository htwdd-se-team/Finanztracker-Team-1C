"use client"

import { ReactNode, useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Home, ChartNoAxesCombined, TableProperties, UserRoundCog, SquarePlus } from "lucide-react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { SidebarDesktop } from "@/components/ui/sidebardesktop"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Background from "../components/background";

export default function LayoutClient({ children }: { children: ReactNode }) {
  
    const [activeTab, setActiveTab] = useState("overview")
    const router = useRouter()
    useEffect(() => {
    if (window.location.pathname === "/") {
      router.push("/overview")
    }
    })

    return (
        <Background>
            {/* Mobile */}
            <div id="mobile" className="block sm:hidden flex-col min-h-screen pb-20">
                {children}
            </div>

            {/* Funktionsleiste unten */}
            <div className="fixed inset-x-0 bottom-0 border-t bg-background z-50">
                <div className="relative">
                <Tabs defaultValue="overview" onValueChange={(val) => setActiveTab(val)}>
                    <TabsList className="grid grid-cols-5 w-full h-14">
                    <TabsTrigger value="overview" onClick={() => router.push("/overview")} className="flex flex-col items-center justify-center">
                        <Home className="size-7" />
                    </TabsTrigger>
                    <TabsTrigger value="charts" onClick={() => router.push("/graphs")} className="flex flex-col items-center justify-center">
                        <ChartNoAxesCombined className="size-7" />
                    </TabsTrigger>
                    {/* Platzhalter für mittleren Tab */}
                    <div />
                    <TabsTrigger value="table" onClick={() => router.push("/table")} className="flex flex-col items-center justify-center">
                        <TableProperties className="size-7" />
                    </TabsTrigger>
                    <TabsTrigger value="profile" onClick={() => router.push("/profile")} className="flex flex-col items-center justify-center">
                        <UserRoundCog className="size-7" />
                    </TabsTrigger>
                    </TabsList>
                </Tabs>
                {/* Floating Button */}
                <button
                    className="
                    absolute left-1/2 -translate-x-1/2 -top-6
                    w-16 h-16 rounded-full bg-primary text-white
                    flex items-center justify-center shadow-lg z-10
                    hover:bg-primary/90 transition
                    "
                    // OnClick Handler
                >
                    <SquarePlus className="size-8" />
                </button>
                </div>
            </div>


            {/* Desktop */}
            <div id="desktop" className="hidden sm:flex h-screen">
                <SidebarProvider >
                <SidebarDesktop />
                    <main className="flex-1 p-6 overflow-auto">
                    {children}
                    </main>
                </SidebarProvider>
            </div>
        </Background>
    )
}