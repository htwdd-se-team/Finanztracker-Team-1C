import * as React from 'react'
import * as LucideIcons from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { TrendingUp, TrendingDown, Calendar, Edit, Trash2 } from 'lucide-react'
import { CategoryColors, getCategoryColorClasses } from '@/lib/color-map'
import { cn } from '@/lib/utils'

type Entry = {
  id: number
  type: string
  amount: number
  description?: string
  categoryId?: string | number
  currency: string
  createdAt: string
}

interface EntryListProps {
  entries: Entry[]
  getCategoryFromId: (
    id: number
  ) => { color: string; icon?: string; name?: string } | undefined
  isDeleting: boolean
  deletingEntryId: number | undefined
  setDeletingEntryId: (id: number | undefined) => void
  handleDelete: (id: number) => void
}

export function EntryList({
  entries,
  getCategoryFromId,
  isDeleting,
  deletingEntryId,
  setDeletingEntryId,
  handleDelete,
}: EntryListProps) {
  if (entries.length === 0) {
    return (
      <li className="text-center text-muted-foreground py-8">
        Keine Einträge gefunden
      </li>
    )
  }

  return (
    <>
      {entries.map(entry => {
        const isIncome = entry.type === 'INCOME'
        return (
          <li
            key={entry.id}
            className="flex items-center justify-between rounded-xl border px-4 py-3 bg-card/50 dark:bg-card/50 shadow-sm relative"
          >
            <span
              className={cn(
                'absolute left-0 top-2 bottom-2 w-1.5 rounded-full',
                (() => {
                  if (entry.categoryId) {
                    const cat = getCategoryFromId(Number(entry.categoryId))
                    if (cat && cat.color) {
                      return getCategoryColorClasses(
                        cat.color as CategoryColors
                      )
                    }
                  }
                  return undefined
                })()
              )}
              style={{ opacity: 1 }}
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0 flex flex-col justify-center ml-3">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center justify-center rounded-full h-8 w-8 text-base sm:h-10 sm:w-10 sm:text-lg ${
                    isIncome
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {isIncome ? (
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : (
                    <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </span>
                <span className="font-semibold text-base sm:text-lg truncate">
                  {entry.description || '-'}
                </span>
              </div>
              <div className="text-xs sm:text-sm mt-2 flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(entry.createdAt).toLocaleDateString('de-DE')}
                </span>
                {entry.categoryId &&
                  getCategoryFromId &&
                  (() => {
                    const cat = getCategoryFromId(Number(entry.categoryId))
                    if (!cat) return null

                    const iconName =
                      typeof cat.icon === 'string'
                        ? cat.icon.charAt(0).toUpperCase() + cat.icon.slice(1)
                        : 'ShoppingCart'
                    const IconComponent =
                      (
                        LucideIcons as unknown as Record<
                          string,
                          React.ComponentType<{ className?: string }>
                        >
                      )[iconName] || LucideIcons.ShoppingCart

                    return (
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium',
                          getCategoryColorClasses(cat.color as CategoryColors)
                        )}
                        style={{ opacity: 1 }}
                      >
                        <span className="w-4 h-4 flex items-center justify-center">
                          <IconComponent className="w-4 h-4" />
                        </span>
                        {cat.name}
                      </span>
                    )
                  })()}
              </div>
            </div>
            <div className="flex flex-col items-center justify-center mx-4 min-w-[90px] sm:min-w-[120px]">
              <span className={`font-mono font-bold text-base sm:text-lg `}>
                {isIncome ? '+' : '-'}
                {(entry.amount / 100).toFixed(2)} {entry.currency}
              </span>
            </div>
            <div className="flex flex-col items-end justify-center">
              <div className="flex gap-1 sm:gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 w-7 h-7 sm:w-8 sm:h-8 cursor-pointer"
                >
                  <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="sr-only">Eintrag bearbeiten</span>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 w-7 h-7 sm:w-8 sm:h-8 text-destructive cursor-pointer"
                      disabled={isDeleting && deletingEntryId === entry.id}
                      onClick={() => setDeletingEntryId(entry.id)}
                    >
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="sr-only">Eintrag löschen</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="sm:max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Eintrag löschen?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Möchten Sie den Eintrag wirklich löschen? Diese Aktion
                        kann nicht rückgängig gemacht werden.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="cursor-pointer">
                        Abbrechen
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(entry.id)}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground cursor-pointer"
                      >
                        Löschen
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </li>
        )
      })}
    </>
  )
}
