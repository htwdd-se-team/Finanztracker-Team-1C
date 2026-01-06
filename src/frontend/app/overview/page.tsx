'use client'

import { EntryList } from '@/components/entry-list'
import GraphGrids from '@/components/dashboard/graph-grids'
import { useState } from 'react'
import { useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/api-client'
import { toast } from 'sonner'
import React from 'react'
import { ApiEntryPageDto } from '@/__generated__/api'

export default function OverviewPage() {
  const [deletingEntryId, setDeletingEntryId] = useState<number | undefined>()
  const queryClient = useQueryClient()

  const { data } = useInfiniteQuery({
    queryKey: ['transactions', 'recent'],
    queryFn: async ({ pageParam }) => {
      const res = await apiClient.entries.entryControllerList({
        take: 5,
        cursorId: pageParam !== undefined ? Number(pageParam) : undefined,
      })
      return res.data as ApiEntryPageDto
    },
    getNextPageParam: (lastPage: ApiEntryPageDto) => {
      if (!lastPage.entries || lastPage.entries.length === 0) {
        return undefined
      }
      return lastPage.cursorId !== undefined && lastPage.cursorId !== null
        ? lastPage.cursorId
        : undefined
    },
    initialPageParam: undefined,
  })

  const [isDeleting, setIsDeleting] = useState(false)
  async function handleDelete(entryId: number) {
    setIsDeleting(true)
    try {
      await apiClient.entries.entryControllerDelete(entryId)
      toast.success('Eintrag erfolgreich gelöscht')
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    } catch {
      toast.error('Fehler beim Löschen des Eintrags')
    }
    setIsDeleting(false)
    setDeletingEntryId(undefined)
  }

  return (
    <div className="mx-auto max-w-4xl px-2 pt-2 sm:p-6 container">
      {/* Graph Grids Section */}
      <GraphGrids />

      {/* Entry List Section */}
      <ul className="space-y-2 mt-6 w-full">
        <h2 className="font-bold text-2xl">Neueste Einträge</h2>
        <EntryList
          entries={data?.pages.flatMap(page => page?.entries || []) || []}
          isDeleting={isDeleting}
          deletingEntryId={deletingEntryId}
          setDeletingEntryId={setDeletingEntryId}
          handleDelete={handleDelete}
        />
      </ul>
    </div>
  )
}
