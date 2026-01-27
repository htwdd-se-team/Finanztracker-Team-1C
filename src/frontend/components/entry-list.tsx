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
import {
  Calendar,
  CalendarClock,
  Edit,
  Trash2,
  RefreshCcw,
  SquareSlash,
} from 'lucide-react'
import { getCategoryColorClasses } from '@/lib/color-map'
import { cn } from '@/lib/utils'
import { useCategory } from './provider/category-provider'
import { IconRender } from '@/lib/icon-map'
import { TransactionDialog } from './TransactionDialog'
import { DataImportDialog } from './data-import-dialog'
import { ApiEntryResponseDto } from 'api-client'
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
  const isRecurringView = pathname === '/scheduled-entries'

  if (entries.length === 0) {
    return (
      <li className="py-8 text-muted-foreground text-center">
        <div className="space-y-4">
          <div>Keine Einträge gefunden</div>
          {!isRecurringView && (
            <div>
              <DataImportDialog>
                <Button>Bankdaten importieren</Button>
              </DataImportDialog>
            </div>
          )}
        </div>
      </li>
    )
  }

  if (isRecurringView) {
    entries = [...entries].sort((a, b) => {
      // Einkommen vor Ausgaben
      if (a.type !== b.type) {
        return a.type === 'INCOME' ? -1 : 1
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
            className="bg-card/90 dark:bg-card/60 shadow-sm p-0 border rounded-xl"
          >
            <CardContent className="flex flex-col gap-1 p-2">
              {/* Zeile 1: Titel + Betrag */}
              <div className="flex justify-between items-center gap-1.5">
                {/* Icon */}
                {entry.categoryId ? (
                  <div
                    className={cn(
                      'inline-flex flex-shrink-0 justify-center items-center rounded-lg w-6 h-6',
                      getCategoryColorClasses(
                        getCategoryFromId(Number(entry.categoryId)).color
                      )
                    )}
                  >
                    <IconRender
                      iconName={
                        getCategoryFromId(Number(entry.categoryId)).icon
                      }
                      className="w-4 h-4"
                    />
                  </div>
                ) : (
                  <div className="inline-flex flex-shrink-0 justify-center items-center rounded-lg w-6 h-6 text-muted-foreground">
                    <SquareSlash
                      className="w-5 h-5"
                      style={{ strokeDasharray: '1.5 2.5' }}
                    />
                  </div>
                )}

                {/* Titel */}
                <span className="flex-1 min-w-0 font-semibold text-base truncate">
                  {entry.description}
                </span>

                {/* Betrag */}
                <span className="flex-shrink-0 font-mono font-bold text-lg">
                  {isIncome ? '+' : '-'}
                  {(entry.amount / 100).toFixed(2)} {entry.currency}
                </span>
              </div>

              {/* Zeile 2: Details + Actions */}
              <div className="flex justify-between items-center">
                <div className="flex items-center ml-1 text-muted-foreground text-xs">
                  <div className="flex items-center gap-2">
                    {entry.transactionId != null || entry.isRecurring ? (
                      <CalendarClock className="flex-shrink-0 w-4 h-4" />
                    ) : (
                      <Calendar className="flex-shrink-0 w-4 h-4" />
                    )}
                    <span className="leading-none">
                      {new Date(entry.createdAt).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {isRecurringView && (
                    <div className="flex items-center gap-2 ml-6">
                      <RefreshCcw className="flex-shrink-0 w-4 h-4" />
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
                      <Edit />
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
                        <Trash2 />
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
