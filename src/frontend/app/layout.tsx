import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import LayoutClient from './layout-client'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from 'next-themes'

import { ClientProviders } from '@/components/provider/client-providers'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'FinApp',
  description: 'Best way to manage your money',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Toaster position="top-center" />
          <ClientProviders>
            <LayoutClient>{children}</LayoutClient>
          </ClientProviders>
        </ThemeProvider>
      </body>
    </html>
  )
}
