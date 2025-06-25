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
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/api-client'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { ApiCreateCategoryDto } from '@/__generated__/api'
import { cn } from '@/lib/utils'
import { Category } from './provider/category-provider'

interface AddCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCategoryCreated?: (category: Category) => void
}

const createCategorySchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(50, 'Name ist zu lang'),
  color: z.nativeEnum(CategoryColors, {
    errorMap: () => ({ message: 'Bitte wählen Sie eine Farbe aus' }),
  }),
  icon: z.nativeEnum(IconNames, {
    errorMap: () => ({ message: 'Bitte wählen Sie ein Icon aus' }),
  }),
}) satisfies z.ZodType<ApiCreateCategoryDto>

// Live Preview Component
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
          'flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium transition-colors',
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

export function AddCategoryDialog({
  open,
  onOpenChange,
  onCategoryCreated,
}: AddCategoryDialogProps) {
  const queryClient = useQueryClient()

  const form = useForm<z.infer<typeof createCategorySchema>>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: '',
      color: CategoryColors.BLUE,
      icon: IconNames.SHOPPING_CART,
    },
  })

  // Watch form values for live preview
  const watchedValues = form.watch()

  const { mutate, isPending } = useMutation({
    mutationKey: ['categories', 'create'],
    mutationFn: async (values: z.infer<typeof createCategorySchema>) =>
      (await apiClient.categories.categoryControllerCreate(values)).data,
    onSuccess: newCategory => {
      toast.success('Kategorie erfolgreich erstellt')
      queryClient.invalidateQueries({ queryKey: ['categories'] })

      form.reset()
      onOpenChange(false)

      // Inform parent component
      if (onCategoryCreated) {
        onCategoryCreated({
          ...newCategory,
          icon: IconNames[newCategory.icon as keyof typeof IconNames],
          color: CategoryColors[newCategory.color as keyof typeof CategoryColors],
        })
      }
    },
    onError: () => {
      toast.error('Fehler beim Erstellen der Kategorie')
    },
  })

  function onSubmit(values: z.infer<typeof createCategorySchema>) {
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Neue Kategorie erstellen</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                Erstellen
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
