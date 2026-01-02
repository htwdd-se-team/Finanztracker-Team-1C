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
import { TrendingUp, TrendingDown, Calendar, CalendarClock, Edit, Trash2 } from 'lucide-react'
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
  const isCompactView = pathname === "/scheduled-entries"

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

  let list = entries
  if (isCompactView) {
    list = [...entries].sort((a, b) => {
      // Einkommen vor Ausgaben
      if (a.type !== b.type) {
        return a.type === "INCOME" ? -1 : 1
      }
      return b.amount - a.amount
    })
  }

  return (
    <>
      {isCompactView ? (
        // --------------------------------------------------------
        // ---- Compact mode for parent-recurring-transactions ----
        // --------------------------------------------------------
        list.map(entry => {
          if (!entry.isRecurring) return null
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
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarClock className="w-4 h-4 ml-1 flex-shrink-0" />
                    <span>
                      {new Date(entry.createdAt).toLocaleDateString('de-DE')}
                    </span>
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
        })
      ) : (
        // -------------------------------------------------
        // ----- Detailed view for normal transactions -----
        // -------------------------------------------------
        entries.map(entry => {
          const isIncome = entry.type === 'INCOME'
          return (
            <li
              key={entry.id}
              className="relative flex flex-col bg-card/90 dark:bg-card/60 shadow-sm border rounded-xl h-30 overflow-hidden"
            >
            {/* Farbiger Streifen links */}
            <span
              className={cn(
                'top-2 bottom-2 left-0 absolute rounded-full w-1.5',
                entry.categoryId &&
                  getCategoryColorClasses(
                    getCategoryFromId(Number(entry.categoryId)).color
                  )
              )}
              aria-hidden="true"
            />
            {/* Top Row: Icon + Description (grows) */}
            <div className="flex items-center gap-2 px-4 py-0 min-w-0 h-[40%]">
              <span
                className={`inline-flex items-center justify-center rounded-full h-8 w-8 text-base flex-shrink-0 ${
                  isIncome
                    ? 'bg-green-100 text-green-600'
                    : 'bg-red-100 text-red-600'
                }`}
              >
                {isIncome ? <TrendingUp /> : <TrendingDown />}
              </span>
              <span className="flex-1 font-semibold text-lg truncate">
                {entry.description || '-'}
              </span>
            </div>

            {/* Bottom Row: Details (grow left) + Price & Actions (right, no grow) */}
            <div className="flex items-center gap-2 m-0 p-0 min-w-0 h-[60%]">
              {/* Left Details: Date & Category (grows) */}
              <div className="flex flex-col flex-1 justify-center gap-0 pl-4 min-w-0 text-muted-foreground text-sm">
                <div className="flex items-center gap-1 mb-2">
                  {entry.transactionId != null ? <CalendarClock className="flex-shrink-0 mr-1 w-4 h-4" /> : <Calendar className="flex-shrink-0 mr-1 w-4 h-4" />}
                  <span>
                    {new Date(entry.createdAt).toLocaleDateString('de-DE')}
                  </span>
                </div>
                {entry.categoryId && (
                  <div
                    className={cn(
                      'inline-flex items-center gap-0 rounded-full w-fit font-medium',
                      getCategoryColorClasses(
                        getCategoryFromId(Number(entry.categoryId)).color
                      )
                    )}
                  >
                    <IconRender
                      iconName={
                        getCategoryFromId(Number(entry.categoryId)).icon
                      }
                      className="flex-shrink-0 mr-2 w-5 h-5"
                    />
                    <span className="truncate">
                      {getCategoryFromId(Number(entry.categoryId)).name}
                    </span>
                  </div>
                )}
              </div>

              {/* Right Side: Amount + Action Buttons (no grow, align right) */}
              <div className="flex flex-col flex-shrink-0 justify-center items-end gap-0 pr-2">
                <span className="font-mono font-bold text-xl md:text-2xl">
                  {isIncome ? '+' : '-'}
                  {(entry.amount / 100).toFixed(2)} {entry.currency}
                </span>
                <div className="flex gap-0">
                  <TransactionDialog editData={entry}>
                    <Button
                      variant="ghost"
                      className="flex-shrink-0 p-0 w-8 h-8 cursor-pointer"
                    >
                      <Edit className="stroke-[2] !w-5 !h-5" />
                    </Button>
                  </TransactionDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex-shrink-0 p-0 w-8 h-8 text-destructive/90 cursor-pointer"
                        disabled={isDeleting && deletingEntryId === entry.id}
                        onClick={() => setDeletingEntryId(entry.id)}
                      >
                        <Trash2
                          className="stroke-[2] !w-5 !h-5 text-destructive/90"
                        />
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
                          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                          Löschen
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </li>
        )
        })
      )}
    </>
  )
}
