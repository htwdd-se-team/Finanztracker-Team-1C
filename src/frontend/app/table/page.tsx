'use client'

import React, { useState } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/api-client'
import { useCategory } from '@/components/provider/category-provider'
import { Edit, Trash2, TrendingUp, TrendingDown, Calendar } from 'lucide-react'
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
import { toast } from 'sonner'
import Background from '@/components/background'
import * as LucideIcons from 'lucide-react'
import { getCategoryColorClasses } from '@/lib/color-map'
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

type EntriesPage = { entries: Entry[]; cursorId?: number | string }

export default function TablePage() {
  const { getCategoryFromId } = useCategory()
  const [deletingEntryId, setDeletingEntryId] = useState<number | undefined>()
  const queryClient = useQueryClient()

  // Use infinite query for cursor-based pagination
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['entries', 'all'],
    queryFn: async ({ pageParam }) => {
      const res = await apiClient.entries.entryControllerList({
        take: 30,
        cursorId: pageParam !== undefined ? Number(pageParam) : undefined,
      })
      return res.data as EntriesPage
    },
    getNextPageParam: (lastPage: EntriesPage) => {
      if (!lastPage.entries || lastPage.entries.length === 0) {
        return undefined
      }
      return lastPage.cursorId !== undefined && lastPage.cursorId !== null
        ? lastPage.cursorId
        : undefined
    },
    initialPageParam: undefined,
  })

  // Flatten all loaded entries
  const entries: Entry[] = React.useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flatMap(page => page?.entries || [])
  }, [data])

  // Delete entry mutation
  const [isDeleting, setIsDeleting] = useState(false)
  async function handleDelete(entryId: number) {
    setIsDeleting(true)
    try {
      await apiClient.entries.entryControllerDelete(entryId)
      toast.success('Eintrag erfolgreich gelöscht')
      queryClient.invalidateQueries({ queryKey: ['entries', 'all'] })
    } catch {
      toast.error('Fehler beim Löschen des Eintrags')
    }
    setIsDeleting(false)
    setDeletingEntryId(undefined)
  }

  // Handle load more
  const handleLoadMore = async () => {
    try {
      await fetchNextPage()
    } catch {
      toast.error('Fehler beim Laden weiterer Einträge')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Einträge werden geladen...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-destructive">
          <p>Fehler beim Laden der Einträge</p>
          <Button
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ['entries', 'all'] })
            }
            className="mt-4"
          >
            Erneut versuchen
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen relative">
      <Background />
      <div className="flex-1 overflow-auto p-2 sm:p-4 relative z-10">
        <ul className="space-y-2 max-w-3xl mx-auto">
          {entries.length === 0 ? (
            <li className="text-center text-muted-foreground py-8">
              Keine Einträge gefunden
            </li>
          ) : (
            entries.map(entry => {
              if (entry.categoryId && getCategoryFromId) {
                getCategoryFromId(Number(entry.categoryId))
              }
              const isIncome = entry.type === 'INCOME'
              return (
                <li
                  key={entry.id}
                  className="flex items-center justify-between rounded-xl border px-4 py-3 bg-card/50 backdrop-blur-2xl dark:bg-card/50 shadow-sm relative"
                >
                  {/* Farbbalken links */}
                  <span
                    className={cn(
                      'absolute left-0 top-2 bottom-2 w-1.5 rounded-full',
                      entry.categoryId &&
                        getCategoryColorClasses(
                          getCategoryFromId(Number(entry.categoryId)).color
                        )
                    )}
                    style={{ opacity: 1 }}
                    aria-hidden="true"
                  />
                  {/* Restlicher Eintrag */}
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
                      {/* Date badge */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(entry.createdAt).toLocaleDateString('de-DE')}
                      </span>
                      {/* Category badge */}
                      {entry.categoryId &&
                        getCategoryFromId &&
                        (() => {
                          const cat = getCategoryFromId(
                            Number(entry.categoryId)
                          )
                          if (!cat) return null

                          const iconName =
                            typeof cat.icon === 'string'
                              ? cat.icon.charAt(0).toUpperCase() +
                                cat.icon.slice(1)
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
                                getCategoryColorClasses(cat.color)
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
                  {/* Middle: Amount */}
                  <div className="flex flex-col items-center justify-center mx-4 min-w-[90px] sm:min-w-[120px]">
                    <span
                      className={`font-mono font-bold text-base sm:text-lg `}
                    >
                      {isIncome ? '+' : '-'}
                      {(entry.amount / 100).toFixed(2)} {entry.currency}
                    </span>
                  </div>
                  {/* Right: Edit/Delete */}
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
                            disabled={
                              isDeleting && deletingEntryId === entry.id
                            }
                            onClick={() => setDeletingEntryId(entry.id)}
                          >
                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="sr-only">Eintrag löschen</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="sm:max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Eintrag löschen?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Möchten Sie den Eintrag wirklich löschen? Diese
                              Aktion kann nicht rückgängig gemacht werden.
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
            })
          )}
        </ul>
        {/* Load more section */}
        {hasNextPage && (
          <div className="border-t bg-background p-4">
            <div className="flex justify-center">
              <Button
                onClick={handleLoadMore}
                disabled={isFetchingNextPage}
                className="px-6 py-2 cursor-pointer"
              >
                {isFetchingNextPage ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Lädt...
                  </>
                ) : (
                  'Mehr laden'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
