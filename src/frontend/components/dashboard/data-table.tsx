'use client'

import { Card, CardContent , CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/api-client'
import { Loader2, ArrowRightLeft } from 'lucide-react'
import { ApiEntryResponseDto, ApiTransactionType } from '@/__generated__/api'

function DataTable() {
  const {
    data: entries,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['entries'],
    queryFn: async () => {
      const response = await apiClient.entries.entryControllerList({
        take: 30,
      })
      return response.data
    },
    select: data => data.entries as unknown as ApiEntryResponseDto[],
  })

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-32">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-32">
          <p className="text-muted-foreground text-sm">
            Fehler beim Laden der Transaktionen
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="p-1.5">
        <CardTitle className="flex items-center gap-1 font-medium">
          <ArrowRightLeft className="w-4 h-4 shrink-0" />
          Letzte Transaktionen
        </CardTitle>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Beschreibung</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead className="text-right">Betrag</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries?.map((entry: ApiEntryResponseDto) => (
              <TableRow key={entry.id}>
                <TableCell className="font-medium">
                  {entry.description || 'Keine Beschreibung'}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      entry.type === ApiTransactionType.INCOME
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
                    }`}
                  >
                    {entry.type === ApiTransactionType.INCOME
                      ? 'Einnahme'
                      : 'Ausgabe'}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-right">
                  <span
                    className={
                      entry.type === ApiTransactionType.INCOME
                        ? 'text-green-400'
                        : 'text-red-400'
                    }
                  >
                    {entry.type === ApiTransactionType.INCOME ? '+' : '-'}
                    {(entry.amount / 100).toLocaleString('de-DE', {
                      style: 'currency',
                      currency: 'EUR',
                    })}
                  </span>
                </TableCell>
              </TableRow>
            ))}
            {(!entries || entries.length === 0) && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-muted-foreground text-center"
                >
                  Keine Transaktionen vorhanden
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default DataTable
