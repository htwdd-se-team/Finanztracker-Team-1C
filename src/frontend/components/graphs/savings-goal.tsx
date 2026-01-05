'use client'

import { useState, useEffect } from 'react'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Pencil, Save, Loader2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiClient } from '@/api/api-client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { MeshGradient } from '@paper-design/shaders-react'

function SavingsGoal({ className }: { className?: string }) {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')

  // Fetch balance and emergency reserve
  const { data, isLoading } = useQuery({
    queryKey: ['transactions', 'balance'],
    queryFn: apiClient.user.userControllerGetBalance,
    select: res => res.data,
  })

  // Update emergency reserve mutation
  const mutation = useMutation({
    mutationFn: (newGoal: number) =>
      apiClient.user.userControllerUpdateEmergencyReserve({
        emergencyReserve: newGoal,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', 'balance'] })
      setIsEditing(false)
      toast.success('Sparziel aktualisiert')
    },
    onError: () => {
      toast.error('Fehler beim Aktualisieren des Sparziels')
    },
  })

  // Initialize edit value when opening edit mode
  useEffect(() => {
    if (isEditing && data) {
      setEditValue((data.emergencyReserve / 100).toFixed(2))
    }
  }, [isEditing, data])

  const handleSave = () => {
    const newAmount = parseFloat(editValue.replace(',', '.'))
    if (!isNaN(newAmount) && newAmount >= 0) {
      mutation.mutate(Math.round(newAmount * 100))
    } else {
      toast.error('Bitte geben Sie einen gültigen Betrag ein')
    }
  }

  if (isLoading || !data) {
    return (
      <Card
        className={cn(
          'flex justify-center items-center h-full min-h-[160px]',
          className
        )}
      >
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
      </Card>
    )
  }

  // Calculate percentages
  const currentAmount = data.balance
  const targetAmount = data.emergencyReserve || 1 // Avoid division by zero
  const fillPercentage = Math.min(
    Math.max((currentAmount / targetAmount) * 100, 0),
    100
  )

  // Dynamic color based on progress (red -> yellow -> green/primary)
  let textColor = 'text-destructive/90'
  let meshColors: [string, string, string, string] = [
    '#ef4444',
    '#dc2626',
    '#f87171',
    '#b91c1c',
  ]

  if (fillPercentage >= 100) {
    textColor = 'text-primary'
    meshColors = ['#22c55e', '#16a34a', '#4ade80', '#15803d']
  } else if (fillPercentage >= 50) {
    textColor = 'text-yellow-600 dark:text-yellow-400'
    meshColors = ['#eab308', '#facc15', '#ca8a04', '#fde047']
  }

  const formatCurrency = (cents: number) =>
    (cents / 100).toLocaleString('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    })

  return (
    <Card className={cn('relative p-1.5 overflow-hidden', className)}>
      <CardTitle className="ml-2 text-lg">Notgroschen</CardTitle>
      <div className="top-2 right-2 z-20 absolute flex items-center">
        {isEditing ? (
          <Button
            size="icon"
            variant="ghost"
            className="hover:bg-background/80 w-8 h-8"
            onClick={handleSave}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
          </Button>
        ) : (
          <Button
            size="icon"
            variant="ghost"
            className="w-8 h-8 text-muted-foreground/50 hover:text-foreground"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="w-4 h-4" />
          </Button>
        )}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex justify-center items-center hover:bg-accent dark:hover:bg-accent/50 rounded-md w-8 h-8 text-muted-foreground/50 hover:text-foreground transition"
              aria-label="Info"
            >
              <Info className="w-5 h-5" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 text-sm">
            <div className="space-y-1">
              <div className="font-semibold">Notgroschen</div>
              <p className="text-muted-foreground">
                Legen Sie fest, welcher Betrag als finanzielle Reserve gelten
                soll. Dieser Wert dient als Orientierung für Ihren Kontostand.
              </p>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <CardContent className="z-10 relative flex flex-col justify-center items-center p-2 h-full">
        {/* Main circular visualization */}
        <div className="relative -mt-6 w-72 h-72">
          {/* Outer ring */}
          <div className="absolute inset-0 border-4 border-muted/60 rounded-full" />

          {/* Inner fill container */}
          <div className="absolute inset-2 bg-background/50 backdrop-blur-[2px] rounded-full overflow-hidden">
            {/* Liquid Fill with MeshGradient - soft gradient fade at top */}
            <div
              className="right-0 bottom-0 left-0 absolute transition-all duration-1000 ease-out"
              style={{
                height: `${fillPercentage}%`,
                maskImage:
                  'linear-gradient(to bottom, transparent 0%, black 15%, black 100%)',
                WebkitMaskImage:
                  'linear-gradient(to bottom, transparent 0%, black 15%, black 100%)',
              }}
            >
              <MeshGradient
                colors={meshColors}
                distortion={0.5}
                swirl={0.6}
                speed={0.5}
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'absolute',
                  inset: 0,
                  opacity: 0.7,
                }}
              />
            </div>
          </div>

          {/* Content Overlay */}
          <div className="absolute inset-0 flex flex-col justify-center items-center p-4 text-center">
            {isEditing ? (
              <div className="flex justify-center items-center w-32">
                <Input
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  className="bg-background/80 backdrop-blur h-8 font-bold text-lg text-center"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span className="font-bold text-3xl sm:text-4xl tracking-tight">
                  {formatCurrency(currentAmount)}
                </span>
                <div className="my-2 bg-border w-12 h-px" />
                <span className="font-medium text-foreground/80 text-sm">
                  Ziel: {formatCurrency(targetAmount)}
                </span>
              </div>
            )}

            <div
              className={cn(
                'bg-background/60 shadow-sm backdrop-blur-sm mt-2 px-2 py-0.5 border rounded-full font-bold text-xs',
                textColor
              )}
            >
              {Math.round(fillPercentage)}% Erreicht
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default SavingsGoal
