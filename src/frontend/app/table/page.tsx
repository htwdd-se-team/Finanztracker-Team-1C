'use client'

import React, { useState } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/api-client'
import { useCategory } from '@/components/provider/category-provider'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Background from '@/components/background'
import { EntryList } from '@/components/entry-list'

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

  const entries: Entry[] = React.useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flatMap(page => page?.entries || [])
  }, [data])

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
          <EntryList
            entries={entries}
            getCategoryFromId={getCategoryFromId}
            isDeleting={isDeleting}
            deletingEntryId={deletingEntryId}
            setDeletingEntryId={setDeletingEntryId}
            handleDelete={handleDelete}
          />
        </ul>
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
