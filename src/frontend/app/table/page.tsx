'use client'

import React, { useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/api-client'
import { useCategory } from '@/components/provider/category-provider'

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

  // Sorting state
  const [sortKey, setSortKey] = useState<SortKey>('id')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

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
                </tr>
              )
            })}
          </tbody>
        </table>
        {hasNextPage && (
          <div className="flex justify-center my-4">
            <button
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/80"
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
