'use client'

import { EntryList } from '@/components/entry-list'
import GraphGrids from '@/components/dashboard/graph-grids'
import { useCategory } from '@/components/provider/category-provider'
import { useState } from 'react'
import { useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/api-client'
import { toast } from 'sonner'
import React from 'react'

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

export default function OverviewPage() {
  const { getCategoryFromId } = useCategory()
  const [deletingEntryId, setDeletingEntryId] = useState<number | undefined>()
  const queryClient = useQueryClient()

  const { data } = useInfiniteQuery({
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

  return (
    <div className="space-y-2 w-full">
      {/* Graph Grids Section */}
      <GraphGrids />

      {/* Entry List Section */}
      <ul className="space-y-2 w-full px-0 sm:px-2 md:px-4 lg:px-4 xl:px-2">
        <EntryList
          entries={entries}
          getCategoryFromId={getCategoryFromId}
          isDeleting={isDeleting}
          deletingEntryId={deletingEntryId}
          setDeletingEntryId={setDeletingEntryId}
          handleDelete={handleDelete}
        />
      </ul>
    </div>
  )
}
