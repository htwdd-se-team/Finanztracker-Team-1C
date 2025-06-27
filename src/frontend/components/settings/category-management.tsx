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
import { Badge } from '@/components/ui/badge'
import { IconRender } from '@/lib/icon-map'
import { categoryColorMap } from '@/lib/color-map'
import { useCategory, Category } from '@/components/provider/category-provider'
import { AddCategoryDialog } from '@/components/create-category-dialog'
import { useState } from 'react'

import { Edit, Trash2, Plus, Folder } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/api/api-client'
import { toast } from 'sonner'

// Helper function to convert hex to rgba
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

interface CategoryCardProps {
  category: Category
  onEdit: (category: Category) => void
  onDelete: (categoryId: number) => void
  isDeleting: boolean
}

function CategoryCard({
  category,
  onEdit,
  onDelete,
  isDeleting,
}: CategoryCardProps) {
  const colorConfig = categoryColorMap[category.color]

  return (
    <Card className="group relative shadow-sm hover:shadow-md border-0 overflow-hidden transition-all duration-300">
      {/* Gradient background */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: `linear-gradient(135deg, ${hexToRgba(colorConfig.hex, 0.1)} 0%, ${hexToRgba(colorConfig.hex, 0.05)} 50%, ${hexToRgba(colorConfig.hex, 0.15)} 100%)`,
          opacity: 1,
        }}
      />
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(135deg, ${hexToRgba(colorConfig.hex, 0.2)} 0%, ${hexToRgba(colorConfig.hex, 0.1)} 50%, ${hexToRgba(colorConfig.hex, 0.25)} 100%)`,
        }}
      />

      {/* Card content */}
      <CardContent className="relative m-0 mx-4 p-0">
        <div className="flex justify-between items-center">
          <div className="flex flex-1 items-center gap-2.5 min-w-0">
            {/* Icon with colored background */}
            <div
              className="flex flex-shrink-0 justify-center items-center shadow-sm rounded-lg w-8 h-8"
              style={{
                backgroundColor: hexToRgba(colorConfig.hex, 0.15),
                border: `1px solid ${hexToRgba(colorConfig.hex, 0.3)}`,
                color: colorConfig.hex,
              }}
            >
              <IconRender iconName={category.icon} className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm truncate">
                {category.name}
              </h3>
              {category.usageCount !== undefined && (
                <Badge
                  variant="secondary"
                  className="mt-0.5 px-1.5 py-0.5 h-auto text-xs"
                  style={{
                    backgroundColor: hexToRgba(colorConfig.hex, 0.1),
                    color: colorConfig.hex,
                    borderColor: hexToRgba(colorConfig.hex, 0.2),
                  }}
                >
                  {category.usageCount}{' '}
                  {category.usageCount === 1 ? 'Verwendung' : 'Verwendungen'}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(category)}
              className="hover:bg-white/80 dark:hover:bg-black/20 p-0 w-7 h-7"
            >
              <Edit className="w-3.5 h-3.5" />
              <span className="sr-only">Kategorie bearbeiten</span>
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-destructive/10 p-0 w-7 h-7 text-destructive hover:text-destructive"
                  disabled={isDeleting}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="sr-only">Kategorie löschen</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Kategorie löschen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Möchten Sie die Kategorie &quot;{category.name}&quot;
                    wirklich löschen? Diese Aktion kann nicht rückgängig gemacht
                    werden.
                    {category.usageCount && category.usageCount > 0 ? (
                      <span className="block mt-2 font-medium text-amber-600">
                        Achtung: Diese Kategorie wird in {category.usageCount}{' '}
                        Transaktion
                        {category.usageCount === 1 ? '' : 'en'} verwendet.
                      </span>
                    ) : null}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(category.id)}
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

export function CategoryManagement() {
  const { categories, removeCategory } = useCategory()
  const [editingCategoryId, setEditingCategoryId] = useState<
    number | undefined
  >()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const { mutate: deleteCategory, isPending: isDeleting } = useMutation({
    mutationKey: ['categories', 'delete'],
    mutationFn: async (categoryId: number) => {
      await apiClient.categories.categoryControllerDelete(categoryId)
      return categoryId
    },
    onSuccess: categoryId => {
      removeCategory(categoryId)
      toast.success('Kategorie erfolgreich gelöscht')
    },
    onError: () => {
      toast.error('Fehler beim Löschen der Kategorie')
    },
  })

  const handleEdit = (category: Category) => {
    setEditingCategoryId(category.id)
  }

  const handleDelete = (categoryId: number) => {
    deleteCategory(categoryId)
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <div className="flex justify-center items-center bg-primary/10 rounded-lg w-8 h-8">
              <Folder className="w-5 h-5 text-primary" />
            </div>
            Kategorien verwalten
          </CardTitle>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            size="sm"
            className="gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Neue Kategorie
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {categories.length === 0 ? (
          <div className="py-12 text-center">
            <div className="relative mb-6">
              <div className="flex justify-center items-center bg-gradient-to-br from-muted to-muted/50 mx-auto rounded-full w-16 h-16">
                <Folder className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 mx-auto rounded-full w-16 h-16 animate-pulse" />
            </div>
            <h3 className="mb-2 font-semibold text-lg">
              Noch keine Kategorien
            </h3>
            <p className="mx-auto mb-6 max-w-sm text-muted-foreground">
              Erstellen Sie Ihre erste Kategorie, um Ihre Transaktionen besser
              zu organisieren.
            </p>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              variant="outline"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Erste Kategorie erstellen
            </Button>
          </div>
        ) : (
          <div className="gap-3 grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {categories.map(category => (
              <CategoryCard
                key={category.id}
                category={category}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isDeleting={isDeleting}
              />
            ))}
          </div>
        )}
      </CardContent>

      {/* Single dialog for both create and edit */}
      <AddCategoryDialog
        open={createDialogOpen || editingCategoryId !== undefined}
        onOpenChange={open => {
          if (!open) {
            setCreateDialogOpen(false)
            setEditingCategoryId(undefined)
          }
        }}
        editId={editingCategoryId}
        onCreated={() => {
          setCreateDialogOpen(false)
        }}
        onUpdated={() => {
          setEditingCategoryId(undefined)
        }}
      />
    </Card>
  )
}
