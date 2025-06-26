 'use client'
 
 import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
 import { Card, CardContent} from '@/components/ui/card'
 
type SelectorTileProps = {
  value: string
  onValueChange: (value: string) => void
}


function SelectorTile({ value, onValueChange}: SelectorTileProps) {

    const tabTriggerClass = "bg-[var(--card)] data-[state=active]:border-[var(--color-chart-2)] data-[state=active]:bg-[color:var(--color-chart-2)/0.1]"

    return (
        <Card className="flex items-stretch h-20 p-0">
        <CardContent className="h-full w-full p-0 flex">
            <Tabs value={value} onValueChange={onValueChange} className="w-full h-full flex">
                <TabsList className="w-full h-full grid grid-cols-2 grid-rows-2 bg-var(--card)">
                <TabsTrigger value="7d" className={tabTriggerClass}>Woche</TabsTrigger>
                <TabsTrigger value="30d" className={tabTriggerClass}>Monat</TabsTrigger>
                <TabsTrigger value="90d" className={tabTriggerClass}>Quartal</TabsTrigger>
                <TabsTrigger value="all" className={tabTriggerClass}>Gesamt</TabsTrigger>
                </TabsList>
            </Tabs>
        </CardContent>
        </Card>
    )
}

export default SelectorTile







