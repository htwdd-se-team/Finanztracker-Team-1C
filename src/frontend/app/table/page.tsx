'use client'

import React, { useState } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/api-client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Background from '@/components/background'
import { EntryList } from '@/components/entry-list'
import { TableFilters } from '@/components/table-filters'
import {
  ApiEntryPageDto,
  ApiEntrySortBy,
  ApiTransactionType,
} from '@/__generated__/api'
import { DateValue } from '@internationalized/date'

export default function TablePage() {
  const [deletingEntryId, setDeletingEntryId] = useState<number | undefined>()
  const queryClient = useQueryClient()

  // Filter state
  const [amountRange, setAmountRange] = useState<[number, number]>([0, 50000])
  const [amountFilterEnabled, setAmountFilterEnabled] = useState<boolean>(false)
  const [selectedCategories, setSelectedCategories] = useState<number[]>([])
  const [dateRange, setDateRange] = useState<{
    start?: DateValue
    end?: DateValue
  }>({})
  const [description, setDescription] = useState<string>('')
  const [transactionType, setTransactionType] = useState<
    ApiTransactionType | undefined
  >(undefined)
  const [sortBy, setSortBy] = useState<ApiEntrySortBy>(
    ApiEntrySortBy.CreatedAtDesc
  )

  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useInfiniteQuery({
      queryKey: [
        'transactions',
        amountRange,
        selectedCategories,
        dateRange,
        transactionType,
        description,
        sortBy,
      ],
      queryFn: async ({ pageParam }) => {
        const res = await apiClient.entries.entryControllerList({
          take: 30,
          amountMax:
            amountFilterEnabled && amountRange[1] > 0
              ? amountRange[1]
              : undefined,
          amountMin:
            amountFilterEnabled && amountRange[0] > 0
              ? amountRange[0]
              : undefined,
          categoryIds:
            selectedCategories.length > 0 ? selectedCategories : undefined,
          dateFrom: dateRange.start ? dateRange.start.toString() : undefined,
          dateTo: dateRange.end ? dateRange.end.toString() : undefined,
          transactionType: transactionType ? transactionType : undefined,
          title: description ? description : undefined,
          sortBy: sortBy,
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

  const handleResetFilters = () => {
    setAmountRange([0, 50000])
    setAmountFilterEnabled(false)
    setSelectedCategories([])
    setDateRange({})
    setDescription('')
    setTransactionType(undefined)
    setSortBy(ApiEntrySortBy.CreatedAtDesc)
  }

  return (
    <div className="relative flex flex-col h-screen">
      <Background />
      <div className="z-10 relative flex-1 p-2 sm:p-4 overflow-auto">
        <div className="mx-auto max-w-4xl">
          <TableFilters
            amountRange={amountRange}
            onAmountRangeChange={setAmountRange}
            amountFilterEnabled={amountFilterEnabled}
            onAmountFilterEnabledChange={setAmountFilterEnabled}
            selectedCategories={selectedCategories}
            onCategoriesChange={setSelectedCategories}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            description={description}
            onDescriptionChange={setDescription}
            transactionType={transactionType}
            onTransactionTypeChange={setTransactionType}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            onReset={handleResetFilters}
          />

          <ul className="space-y-2">
            {isLoading ? (
              <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                  <div className="mx-auto mb-4 border-primary border-b-2 rounded-full w-8 h-8 animate-spin"></div>
                  <p>Einträge werden geladen...</p>
                </div>
              </div>
            ) : (
              <EntryList
                entries={data?.pages.flatMap(page => page?.entries || []) || []}
                isDeleting={isDeleting}
                deletingEntryId={deletingEntryId}
                setDeletingEntryId={setDeletingEntryId}
                handleDelete={handleDelete}
              />
            )}
          </ul>

          {hasNextPage && (
            <div className="bg-background mt-4 p-4 border-t">
              <div className="flex justify-center">
                <Button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="px-6 py-2 cursor-pointer"
                >
                  {isFetchingNextPage ? (
                    <>
                      <div className="mr-2 border-white border-b-2 rounded-full w-4 h-4 animate-spin"></div>
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
    </div>
  )
}
