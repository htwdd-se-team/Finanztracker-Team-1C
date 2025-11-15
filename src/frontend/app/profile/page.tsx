'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  User,
  Mail,
  Calendar,
  Settings,
  Monitor,
  Moon,
  Sun,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { DateTime } from 'luxon'
import {
  Theme,
  ThemeConfig,
  useColorTheme,
} from '@/components/provider/theme-provider'
import { ThemeCard } from '@/components/settings/ThemeCard'
import { useUser } from '@/components/provider/user-provider'
import { CategoryManagement } from '@/components/settings/category-management'
import { FilterManagement } from '@/components/settings/filter-management'

export default function ProfilePage() {
  const { user } = useUser()

  const { themeVariant, setThemeVariant, colorTheme, setColorTheme } =
    useColorTheme()

  const themes = [
    { key: Theme.LIGHT, label: 'Hell', icon: Sun },
    { key: Theme.DARK, label: 'Dunkel', icon: Moon },
    { key: Theme.SYSTEM, label: 'System', icon: Monitor },
  ]

  const fullName = `${user?.givenName} ${user?.familyName || ''}`.trim()

  return (
    <div className="mx-auto p-6 max-w-6xl container">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 font-bold text-3xl">
          <User className="w-8 h-8" />
          Profil
        </h1>
        <p className="mt-2 text-muted-foreground">
          Verwalten Sie Ihre Kontoeinstellungen und Kategorien
        </p>
      </div>

      <div className="gap-6 grid md:grid-cols-2 lg:grid-cols-3">
        {/* User Information Card */}
        {user ? (
          <Card className="bg-card/90 dark:bg-card/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Benutzerinformationen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Email:</span>
                  <span className="text-sm">{user.email}</span>
                </div>

                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Name:</span>
                  <span className="text-sm">{fullName}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-sm -mr-2">Mitglied seit:</span>
                  <Badge variant="secondary" className="text-xs bg-transparent">
                    {DateTime.fromISO(user.createdAt).toLocaleString(
                      DateTime.DATE_FULL
                    )}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <Skeleton className="w-32 h-6" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-4">
                <Skeleton className="rounded-full w-16 h-16" />
                <div className="space-y-2">
                  <Skeleton className="w-32 h-5" />
                  <Skeleton className="w-40 h-4" />
                </div>
              </div>
              <Skeleton className="mb-2 w-full h-4" />
              <Skeleton className="w-3/4 h-4" />
            </CardContent>
          </Card>
        )}

        {/* Settings Card */}
        <Card className="lg:col-span-2 bg-card/90 dark:bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Einstellungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className={'flex flex-col  gap-3'}>
                <div className="space-y-0.5">
                  <Label>Farbschema</Label>

                  <p className="text-muted-foreground text-sm">
                    Wählen Sie Ihr bevorzugtes Farbschema
                  </p>
                </div>
                <div className="flex gap-1 bg-muted p-1 rounded-lg w-full sm:w-auto">
                  {themes.map(({ key, label, icon: Icon }) => {
                    const isActive = themeVariant === key

                    return (
                      <Button
                        key={key}
                        variant={isActive ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setThemeVariant(key)}
                        className={cn(
                          'h-8 px-2 sm:px-3 transition-all duration-200 flex-1 sm:flex-none',
                          isActive
                            ? 'bg-background shadow-sm text-foreground'
                            : 'hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <Icon className="mr-1.5 w-4 h-4" />
                        <span className="font-medium text-xs">{label}</span>
                      </Button>
                    )
                  })}
                </div>
                <div className="gap-3 grid grid-cols-2 sm:grid-cols-3">
                  {ThemeConfig.map(theme => (
                    <ThemeCard
                      key={theme.key}
                      theme={theme}
                      isActive={colorTheme === theme.key}
                      setColorTheme={setColorTheme}
                    />
                  ))}
                </div>
              </div>

              <Separator />

              <div className="text-muted-foreground text-sm">
                Weitere Einstellungen kommen bald...
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Management - spans full width on larger screens */}
        <div className="md:col-span-2 lg:col-span-3">
          <CategoryManagement />
        </div>

        {/* Filter Management - spans full width on larger screens */}
        <div className="md:col-span-2 lg:col-span-3">
          <FilterManagement />
        </div>
      </div>
    </div>
  )
}
