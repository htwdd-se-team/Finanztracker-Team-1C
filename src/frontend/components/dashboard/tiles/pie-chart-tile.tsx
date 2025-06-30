"use client"

import { PieChartIcon, RocketIcon, BookIcon, CameraIcon, HeartIcon, StarIcon } from "lucide-react"
import { LabelList, Pie, PieChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "A pie chart with a label list"

const icons = [RocketIcon, BookIcon, CameraIcon, HeartIcon, StarIcon]

const chartData = [
  { icon: icons[0], visitors: 275, fill: "var(--chart-1)" },
  { icon: icons[1], visitors: 200, fill: "var(--chart-2)" },
  { icon: icons[2], visitors: 187, fill: "var(--chart-3)" },
  { icon: icons[3], visitors: 173, fill: "var(--chart-4)" },
  { icon: icons[4], visitors: 90, fill: "var(--chart-5)" },
]

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
} satisfies ChartConfig

export default function Component() {
  return (
    <Card className="flex flex-col p-0 h-48 lg:h-64">
      <CardTitle className="flex items-center gap-1 mx-2 mt-2 -mb-5 font-medium">
        <PieChartIcon className="w-4 h-4 shrink-0" />
        Kategorien
      </CardTitle>
      <CardContent className="flex flex-1 justify-center items-center w-full h-full overflow-hidden">
        <ChartContainer
          config={chartConfig}
          className="flex justify-center items-center w-full max-h-full aspect-square"
        >
          <PieChart>
            <ChartTooltip
              content={<ChartTooltipContent nameKey="visitors" hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="visitors"
              innerRadius="50%"
              outerRadius="95%"
              labelLine={false}
              label={({ cx, cy, midAngle, innerRadius, outerRadius, index }) => {
                if (typeof index !== "number" || !chartData[index]) return null

                // Berechne Position für das Icon in der Mitte jedes Slices
                const RADIAN = Math.PI / 180
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5 // 0.5 = Mitte; passe an für weiter innen/außen
                const x = cx + radius * Math.cos(-midAngle * RADIAN)
                const y = cy + radius * Math.sin(-midAngle * RADIAN)

                const LucideIcon = chartData[index].icon
                return (
                  <g transform={`translate(${x},${y})`}>
                    <LucideIcon width={18} height={18} stroke="var(--background)" fill="none" />
                  </g>
                )
              }}
            >
              <LabelList
                dataKey="visitors"
                position="outside"
                fontSize={14}
                className="fill-foreground font-bold"
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
























































{/*
'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { PieChart as PieChartIcon } from 'lucide-react'
import { Label, LabelList, Pie, PieChart, Cell } from 'recharts'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { useCategory } from '@/components/provider/category-provider'
import { apiClient } from '@/api/api-client'
import { useQuery } from '@tanstack/react-query'
import { DateTime } from 'luxon'
import { ApiGranularity, ApiTransactionType } from '@/__generated__/api'

function PieChartTile() {
  const { categories, getCategoryFromId } = useCategory()

  const colorPalette = [
    "var(--color-chart-1)",
    "var(--color-chart-2)",
    "var(--color-chart-3)",
    "var(--color-chart-4)",
    "var(--color-chart-5)",
  ]

  // const days =  <get from props>
  const today = DateTime.now()
  const startDate = today.minus({ days: 31 })

  const { data } = useQuery({
    queryKey: ['transactions', 'pie-chart-tile'],
    queryFn: () =>
      apiClient.analytics.analyticsControllerGetTransactionBreakdown({
        startDate: startDate.toISO(),
        endDate: today.toISO(),
        granularity: ApiGranularity.MONTH,
        withCategory: true,
      }),
    select: data => data.data.data,
  })

  const { chartData, chartConfig, totalAmount } = useMemo(() => {
    if (!data) return { chartData: [], chartConfig: {}, totalAmount: 0 }

    // Reduce data to categories with proper typing
    const categoryTotals: Record<string, number> = data
      .filter(item => item.type === ApiTransactionType.EXPENSE)
      .reduce(
        (acc, curr) => {
          // Only process items that have a category
          if (curr.category !== undefined) {
            const category = getCategoryFromId(curr.category)
            if (category) {
              const value = parseFloat(curr.value) / 100 // Convert from cents to euros
              acc[category.name] = (acc[category.name] || 0) + value
            }
          }
          return acc
        },
        {} as Record<string, number>
      )

    // Convert to chart data format
    const chartDataArray = Object.entries(categoryTotals).map(
      ([name, value], idx) => {
        const category = categories.find(cat => cat.name === name)
        const emojiIcons = ["🍏", "🏠", "🚗", "🍔", "💡"]
        return {
          kategorie: name,
          ausgaben: value,
          fill: colorPalette[idx % colorPalette.length],
          icon: emojiIcons[idx % emojiIcons.length] // fallback color
        }
      }
    )

    // Create dynamic chart config
    const dynamicChartConfig: ChartConfig = {
      ausgaben: {
        label: 'Ausgaben',
      },
    }

    // Add each category to the config
    chartDataArray.forEach(item => {
      const category = categories.find(cat => cat.name === item.kategorie)
      if (category) {
        dynamicChartConfig[item.kategorie] = {
          label: category.name,
          color: category.color,
        }
      }
    })

    const total = chartDataArray.reduce((sum, item) => sum + item.ausgaben, 0)

    return {
      chartData: chartDataArray,
      chartConfig: dynamicChartConfig,
      totalAmount: total,
    }
  }, [data, categories, getCategoryFromId])

  if (!data || chartData.length === 0) return <>{JSON.stringify(data)}</>

  return (
    <Card className="flex flex-col p-0 h-48 lg:h-64">
      <CardTitle className="flex items-center gap-1 mx-2 mt-2 -mb-5 font-medium">
        <PieChartIcon className="w-4 h-4 shrink-0" />
        Kategorien
      </CardTitle>
      <CardContent className="flex flex-1 justify-center items-center w-full h-full overflow-hidden">
        <ChartContainer
          className="flex justify-center items-center w-full max-h-full aspect-square"
          config={chartConfig}
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="ausgaben"
              nameKey="kategorie"
              innerRadius="65%"
              outerRadius="105%"
              strokeWidth={3}
              labelLine={false}
            >
              {chartData.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={entry.fill} />
              ))}
              <LabelList
                dataKey="icon"
                position="center"
                fontSize={18}
                className="pointer-events-none"
              />
              <LabelList
                dataKey="ausgaben"
                position="outside"
                fontSize={13}
                formatter={v => v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                className="pointer-events-none"
              />
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground font-bold text-xl"
                        >
                          {totalAmount.toLocaleString()} €
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export default PieChartTile
*/}














































{/*

'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { PieChart as PieChartIcon } from 'lucide-react'
import { Label, Pie, PieChart, Cell } from 'recharts'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { useCategory } from '@/components/provider/category-provider'
import { apiClient } from '@/api/api-client'
import { useQuery } from '@tanstack/react-query'
import { DateTime } from 'luxon'
import { ApiGranularity, ApiTransactionType } from '@/__generated__/api'

function PieChartTile() {
  const { categories, getCategoryFromId } = useCategory()

  const colorPalette = [
    "var(--color-chart-1)",
    "var(--color-chart-2)",
    "var(--color-chart-3)",
    "var(--color-chart-4)",
    "var(--color-chart-5)",
  ]

  // const days =  <get from props>
  const today = DateTime.now()
  const startDate = today.minus({ days: 31 })

  const { data } = useQuery({
    queryKey: ['transactions', 'pie-chart-tile'],
    queryFn: () =>
      apiClient.analytics.analyticsControllerGetTransactionBreakdown({
        startDate: startDate.toISO(),
        endDate: today.toISO(),
        granularity: ApiGranularity.MONTH,
        withCategory: true,
      }),
    select: data => data.data.data,
  })

  const { chartData, chartConfig, totalAmount } = useMemo(() => {
    if (!data) return { chartData: [], chartConfig: {}, totalAmount: 0 }

    // Reduce data to categories with proper typing
    const categoryTotals: Record<string, number> = data
      .filter(item => item.type === ApiTransactionType.EXPENSE)
      .reduce(
        (acc, curr) => {
          // Only process items that have a category
          if (curr.category !== undefined) {
            const category = getCategoryFromId(curr.category)
            if (category) {
              const value = parseFloat(curr.value) / 100 // Convert from cents to euros
              acc[category.name] = (acc[category.name] || 0) + value
            }
          }
          return acc
        },
        {} as Record<string, number>
      )

    // Convert to chart data format
    const chartDataArray = Object.entries(categoryTotals).map(
      ([name, value], idx) => {
        const category = categories.find(cat => cat.name === name)
        return {
          kategorie: name,
          ausgaben: value,
          fill: colorPalette[idx % colorPalette.length] // fallback color
        }
      }
    )

    // Create dynamic chart config
    const dynamicChartConfig: ChartConfig = {
      ausgaben: {
        label: 'Ausgaben',
      },
    }

    // Add each category to the config
    chartDataArray.forEach(item => {
      const category = categories.find(cat => cat.name === item.kategorie)
      if (category) {
        dynamicChartConfig[item.kategorie] = {
          label: category.name,
          color: category.color,
        }
      }
    })

    const total = chartDataArray.reduce((sum, item) => sum + item.ausgaben, 0)

    return {
      chartData: chartDataArray,
      chartConfig: dynamicChartConfig,
      totalAmount: total,
    }
  }, [data, categories, getCategoryFromId])

  if (!data || chartData.length === 0) return <>{JSON.stringify(data)}</>

  return (
    <Card className="flex flex-col p-0 h-48 lg:h-64">
      <CardTitle className="flex items-center gap-1 mx-2 mt-2 -mb-5 font-medium">
        <PieChartIcon className="w-4 h-4 shrink-0" />
        Kategorien
      </CardTitle>
      <CardContent className="flex flex-1 justify-center items-center w-full h-full overflow-hidden">
        <ChartContainer
          className="flex justify-center items-center w-full max-h-full aspect-square"
          config={chartConfig}
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="ausgaben"
              nameKey="kategorie"
              innerRadius="65%"
              outerRadius="105%"
              strokeWidth={3}
            >
              {chartData.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={entry.fill} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground font-bold text-xl"
                        >
                          {totalAmount.toLocaleString()} €
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export default PieChartTile

*/}