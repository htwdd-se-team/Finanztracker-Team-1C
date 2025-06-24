'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/api-client'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface LoggedInCardProps {
  className?: string
}

export function LoggedInCard({ className }: LoggedInCardProps) {
  const router = useRouter()

  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () =>
      apiClient.user.userControllerGetCurrentUser({
        headers: { 'no-error-display': 'true' },
      }),
    select: res => res.data,
    placeholderData: prev => prev,
    retry: false,
  })

  if (isLoading || !user) {
    return null
  }

  return (
    <div
      className={cn(
        'p-4  border border-border  rounded-lg bg-gradient-to-l from-card to-green-500/20',
        className
      )}
    >
      <div className="flex items-center gap-3 text-secondary-foreground">
        <CheckCircle2 className="w-5 h-5" />
        <div className="flex-1">
          <p className="font-medium text-sm">
            Bereits angemeldet als {user.email}
          </p>
        </div>
        <Button onClick={() => router.push('/')} size="sm" asChild>
          <Link href="/">
            <Home className="mr-1 w-4 h-4" />
            Zur App
          </Link>
        </Button>
      </div>
    </div>
  )
}
