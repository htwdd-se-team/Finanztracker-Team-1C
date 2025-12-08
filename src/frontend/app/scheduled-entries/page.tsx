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
        take: 10,
      })
      return res.data.entries
    },
  })

  const totalCount = data?.length ?? 0
  const totalIncome = data
  ?.filter(e => e.type === 'INCOME')
  .reduce((sum, e) => sum + e.amount, 0) ?? 0

  const totalExpense = data
  ?.filter(e => e.type === 'EXPENSE')
  .reduce((sum, e) => sum + e.amount, 0) ?? 0

  async function handleDelete(entryId: number) {
    setIsDeleting(true)
    try {
      await apiClient.entries.entryControllerDelete(entryId)
      toast.success('Terminüberweisung gelöscht')
      queryClient.invalidateQueries({ queryKey: ['scheduled-entries'] })
    } catch {
      toast.error('Fehler beim Löschen der Terminüberweisung')
    }
    setIsDeleting(false)
    setDeletingEntryId(undefined)
  }

  return (
    <div className="relative flex flex-col mx-auto px-2 sm:px-6 max-w-4xl container">
      <div className="z-10 relative flex-1 overflow-y-auto">
        <div className="">
          <ul className="space-y-2 w-full">
            <h1 className="flex gap-3 mt-4 sm:mt-6 mb-2 ml-2 font-bold text-2xl">
              <CalendarClock className="w-8 h-8" />
              Terminüberweisungen
            </h1>
            <p className="mt-2 mb-6 ml-2 text-muted-foreground">
              Verwalten Sie Ihre regelmäßigen Transaktionen
            </p>

            {/* SUMMARY BOX */}
            <Card className="p-2 border bg-card/80">
              <CardContent className="p-0">
                <div className="grid grid-cols-3 gap-3 text-center">
                  {/* Anzahl Daueraufträge */}
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Daueraufträge
                    </p>
                    <p className="text-lg font-semibold">{totalCount}</p>
                  </div>
                  {/* Einnahmen */}
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Einnahmen
                    </p>
                    <p className="text-lg font-semibold text-green-600">
                      +{(totalIncome / 100).toFixed(2)} €
                    </p>
                  </div>
                  {/* Ausgaben */}
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Ausgaben
                    </p>
                    <p className="text-lg font-semibold text-red-700">
                      -{(totalExpense / 100).toFixed(2)} €
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="mx-auto border-primary border-b-2 rounded-full w-8 h-8 animate-spin"></div>
              </div>
            ) : (
              <EntryList
                entries={data || []}
                isDeleting={isDeleting}
                deletingEntryId={deletingEntryId}
                setDeletingEntryId={setDeletingEntryId}
                handleDelete={handleDelete}
              />
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
