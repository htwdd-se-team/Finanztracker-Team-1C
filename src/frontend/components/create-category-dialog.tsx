'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CategoryColors, getCategoryColorClasses } from '@/lib/color-map'
import { IconNames, IconRender } from '@/lib/icon-map'
import { ColorPicker } from '@/components/ui/color-picker'
import { IconPicker } from '@/components/ui/icon-picker'
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/api/api-client'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import {
  ApiCategoryResponseDto,
  ApiCreateCategoryDto,
  ApiUpdateCategoryDto,
} from 'api-client'
import { cn } from '@/lib/utils'
import { useCategory } from '@/components/provider/category-provider'
import { useEffect } from 'react'

interface AddCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editId?: number
  onCreated?: (category: ApiCategoryResponseDto) => void
  onUpdated?: (category: ApiCategoryResponseDto) => void
}

const categorySchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(50, 'Name ist zu lang'),
  color: z.nativeEnum(CategoryColors, {
    errorMap: () => ({ message: 'Bitte wählen Sie eine Farbe aus' }),
  }),
  icon: z.nativeEnum(IconNames, {
    errorMap: () => ({ message: 'Bitte wählen Sie ein Icon aus' }),
  }),
}) satisfies z.ZodType<ApiCreateCategoryDto & ApiUpdateCategoryDto>

export function AddCategoryDialog({
  open,
  onOpenChange,
  editId,
  onCreated,
  onUpdated,
}: AddCategoryDialogProps) {
  const { addCategory, updateCategory, getCategoryFromId } = useCategory()

  const isEditing = editId !== undefined
  const categoryToEdit = isEditing ? getCategoryFromId(editId) : undefined

  const form = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      color: CategoryColors.BLUE,
      icon: IconNames.SHOPPING_CART,
    },
  })

  // Reset form when dialog opens or editId changes
  useEffect(() => {
    if (open) {
      if (isEditing && categoryToEdit && categoryToEdit.id !== -1) {
        form.reset({
          name: categoryToEdit.name,
          color: categoryToEdit.color,
          icon: categoryToEdit.icon,
        })
      } else if (!isEditing) {
        form.reset({
          name: '',
          color: CategoryColors.BLUE,
          icon: IconNames.SHOPPING_CART,
        })
      }
    }
  }, [open, isEditing, categoryToEdit, form])

  // Watch form values for live preview
  const watchedValues = form.watch()

  const { mutate, isPending } = useMutation({
    mutationKey: ['categories', isEditing ? 'update' : 'create', editId],
    mutationFn: async (values: z.infer<typeof categorySchema>) => {
      if (isEditing && editId) {
        return (
          await apiClient.categories.categoryControllerUpdate(editId, values)
        ).data
      } else {
        return (await apiClient.categories.categoryControllerCreate(values))
          .data
      }
    },
    onSuccess: data => {
      if (isEditing && editId) {
        updateCategory(editId, data)
        toast.success('Kategorie erfolgreich aktualisiert')
        requestAnimationFrame(() => {
          onUpdated?.(data)
        })
      } else {
        addCategory(data)
        toast.success('Kategorie erfolgreich erstellt')
        requestAnimationFrame(() => {
          onCreated?.(data)
        })
      }

      form.reset()
      requestAnimationFrame(() => {
        onOpenChange(false)
      })
    },
    onError: () => {
      toast.error(
        isEditing
          ? 'Fehler beim Aktualisieren der Kategorie'
          : 'Fehler beim Erstellen der Kategorie'
      )
    },
  })

  function onSubmit(values: z.infer<typeof categorySchema>) {
    mutate(values)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isPending) {
      form.reset()
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-lg"
        onEscapeKeyDown={e => {
          e.stopPropagation()
        }}
        onPointerDownOutside={e => {
          e.stopPropagation()
        }}
        onInteractOutside={e => {
          e.stopPropagation()
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Kategorie bearbeiten' : 'Neue Kategorie erstellen'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={e => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit(onSubmit)(e)
            }}
            className="space-y-4"
          >
            <CategoryPreview
              name={watchedValues.name}
              color={watchedValues.color}
              icon={watchedValues.icon}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Name<span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="z. B. Lebensmittel"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Farbe<span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <ColorPicker
                      value={field.value}
                      onValueChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Icon<span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <IconPicker
                      value={field.value}
                      onValueChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                onClick={e => {
                  e.stopPropagation()
                }}
              >
                {isPending && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                {isEditing ? 'Speichern' : 'Erstellen'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function CategoryPreview({
  name,
  color,
  icon,
}: {
  name: string
  color: CategoryColors
  icon: IconNames
}) {
  return (
    <div className="flex flex-col items-center space-y-2 bg-muted/50 p-4 border-2 border-muted-foreground/20 border-dashed rounded-lg">
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 border rounded-md font-medium text-sm transition-colors',
          getCategoryColorClasses(color)
        )}
      >
        <IconRender iconName={icon} className="w-4 h-4" />
        {name && name.length > 0 ? (
          <span>{name}</span>
        ) : (
          <span className="text-muted-foreground">Kategorie Name</span>
        )}
      </div>
    </div>
  )
}
