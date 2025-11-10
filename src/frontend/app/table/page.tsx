'use client'

import React, { useEffect, useState } from 'react'
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { apiClient } from '@/api/api-client'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from '@/components/ui/select'
import { IconRender } from '@/lib/icon-map'
import { Plus, Edit } from 'lucide-react'
import { toast } from 'sonner'
import Background from '@/components/background'
import { EntryList } from '@/components/entry-list'
import { TableFilters } from '@/components/table-filters'
import FilterDialog from '@/components/filter-dialog'
import {
  ApiEntryPageDto,
  ApiEntrySortBy,
  ApiFilterResponseDto,
  ApiFilterSortOption,
  ApiTransactionType,
} from '@/__generated__/api'
import { DateValue } from '@internationalized/date'

export default function TablePage() {
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)
  const [selectedFilter, setSelectedFilter] =
    useState<ApiFilterResponseDto | null>(null)
  const [editingFilter, setEditingFilter] =
    useState<ApiFilterResponseDto | null>(null)
  const [deletingEntryId, setDeletingEntryId] = useState<number | undefined>()
  const queryClient = useQueryClient()

  // Filter state
  const [amountRange, setAmountRange] = useState<[number, number]>([0, 50000])
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

  const { data: filters } = useQuery({
    queryKey: ['filters'],
    queryFn: async () => {
      const res = await apiClient.filters.filterControllerList()
      return res.data
    },
  })

  const { data: filterDetails } = useQuery({
    queryKey: ['filterDetails'],
    queryFn: async () => {
      const res = await apiClient.analytics.analyticsControllerFilterDetails()
      return res.data
    },
  })

  useEffect(() => {
    if (filterDetails) {
      setAmountRange([0, filterDetails.maxPrice])
    }
  }, [filterDetails])

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
            amountRange[1] == filterDetails?.maxPrice
              ? undefined
              : amountRange[1],
          amountMin: amountRange[0] == 0 ? undefined : amountRange[0],
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
    setAmountRange([0, filterDetails?.maxPrice || 50000])
    setSelectedCategories([])
    setDateRange({})
    setDescription('')
    setTransactionType(undefined)
    setSortBy(ApiEntrySortBy.CreatedAtDesc)
  }

  return (
    <>
      <div className="relative flex flex-col h-screen">
        <Background />
        <div className="z-10 relative flex-1 p-2 sm:p-4 overflow-y-auto">
          <div className="mx-auto max-w-4xl">
            <div className="z-50 relative">
              {filterDetails && (
                <TableFilters
                  maxPrice={filterDetails.maxPrice}
                  amountRange={amountRange}
                  onAmountRangeChange={setAmountRange}
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
              )}

              {/* Filter Management */}
              <div className="mt-3 flex gap-2 items-center">
                <Select
                  value={selectedFilter?.id?.toString() || 'none'}
                  onValueChange={value => {
                    if (value === 'none') {
                      setSelectedFilter(null)
                      handleResetFilters()
                      return
                    }
                    const filter = filters?.find(f => f.id.toString() === value)
                    if (filter) {
                      setSelectedFilter(filter)
                      // Apply filter settings
                      setAmountRange([
                        filter.minPrice || 0,
                        filter.maxPrice || filterDetails?.maxPrice || 50000,
                      ])
                      setSelectedCategories(filter.categoryIds || [])
                      setDateRange({
                        start: filter.dateFrom
                          ? (new Date(filter.dateFrom) as unknown as DateValue)
                          : undefined,
                        end: filter.dateTo
                          ? (new Date(filter.dateTo) as unknown as DateValue)
                          : undefined,
                      })
                      setDescription(filter.searchText || '')
                      setTransactionType(filter.transactionType || undefined)
                      setSortBy(
                        filter.sortOption === ApiFilterSortOption.HIGHEST_AMOUNT
                          ? ApiEntrySortBy.AmountDesc
                          : filter.sortOption ===
                              ApiFilterSortOption.LOWEST_AMOUNT
                            ? ApiEntrySortBy.AmountAsc
                            : filter.sortOption ===
                                ApiFilterSortOption.OLDEST_FIRST
                              ? ApiEntrySortBy.CreatedAtAsc
                              : ApiEntrySortBy.CreatedAtDesc
                      )
                      // Apply filter settings
                      setAmountRange([
                        filter.minPrice || 0,
                        filter.maxPrice || filterDetails?.maxPrice || 50000,
                      ])
                      setSelectedCategories(filter.categoryIds || [])
                      setDateRange({
                        start: filter.dateFrom
                          ? (new Date(filter.dateFrom) as unknown as DateValue)
                          : undefined,
                        end: filter.dateTo
                          ? (new Date(filter.dateTo) as unknown as DateValue)
                          : undefined,
                      })
                      setDescription(filter.searchText || '')
                      setTransactionType(filter.transactionType || undefined)
                      setSortBy(
                        filter.sortOption === ApiFilterSortOption.HIGHEST_AMOUNT
                          ? ApiEntrySortBy.AmountDesc
                          : filter.sortOption ===
                              ApiFilterSortOption.LOWEST_AMOUNT
                            ? ApiEntrySortBy.AmountAsc
                            : filter.sortOption ===
                                ApiFilterSortOption.OLDEST_FIRST
                              ? ApiEntrySortBy.CreatedAtAsc
                              : ApiEntrySortBy.CreatedAtDesc
                      )
                    }
                  }}
                >
                  <SelectTrigger className="w-[200px] cursor-pointer hover:bg-accent hover:text-accent-foreground">
                    {selectedFilter ? (
                      <div className="flex items-center gap-2">
                        {selectedFilter.icon && (
                          <IconRender
                            iconName={selectedFilter.icon}
                            className="w-4 h-4"
                          />
                        )}
                        <span>{selectedFilter.title}</span>
                      </div>
                    ) : (
                      <SelectValue placeholder="Filter auswählen" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {/* Create New Filter Button */}
                    <Button
                      variant="secondary"
                      className="px-2 py-1.5 rounded-sm w-full text-sm cursor-pointer"
                      onClick={e => {
                        e.preventDefault()
                        e.stopPropagation()
                        setEditingFilter(null)
                        setFilterDialogOpen(true)
                      }}
                    >
                      <Plus className="mr-2 w-4 h-4" /> Filter erstellen
                    </Button>
                    <SelectSeparator />
                    <SelectItem
                      value="none"
                      className="cursor-pointer hover:bg-accent hover:text-accent-foreground group"
                    >
                      <span className="text-muted-foreground group-hover:text-accent-foreground">
                        Kein Filter
                      </span>
                    </SelectItem>
                    <SelectSeparator />{' '}
                    {filters?.map(filter => (
                      <SelectItem
                        key={filter.id}
                        value={filter.id.toString()}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          {filter.icon && (
                            <IconRender
                              iconName={filter.icon}
                              className="w-4 h-4"
                            />
                          )}
                          <span>{filter.title}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedFilter && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                    onClick={() => {
                      setEditingFilter(selectedFilter)
                      setFilterDialogOpen(true)
                    }}
                    title="Filter bearbeiten"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <ul className="space-y-2 mt-3">
              {isLoading ? (
                <div className="flex justify-center items-center h-screen">
                  <div className="text-center">
                    <div className="mx-auto mb-4 border-primary border-b-2 rounded-full w-8 h-8 animate-spin"></div>
                    <p>Einträge werden geladen...</p>
                  </div>
                </div>
              ) : (
                <EntryList
                  entries={
                    data?.pages.flatMap(page => page?.entries || []) || []
                  }
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
      <FilterDialog
        open={filterDialogOpen}
        onOpenChange={open => {
          setFilterDialogOpen(open)
          if (!open) {
            setEditingFilter(null)
          }
        }}
        initialFilter={editingFilter}
      />
    </>
  )
}
