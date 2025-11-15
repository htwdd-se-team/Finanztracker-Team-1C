'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { IconRender } from '@/lib/icon-map'
import { useState } from 'react'
import { Edit, Trash2, Plus, Filter as FilterIcon } from 'lucide-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/api-client'
import { toast } from 'sonner'
import FilterDialog from '@/components/filter-dialog'
import { ApiFilterResponseDto } from '@/__generated__/api'

interface FilterCardProps {
  filter: ApiFilterResponseDto
  onEdit: (filter: ApiFilterResponseDto) => void
  onDelete: (filterId: number) => void
  isDeleting: boolean
}

function FilterCard({ filter, onEdit, onDelete, isDeleting }: FilterCardProps) {
  return (
    <Card className="group relative shadow-sm hover:shadow-md border-0 overflow-hidden transition-all duration-50 bg-primary/10 hover:bg-primary/20">
      <CardContent className="relative m-0 mx-4 p-4">
        <div className="flex justify-between items-center">
          <div className="flex flex-1 items-center gap-2.5 min-w-0">
            {/* Icon */}
            <div className="flex flex-shrink-0 justify-center items-center bg-primary/10 rounded-lg w-8 h-8 text-primary">
              {filter.icon ? (
                <IconRender iconName={filter.icon} className="w-4 h-4" />
              ) : (
                <FilterIcon className="w-4 h-4" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm truncate">
                {filter.title}
              </h3>
              <p className="text-muted-foreground text-xs truncate">
                {filter.searchText || 'Kein Text-Filter'}
              </p>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(filter)}
              className="cursor-pointer hover:bg-white/80 dark:hover:bg-black/20 p-0 w-7 h-7"
            >
              <Edit className="w-3.5 h-3.5" />
              <span className="sr-only">Filter bearbeiten</span>
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="cursor-pointer hover:bg-destructive/10 dark:hover:bg-destructive/20 p-0 w-7 h-7 text-destructive hover:text-destructive transition-colors"
                  disabled={isDeleting}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="sr-only">Filter löschen</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Filter löschen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Möchten Sie den Filter &quot;{filter.title}&quot; wirklich
                    löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(filter.id)}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
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
}

export function FilterManagement() {
  const [editingFilterId, setEditingFilterId] = useState<number | undefined>()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedFilter, setSelectedFilter] =
    useState<ApiFilterResponseDto | null>(null)

  const { data: filters, isLoading } = useQuery({
    queryKey: ['filters'],
    queryFn: async () => {
      const res = await apiClient.filters.filterControllerList()
      return res.data
    },
  })

  const { mutate: deleteFilter, isPending: isDeleting } = useMutation({
    mutationKey: ['filters', 'delete'],
    mutationFn: async (filterId: number) => {
      await apiClient.filters.filterControllerDelete(filterId)
      return filterId
    },
    onSuccess: () => {
      toast.success('Filter erfolgreich gelöscht')
      // Refetch filters
      window.location.reload()
    },
    onError: () => {
      toast.error('Fehler beim Löschen des Filters')
    },
  })

  const handleEdit = (filter: ApiFilterResponseDto) => {
    setSelectedFilter(filter)
    setEditingFilterId(filter.id)
  }

  const handleDelete = (filterId: number) => {
    deleteFilter(filterId)
  }

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <div className="flex justify-center items-center w-8 h-8">
                <FilterIcon className="w-5 h-5 text-foreground" />
              </div>
              Filter verwalten
            </CardTitle>
            <Button
              onClick={() => {
                setSelectedFilter(null)
                setCreateDialogOpen(true)
              }}
              size="sm"
              className="gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Neuer Filter
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {isLoading ? (
            <div className="py-12 text-center">
              <div className="flex justify-center items-center mx-auto mb-4">
                <div className="border-primary border-b-2 rounded-full w-8 h-8 animate-spin"></div>
              </div>
              <p className="text-muted-foreground">Filter werden geladen...</p>
            </div>
          ) : filters && filters.length > 0 ? (
            <div className="gap-3 grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {filters.map(filter => (
                <FilterCard
                  key={filter.id}
                  filter={filter}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isDeleting={isDeleting}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="relative mb-6">
                <div className="flex justify-center items-center bg-gradient-to-br from-muted to-muted/50 mx-auto rounded-full w-16 h-16">
                  <FilterIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 mx-auto rounded-full w-16 h-16 animate-pulse" />
              </div>
              <h3 className="mb-2 font-semibold text-lg">Noch keine Filter</h3>
              <p className="mx-auto mb-6 max-w-sm text-muted-foreground">
                Erstellen Sie Ihre ersten Filter, um Ihre Transaktionen
                schneller zu durchsuchen.
              </p>
              <Button
                onClick={() => {
                  setSelectedFilter(null)
                  setCreateDialogOpen(true)
                }}
                variant="outline"
                className="gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Ersten Filter erstellen
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filter Dialog */}
      <FilterDialog
        open={createDialogOpen || editingFilterId !== undefined}
        onOpenChange={open => {
          if (!open) {
            setCreateDialogOpen(false)
            setEditingFilterId(undefined)
            setSelectedFilter(null)
          }
        }}
        initialFilter={selectedFilter}
        onSaveSuccess={() => {
          setCreateDialogOpen(false)
          setEditingFilterId(undefined)
          setSelectedFilter(null)
          // Refetch filters
          window.location.reload()
        }}
      />
    </>
  )
}
