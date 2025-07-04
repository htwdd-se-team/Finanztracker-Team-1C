'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Goal } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

function SavingsGoal({ className }: { className?: string }) {
  const [progress, setProgress] = useState(0)
  const target = 72
  const duration = 1500
  const interval = 40

  useEffect(() => {
    let current = 0
    const steps = Math.ceil(duration / interval)
    const diff = (target - current) / steps

    const timer = setInterval(() => {
      current += diff
      if (current >= target) {
        setProgress(target)
        clearInterval(timer)
      } else {
        setProgress(current)
      }
    }, interval)

    return () => clearInterval(timer)
  }, [])

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex p-0">
        <CardTitle className="flex items-center gap-1 -mb-3 font-medium">
          <Goal className="w-4 h-4 shrink-0" /> Sparziel
        </CardTitle>
      </CardHeader>
      <CardContent className="-mx-2 -mt-3 px-2">
        <div className="flex items-center gap-2 w-full">
          <Progress value={progress} className="w-[95%]" />
          <span className="min-w-[2ch] font-medium text-muted-foreground text-xs text-right">
            {Math.round(progress)}%
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export default SavingsGoal
