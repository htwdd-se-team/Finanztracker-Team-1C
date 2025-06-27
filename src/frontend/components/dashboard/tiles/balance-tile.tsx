import { apiClient } from '@/api/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Wallet } from 'lucide-react'

function BalanceTile() {
  // Mock data for now since there's no balance endpoint
  const { data, isLoading, error } = useQuery({
    queryKey: ['balance'],
    queryFn: apiClient.user.userControllerGetBalance,
    select: data => data.data,
  })

  if (isLoading) {
    return (
      <Card className="h-24 lg:h-32">
        <CardContent className="flex justify-center items-center h-full">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="h-24 lg:h-32">
        <CardContent className="flex justify-center items-center h-full">
          <p className="text-muted-foreground text-sm">Fehler beim Laden</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-24 lg:h-32">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 font-medium text-sm">
          <Wallet className="w-4 h-4" />
          Kontostand
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="font-bold text-2xl">
          {data?.balance.toLocaleString('de-DE', {
            style: 'currency',
            currency: 'EUR',
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default BalanceTile
