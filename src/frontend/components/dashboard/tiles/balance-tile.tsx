import { apiClient } from '@/api/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Wallet } from 'lucide-react'

function BalanceTile() {
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
    <Card className="h-20 p-1.5">
      <CardHeader className="p-0 flex">
        <CardTitle className="flex items-center gap-1 font-medium">
          <Wallet className="w-4 h-4 shrink-0" /> Kontostand
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 -mt-2">
        <div className="font-bold text-2xl">
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
