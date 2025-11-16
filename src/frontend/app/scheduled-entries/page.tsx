'use client'

import Background from '@/components/background'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/api-client'
import { toast } from 'sonner'
import { EntryList } from '@/components/entry-list'
import { CalendarClock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ScheduledEntriesPage() {
  const queryClient = useQueryClient()
  const [deletingEntryId, setDeletingEntryId] = useState<number | undefined>()
  const [isDeleting, setIsDeleting] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['scheduled-entries'],
    queryFn: async () => {
      const res = await apiClient.entries.entryControllerGetScheduledEntries({
        take:10
      })
      return res.data.entries
    },
  })

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
    <div className="mx-auto max-w-4xl px-2 sm:px-6 relative flex flex-col container">
      <div className="z-10 relative flex-1 overflow-y-auto">
        <div className="">
          <ul className="space-y-2 w-full">
            <h1 className="flex gap-3 font-bold text-2xl ml-2 mt-4 sm:mt-6 mb-2">
              <CalendarClock className="w-8 h-8" />
              Terminüberweisungen
            </h1>
            <p className="ml-2 mt-2 mb-6 text-muted-foreground">
              Verwalten Sie Ihre regelmäßigen Transaktionen
            </p>

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