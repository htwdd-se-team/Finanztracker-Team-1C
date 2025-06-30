'use client'

import React, { useState } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/api-client'
import { useCategory } from '@/components/provider/category-provider'
import { Edit, Trash2 } from 'lucide-react'
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

type Entry = {
  id: number
  type: string
  amount: number
  description?: string
  categoryId?: string | number
  currency: string
  createdAt: string
}

type SortKey = keyof Entry
type SortDirection = 'asc' | 'desc'

export default function TablePage() {
  const { getCategoryFromId } = useCategory()
  const [deletingEntryId, setDeletingEntryId] = useState<number | undefined>()
  const [sortKey, setSortKey] = useState<SortKey>('id')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const queryClient = useQueryClient()

  // Use infinite query for cursor-based pagination
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['entries', 'all'],
    queryFn: async ({ pageParam }) => {
      const res = await apiClient.entries.entryControllerList({
        take: 30,
        cursorId: pageParam !== undefined ? Number(pageParam) : undefined,
      })
      return res.data
    },
    getNextPageParam: (lastPage: EntriesPage) => lastPage.cursorId ?? undefined,
    initialPageParam: undefined,
  })

  type EntriesPage = { entries: Entry[]; cursorId?: number | string }

  // Flatten all loaded entries
  const entries: Entry[] = data
    ? (data.pages as EntriesPage[]).flatMap(page => page.entries)
    : []

  // Sorting logic
  const sortedEntries = [...entries].sort((a, b) => {
    let aValue = a[sortKey]
    let bValue = b[sortKey]
    // Special handling for category name and amount/date
    if (sortKey === 'categoryId') {
      const aCat = a.categoryId
        ? getCategoryFromId(Number(a.categoryId))
        : undefined
      const bCat = b.categoryId
        ? getCategoryFromId(Number(b.categoryId))
        : undefined
      aValue = aCat?.name || ''
      bValue = bCat?.name || ''
    }
    if (sortKey === 'amount') {
      aValue = Number(aValue)
      bValue = Number(bValue)
    }
    if (sortKey === 'createdAt') {
      aValue = new Date(aValue as string).getTime()
      bValue = new Date(bValue as string).getTime()
    }
    if (aValue === undefined) return 1
    if (bValue === undefined) return -1
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  // Handle sort click
  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  // Helper for sort arrow
  function sortArrow(key: SortKey) {
    if (sortKey !== key) return null
    return sortDirection === 'asc' ? ' ▲' : ' ▼'
  }

  // Delete entry mutation
  const [isDeleting, setIsDeleting] = useState(false)
  async function handleDelete(entryId: number) {
    setIsDeleting(true)
    try {
      await apiClient.entries.entryControllerDelete(entryId)
      toast.success('Eintrag erfolgreich gelöscht')

      // Remove the deleted entry from the cache
      queryClient.setQueryData(['entries', 'all'], (oldData: unknown) => {
        if (
          !oldData ||
          typeof oldData !== 'object' ||
          oldData === null ||
          !('pages' in oldData) ||
          !Array.isArray((oldData as { pages: EntriesPage[] }).pages)
        ) {
          return oldData
        }
        const oldDataTyped = oldData as { pages: EntriesPage[] }
        // Remove the entry from all pages
        const newPages = oldDataTyped.pages.map((page: EntriesPage) => ({
          ...page,
          entries: page.entries.filter((e: Entry) => e.id !== entryId),
        }))
        // If after deletion, the total entries are less than loaded, fetch more pages if available
        const totalLoaded = newPages.reduce(
          (acc: number, page: EntriesPage) => acc + page.entries.length,
          0
        )
        if (
          oldDataTyped.pages.length > 0 &&
          oldDataTyped.pages[oldDataTyped.pages.length - 1].cursorId !==
            undefined &&
          totalLoaded % 30 === 0 // If we had a full last page before deletion
        ) {
          // Fetch next page to fill the gap
          fetchNextPage()
        }
        return { ...oldDataTyped, pages: newPages }
      })
    } catch {
      toast.error('Fehler beim Löschen des Eintrags')
    }
    setIsDeleting(false)
    setDeletingEntryId(undefined)
  }

  return (
    <>
      <h1 className="text-xl font-bold mb-4">📋 Tabellen</h1>
      {isLoading && <p>Lade Einträge...</p>}
      {isError && <p>Fehler beim Laden der Einträge.</p>}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded">
          <thead>
            <tr className="bg-muted">
              <th
                className="px-4 py-2 text-left cursor-pointer select-none"
                onClick={() => handleSort('id')}
              >
                ID{sortArrow('id')}
              </th>
              <th
                className="px-4 py-2 text-left cursor-pointer select-none"
                onClick={() => handleSort('type')}
              >
                Typ{sortArrow('type')}
              </th>
              <th
                className="px-4 py-2 text-left cursor-pointer select-none"
                onClick={() => handleSort('amount')}
              >
                Betrag{sortArrow('amount')}
              </th>
              <th
                className="px-4 py-2 text-left cursor-pointer select-none"
                onClick={() => handleSort('description')}
              >
                Beschreibung{sortArrow('description')}
              </th>
              <th
                className="px-4 py-2 text-left cursor-pointer select-none"
                onClick={() => handleSort('categoryId')}
              >
                Kategorie{sortArrow('categoryId')}
              </th>
              <th
                className="px-4 py-2 text-left cursor-pointer select-none"
                onClick={() => handleSort('currency')}
              >
                Währung{sortArrow('currency')}
              </th>
              <th
                className="px-4 py-2 text-left cursor-pointer select-none"
                onClick={() => handleSort('createdAt')}
              >
                Erstellt am{sortArrow('createdAt')}
              </th>
              <th className="px-4 py-2 text-left">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {sortedEntries.map(entry => {
              let categoryName = '-'
              if (entry.categoryId && getCategoryFromId) {
                const cat = getCategoryFromId(Number(entry.categoryId))
                if (cat) categoryName = cat.name
              }
              // Map type to German
              const typeLabel =
                entry.type === 'EXPENSE'
                  ? 'Ausgabe'
                  : entry.type === 'INCOME'
                    ? 'Einkommen'
                    : entry.type
              return (
                <tr key={entry.id} className="border-t">
                  <td className="px-4 py-2">{entry.id}</td>
                  <td className="px-4 py-2">{typeLabel}</td>
                  <td className="px-4 py-2">
                    {(entry.amount / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-2">{entry.description || '-'}</td>
                  <td className="px-4 py-2">{categoryName}</td>
                  <td className="px-4 py-2">{entry.currency}</td>
                  <td className="px-4 py-2">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-white/80 dark:hover:bg-black/20 p-0 w-7 h-7 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span className="sr-only">Eintrag bearbeiten</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-destructive/10 p-0 w-7 h-7 text-destructive hover:text-destructive cursor-pointer"
                            disabled={
                              isDeleting && deletingEntryId === entry.id
                            }
                            onClick={() => setDeletingEntryId(entry.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="sr-only">Eintrag löschen</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
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
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {hasNextPage && (
          <div className="flex justify-center my-4">
            <button
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/80 cursor-pointer"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? 'Lädt...' : 'Mehr laden'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
