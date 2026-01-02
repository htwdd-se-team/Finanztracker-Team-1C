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
import { Calendar, CalendarClock, Edit, Trash2, RefreshCcw } from 'lucide-react'
import { getCategoryColorClasses } from '@/lib/color-map'
import { cn } from '@/lib/utils'
import { useCategory } from './provider/category-provider'
import { IconRender } from '@/lib/icon-map'
import { TransactionDialog } from './TransactionDialog'
import { DataImportDialog } from './data-import-dialog'
import { ApiEntryResponseDto } from '@/__generated__/api'
import { Card, CardContent } from '@/components/ui/card'
import { usePathname } from 'next/navigation'

interface EntryListProps {
  entries: ApiEntryResponseDto[]
  isDeleting: boolean
  deletingEntryId: number | undefined
  setDeletingEntryId: (id: number | undefined) => void
  handleDelete: (id: number) => void
}

export function EntryList({
  entries,
  isDeleting,
  deletingEntryId,
  setDeletingEntryId,
  handleDelete,
}: EntryListProps) {
  const { getCategoryFromId } = useCategory()
  const pathname = usePathname()
  const isRecurringView = pathname === "/scheduled-entries"

  if (entries.length === 0) {
    return (
      <li className="py-8 text-muted-foreground text-center">
        <div className="space-y-4">
          <div>Keine Einträge gefunden</div>
          <div>
            <DataImportDialog>
              <Button>Bankdaten importieren</Button>
            </DataImportDialog>
          </div>
        </div>
      </li>
    )
  }

  if (isRecurringView) {
    entries = [...entries].sort((a, b) => {
      // Einkommen vor Ausgaben
      if (a.type !== b.type) {
        return a.type === "INCOME" ? -1 : 1
      }
      return b.amount - a.amount
    })
  }

  const visibleEntries = isRecurringView
    ? entries.filter(e => e.isRecurring)
    : entries

  return (
    <>
      {visibleEntries.map(entry => {
        const isIncome = entry.type === 'INCOME'

        return (
          <Card
            key={entry.id}
            className="p-0 bg-card/90 dark:bg-card/60 shadow-sm border rounded-xl"
          >
            <CardContent className="p-2 flex flex-col gap-1">
              {/* Zeile 1: Titel + Betrag */}
              <div className="flex items-center justify-between gap-1.5">
                {/* Icon */}
                {entry.categoryId && (
                  <div
                    className={cn(
                      'inline-flex items-center justify-center rounded-lg w-6 h-6 flex-shrink-0',
                      getCategoryColorClasses(
                        getCategoryFromId(Number(entry.categoryId)).color
                      )
                    )}
                  >
                    <IconRender
                      iconName={getCategoryFromId(Number(entry.categoryId)).icon}
                      className="w-4 h-4"
                    />
                  </div>
                )}

                {/* Titel */}
                <span className="font-semibold text-base truncate flex-1 min-w-0">
                  {entry.description}
                </span>

                {/* Betrag */}
                <span className="font-mono font-bold text-lg flex-shrink-0">
                  {isIncome ? '+' : '-'}
                  {(entry.amount / 100).toFixed(2)} {entry.currency}
                </span>
              </div>

              {/* Zeile 2: Details + Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center text-xs text-muted-foreground ml-1">
                  <div className="flex items-center gap-2">
                    {entry.transactionId != null || entry.isRecurring ? (
                      <CalendarClock className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span className="leading-none">
                      {new Date(entry.createdAt).toLocaleDateString('de-DE')}
                    </span>
                  </div>

                  {isRecurringView && (
                    <div className="flex items-center ml-6 gap-2">
                      <RefreshCcw className="w-4 h-4 flex-shrink-0" />
                      <span className="leading-none">
                        {entry.recurringBaseInterval === 1
                          ? 'jeden Monat'
                          : `jeden ${entry.recurringBaseInterval}. Monat`}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-1">
                  <TransactionDialog editData={entry}>
                    <Button variant="ghost" className="w-7 h-7">
                      <Edit/>
                    </Button>
                  </TransactionDialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-7 h-7 text-destructive/90 hover:text-destructive/80"
                        disabled={isDeleting && deletingEntryId === entry.id}
                        onClick={() => setDeletingEntryId(entry.id)}
                      >
                        <Trash2/>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Eintrag löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Diese Aktion kann nicht rückgängig gemacht werden.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(entry.id)}
                          className="bg-destructive/90 hover:bg-destructive/80 text-destructive-foreground"
                        >
                          Löschen
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </>
  )
}