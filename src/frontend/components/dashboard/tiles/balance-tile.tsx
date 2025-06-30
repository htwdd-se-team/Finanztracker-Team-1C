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
    <Card className={cn('h-18', className)}>
      <CardContent className="flex flex-col justify-center p-3 h-full">
        <div className="flex items-center gap-1 mb-1">
          <Wallet className="w-4 h-4 shrink-0" />
          <span className="font-medium text-sm">Kontostand</span>
        </div>
        <div className="font-bold text-xl leading-tight">
          {(data?.balance / 100).toLocaleString('de-DE', {
            style: 'currency',
            currency: 'EUR',
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default BalanceTile
