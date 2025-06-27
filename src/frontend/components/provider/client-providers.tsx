'use client'

import { queryClient } from '@/api/query-client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { SidebarProvider } from '@/components/ui/sidebar'
import { ColorThemeProvider } from './theme-provider'

interface ClientOnlyProvidersProps {
  children: React.ReactNode
}

export function ClientProviders({ children }: ClientOnlyProvidersProps) {
  return (
    <ColorThemeProvider>
      <SidebarProvider>
        <QueryClientProvider client={queryClient}>
          {children}
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools
              initialIsOpen={false}
              buttonPosition="top-left"
            />
          )}
        </QueryClientProvider>
      </SidebarProvider>
    </ColorThemeProvider>
  )
}
