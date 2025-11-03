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
            className="relative bg-card/50 dark:bg-card/50 shadow-sm border rounded-xl overflow-hidden h-30 flex flex-col"
          >
            {/* Farbiger Streifen links */}
            <span
              className={cn(
                'absolute left-0 top-2 bottom-2 w-1.5 rounded-full',
                entry.categoryId &&
                  getCategoryColorClasses(
                    getCategoryFromId(Number(entry.categoryId)).color
                  )
              )}
              aria-hidden="true"
            />

            {/* Oberer Bereich */}
            <div className="flex items-center gap-0 px-4 py-0 border-b h-[40%]">
              <span
                className={`inline-flex items-center justify-center rounded-full h-8 w-8 text-base mr-2 ${
                  isIncome ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}
              >
                {isIncome ? <TrendingUp /> : <TrendingDown />}
              </span>
              <span className="font-semibold text-lg truncate">
                {entry.description || '-'}
              </span>
            </div>

            {/* Unterer Bereich */}
            <div className="flex h-[60%] gap-0 p-0 m-0">
              {/* Linke Spalte */}
              <div className="w-[40%] flex flex-col justify-center p-0 gap-0 text-sm text-muted-foreground border-r">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 ml-4 mr-1 mb-2" />
                  <span className="mt-[-7px]">{new Date(entry.createdAt).toLocaleDateString('de-DE')}</span>
                </div>
                {entry.categoryId && (
                  <div
                    className={cn(
                      'inline-flex items-center gap-0 p-0 mx-4 rounded-full font-medium w-fit',
                      getCategoryColorClasses(
                        getCategoryFromId(Number(entry.categoryId)).color
                      )
                    )}
                  >
                    <IconRender
                      iconName={getCategoryFromId(Number(entry.categoryId)).icon}
                      className="w-4 h-4 mr-2"
                    />
                    {getCategoryFromId(Number(entry.categoryId)).name}
                  </div>
                )}
              </div>

              {/* Rechte Spalte */}
              <div className="w-[60%] flex flex-col justify-center items-end p-0 gap-0 m-0">
                <span className="font-mono font-bold text-xl gap-0 p-0 mr-4 mt-2">
                  {isIncome ? '+' : '-'}
                  {(entry.amount / 100).toFixed(2)} {entry.currency}
                </span>
                <div className="flex gap-0 p-0 mr-1">
                  <TransactionDialog editData={entry}>
                    <Button
                    variant="ghost"
                    className="cursor-pointer w-8 h-8 p-0 mb-1 mr-2"
                    >
                      <Edit className="!w-5 !h-5 stroke-[2] mr-0"
                      />
                    </Button>
                  </TransactionDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        className="text-destructive cursor-pointer w-8 h-8 p-0 mb-1 mr-1"
                        disabled={isDeleting && deletingEntryId === entry.id}
                        onClick={() => setDeletingEntryId(entry.id)}
                      >
                        <Trash2
                        className="!w-5 !h-5 stroke-[2]"
                        style={{ color: 'color-mix(in srgb, var(--destructive) 80%, white)' }}
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
      })}
    </>
  )
}
