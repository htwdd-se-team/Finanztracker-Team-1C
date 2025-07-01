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
import { TrendingUp, TrendingDown, Calendar, Edit, Trash2 } from 'lucide-react'
import { getCategoryColorClasses } from '@/lib/color-map'
import { cn } from '@/lib/utils'
import { useCategory } from './provider/category-provider'
import { IconRender } from '@/lib/icon-map'
import { TransactionDialog } from './TransactionDialog'
import { ApiEntryResponseDto } from '@/__generated__/api'

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
  if (entries.length === 0) {
    return (
      <li className="py-8 text-muted-foreground text-center">
        Keine Einträge gefunden
      </li>
    )
  }

  return (
    <>
      {entries.map(entry => {
        const isIncome = entry.type === 'INCOME'

        return (
          <li
            key={entry.id}
            className="relative flex justify-between items-center bg-card/50 dark:bg-card/50 shadow-sm px-4 py-3 border rounded-xl"
          >
            <span
              className={cn(
                'absolute left-0 top-2 bottom-2 w-1.5 rounded-full',
                entry.categoryId &&
                  getCategoryColorClasses(
                    getCategoryFromId(Number(entry.categoryId)).color
                  )
              )}
              style={{ opacity: 1 }}
              aria-hidden="true"
            />
            <div className="flex flex-col flex-1 justify-center ml-3 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center justify-center rounded-full h-8 w-8 text-base sm:h-10 sm:w-10 sm:text-lg ${
                    isIncome
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {isIncome ? (
                    <TrendingUp className="w-5 sm:w-6 h-5 sm:h-6" />
                  ) : (
                    <TrendingDown className="w-5 sm:w-6 h-5 sm:h-6" />
                  )}
                </span>
                <span className="font-semibold text-base sm:text-lg truncate">
                  {entry.description || '-'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs sm:text-sm">
                <span className="inline-flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full font-medium text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(entry.createdAt).toLocaleDateString('de-DE')}
                </span>
                {entry.categoryId && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium',
                      getCategoryColorClasses(
                        getCategoryFromId(Number(entry.categoryId)).color
                      )
                    )}
                    style={{ opacity: 1 }}
                  >
                    <span className="flex justify-center items-center w-4 h-4">
                      <IconRender
                        iconName={
                          getCategoryFromId(Number(entry.categoryId)).icon
                        }
                        className="w-4 h-4 text-inherit"
                      />
                    </span>
                    {getCategoryFromId(Number(entry.categoryId)).name}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col justify-center items-center mx-4 min-w-[90px] sm:min-w-[120px]">
              <span className={`font-mono font-bold text-base sm:text-lg `}>
                {isIncome ? '+' : '-'}
                {(entry.amount / 100).toFixed(2)} {entry.currency}
              </span>
            </div>
            <div className="flex flex-col justify-center items-end">
              <div className="flex gap-1 sm:gap-2">
                <TransactionDialog editData={entry}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 w-7 sm:w-8 h-7 sm:h-8 cursor-pointer"
                  >
                    <Edit className="w-4 sm:w-5 h-4 sm:h-5" />
                    <span className="sr-only">Eintrag bearbeiten</span>
                  </Button>
                </TransactionDialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 w-7 sm:w-8 h-7 sm:h-8 text-destructive cursor-pointer"
                      disabled={isDeleting && deletingEntryId === entry.id}
                      onClick={() => setDeletingEntryId(entry.id)}
                    >
                      <Trash2 className="w-4 sm:w-5 h-4 sm:h-5" />
                      <span className="sr-only">Eintrag löschen</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="sm:max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Eintrag löschen?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Möchten Sie den Eintrag wirklich löschen? Diese Aktion
                        kann nicht rückgängig gemacht werden.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="cursor-pointer">
                        Abbrechen
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(entry.id)}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground cursor-pointer"
                      >
                        Löschen
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </li>
        )
      })}
    </>
  )
}
