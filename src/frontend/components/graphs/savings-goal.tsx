'use client'

import { useState, useEffect } from 'react'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Pencil, Save, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiClient } from '@/api/api-client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

function SavingsGoal({ className }: { className?: string }) {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')

  // Fetch balance and emergency reserve
  const { data, isLoading } = useQuery({
    queryKey: ['transactions', 'balance'],
    queryFn: apiClient.user.userControllerGetBalance,
    select: (res) => res.data,
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
      <Card className={cn('h-full min-h-[160px] flex items-center justify-center', className)}>
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </Card>
    )
  }

  // Calculate percentages
  const currentAmount = data.balance
  const targetAmount = data.emergencyReserve || 1 // Avoid division by zero
  const fillPercentage = Math.min(Math.max((currentAmount / targetAmount) * 100, 0), 100)

  // Dynamic color based on progress (red -> yellow -> green/primary)
  let fillColor = 'bg-red-500/20'
  let textColor = 'text-destructive/90'

  if (fillPercentage >= 100) {
    fillColor = 'bg-primary/20'
    textColor = 'text-primary'
  } else if (fillPercentage >= 50) {
    fillColor = 'bg-yellow-500/20'
    textColor = 'text-yellow-600 dark:text-yellow-400'
  }

  const formatCurrency = (cents: number) =>
    (cents / 100).toLocaleString('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    })

  return (
    <Card className={cn('relative overflow-hidden p-1.5', className)}>
        <CardTitle className="ml-2 text-lg">
          Notgroschen
        </CardTitle>
      <div className="absolute top-3 right-3 z-20">
        {isEditing ? (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 hover:bg-background/80"
            onClick={handleSave}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 hover:bg-background/80 text-muted-foreground/50 hover:text-foreground"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </div>

      <CardContent className="p-2 h-full flex flex-col items-center justify-center relative z-10">
        {/* Main circular visualization */}
        <div className="relative w-72 h-72 -mt-6">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-4 border-muted/60" />

            {/* Inner fill container */}
            <div className="absolute inset-2 rounded-full overflow-hidden bg-background/50 backdrop-blur-[2px]">
                {/* Liquid Fill */}
                <div
                    className={cn(
                        "absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out",
                        fillColor
                    )}
                    style={{ height: `${fillPercentage}%` }}
                >
                  {/* Wave effect */ }
                  <div className="absolute -top-6 w-[200%] h-12 left-0 animate-wave"
                       style={{
                         backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNDQwIDMyMCI+PHBhdGggZmlsbD0iI2ZmZmZmZiIgZmlsbC1vcGFjaXR5PSIwLjIiIGQ9Ik0wLDk2TDQ4LDExMi4yQzk2LDEyOCwxOTIsMTYwLDI4OCwxNjBDMzg0LDE2MCw0ODAsMTI4LDU3NiwxMTJDNjcyLDk2LDc2OCw5Niw4NjQsMTEyQzk2MCwxMjgsMTA1NiwxNjAsMTE1MiwxNjBDMTI0OCwxNjAsMTM0NCwxMjgsMTM5MiwxMTJMMTQ0MCw5NkwxNDQwLDMyMEwxMzkyLDMyMEMxMzQ0LDMyMCwxMjQ4LDMyMCwxMTUyLDMyMEMxMDU2LDMyMCw5NjAsMzIwLDg2NCwzMjBDNzY4LDMyMCw2NzIsMzIwLDU3NiwzMjBDNDgwLDMyMCwzODQsMzIwLDI4OCwzMjBDMTkyLDMyMCw5NiwzMjAsNDgsMzIwTDAsMzIwWiI+PC9wYXRoPjwvc3ZnPg==')",
                         backgroundRepeat: 'repeat-x',
                         backgroundSize: '50% 100%'
                       }}
                  />
                </div>
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">

                {isEditing ? (
                    <div className="flex items-center justify-center w-32">
                        <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="h-8 text-center text-lg font-bold bg-background/80 backdrop-blur"
                            placeholder="0.00"
                            autoFocus
                        />
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <span className="text-3xl sm:text-4xl font-bold tracking-tight">
                            {formatCurrency(currentAmount)}
                        </span>
                        <div className="h-px w-12 bg-border my-2" />
                        <span className="text-sm text-foreground/80 font-medium">
                            Ziel: {formatCurrency(targetAmount)}
                        </span>
                    </div>
                )}

                <div className={cn("mt-2 text-xs font-bold px-2 py-0.5 rounded-full bg-background/60 backdrop-blur-sm border shadow-sm", textColor)}>
                    {Math.round(fillPercentage)}% Erreicht
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default SavingsGoal
