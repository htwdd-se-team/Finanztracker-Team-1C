'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/api-client'
import { toast } from 'sonner'
import { EntryList } from '@/components/entry-list'
import { CalendarClock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function ScheduledEntriesPage() {
  const queryClient = useQueryClient()
  const [deletingEntryId, setDeletingEntryId] = useState<number | undefined>()
  const [isDeleting, setIsDeleting] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['scheduled-entries'],
    queryFn: async () => {
      const res = await apiClient.entries.entryControllerGetScheduledEntries({
        take: 30,
      })
      return res.data.entries
    },
  })

  const { data: summaryData } = useQuery({
    queryKey: ['scheduled-entries-summary'],
    queryFn: async () => {
      const res =
        await apiClient.entries.entryControllerGetScheduledEntriesSummary()
      return res.data
    },
  })

  const totalCount = summaryData?.totalCount ?? 0
  const totalIncome = summaryData?.totalIncome ?? 0
  const totalExpense = summaryData?.totalExpense ?? 0

  const incomeEntries = (data ?? []).filter(e => e.type === 'INCOME')
  const expenseEntries = (data ?? []).filter(e => e.type === 'EXPENSE')

  async function handleDelete(entryId: number) {
    setIsDeleting(true)
    try {
      await apiClient.entries.entryControllerDelete(entryId)
      toast.success('Terminüberweisung gelöscht')
      queryClient.invalidateQueries({ queryKey: ['scheduled-entries'] })
      queryClient.invalidateQueries({ queryKey: ['scheduled-entries-summary'] })
    } catch {
      toast.error('Fehler beim Löschen der Terminüberweisung')
    }
    setIsDeleting(false)
    setDeletingEntryId(undefined)
  }

  return (
    <div className="relative flex flex-col mx-auto px-2 sm:px-6 max-w-4xl container">
      <div className="z-10 relative flex-1 overflow-y-auto">
        <h1 className="flex gap-3 mt-4 sm:mt-6 mb-2 ml-2 font-bold text-2xl">
          <CalendarClock className="w-8 h-8" />
          Daueraufträge
        </h1>
        <p className="mt-2 mb-6 ml-2 text-muted-foreground">
          Verwalten Sie Ihre regelmäßigen Transaktionen
        </p>

        {/* SUMMARY BOX */}
        <Card className="bg-card/90 dark:bg-card/60 mb-4 p-2 border h-[70px]">
          <CardContent className="flex items-center p-0 h-full">
            <div className="gap-3 grid grid-cols-3 w-full text-center">
              {/* Anzahl Daueraufträge */}
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                  Daueraufträge
                </p>
                <p className="font-semibold text-lg">{totalCount}</p>
              </div>
              {/* Einnahmen */}
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                  Einnahmen
                </p>
                <p className="font-semibold text-green-600 text-lg">
                  +{(totalIncome / 100).toFixed(2)} €
                </p>
              </div>
              {/* Ausgaben */}
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                  Ausgaben
                </p>
                <p className="font-semibold text-destructive/90 text-lg">
                  -{(totalExpense / 100).toFixed(2)} €
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <ul className="space-y-2 w-full">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="mx-auto border-primary border-b-2 rounded-full w-8 h-8 animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Einnahmen */}
              {incomeEntries.length > 0 && (
                <span className="block mb-1 ml-2 text-bold text-foreground text-lg">
                  Einnahmen
                </span>
              )}
              {incomeEntries.length > 0 && (
                <EntryList
                  entries={incomeEntries}
                  isDeleting={isDeleting}
                  deletingEntryId={deletingEntryId}
                  setDeletingEntryId={setDeletingEntryId}
                  handleDelete={handleDelete}
                />
              )}

              {/* Divider */}
              {incomeEntries.length > 0 && expenseEntries.length > 0 && (
                <span className="block mb-1 ml-2 text-bold text-foreground text-lg">
                  Ausgaben
                </span>
              )}

              {/* Ausgaben */}
              {expenseEntries.length > 0 && (
                <EntryList
                  entries={expenseEntries}
                  isDeleting={isDeleting}
                  deletingEntryId={deletingEntryId}
                  setDeletingEntryId={setDeletingEntryId}
                  handleDelete={handleDelete}
                />
              )}
            </>
          )}
        </ul>
      </div>
    </div>
  )
}
