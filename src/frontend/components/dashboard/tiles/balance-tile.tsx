import { apiClient } from '@/api/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Wallet } from 'lucide-react'

function BalanceTile({ className }: { className?: string }) {
  const { data } = useQuery({
    queryKey: ['transactions', 'balance'],
    queryFn: apiClient.user.userControllerGetBalance,
    select: data => data.data,
    placeholderData: previousData => previousData,
  })

  if (!data) {
    return (
      <Card className={cn('h-18', className)}>
        <CardContent className="flex justify-center items-center h-full">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('h-18 p-1.5', className)}>
      <div className="flex flex-col h-full w-full">
          <div className="flex items-center gap-1 font-medium">
            <Wallet className="w-4 h-4 shrink-0" />
            Kontostand
          </div>
          <div className="flex flex-col justify-center h-full">
            <div className="font-bold text-2xl leading-tight">
              {(data?.balance / 100).toLocaleString('de-DE', {
                style: 'currency',
                currency: 'EUR',
              })}
            </div>
          </div>
        </div>
    </Card>
  )
}

export default BalanceTile
