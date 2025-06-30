'use client'

import { Card, CardContent, CardTitle } from '@/components/ui/card'
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
import { IconMap } from '@/lib/icon-map'
import { useCategory } from '@/components/provider/category-provider'

function DataTable() {
  
  const { getCategoryFromId } = useCategory()

  const { data: entries, isLoading, error,} = useQuery({
    queryKey: ['entries'],
    queryFn: async () => {
      const response = await apiClient.entries.entryControllerList({
        take: 6,
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

  const cellStyle = {
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 4,
    paddingRight: 0,
  }

  return (
    <Card className="gap-2 mx-2 p-1.5">
      <CardTitle className="flex items-center gap-1 font-medium">
        <ArrowRightLeft className="w-4 h-4 shrink-0" />
        Letzte Transaktionen
      </CardTitle>
      <CardContent className="p-0">
        <Table className="gap-2">
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold" style={cellStyle}>
                Beschreibung
              </TableHead>
              <TableHead className="font-semibold" style={{ paddingLeft: 22 }}>
                Typ
              </TableHead>
              <TableHead className="font-semibold" style={cellStyle}>
                Kategorie
              </TableHead>
              <TableHead className="font-semibold text-right" style={cellStyle}>
                Betrag
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries?.map((entry: ApiEntryResponseDto) => {
              const category = entry.category ? getCategoryFromId(entry.category) : undefined;
              const IconComponent = category?.icon ? IconMap[category.icon as keyof typeof IconMap] : undefined;
              console.log({ entry, category, icon: category?.icon, IconComponent });
              return (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium" style={cellStyle}>
                    {entry.description || '---'}
                  </TableCell>
                  <TableCell style={cellStyle}>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        entry.type === ApiTransactionType.INCOME
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
                      }`}
                    >
                      {entry.type === ApiTransactionType.INCOME ? 'Einnahme' : 'Ausgabe'}
                    </span>
                  </TableCell>
                  <TableCell style={cellStyle}>
                    {IconComponent && <IconComponent className="w-5 h-5 mr-2" />}
                  </TableCell>
                  <TableCell className="font-mono text-right" style={cellStyle}>
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
              )
            })}
            {(!entries || entries.length === 0) && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground text-center">
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
