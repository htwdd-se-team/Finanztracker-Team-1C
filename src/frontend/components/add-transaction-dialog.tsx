'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { CategorySelect } from '@/components/category-select'
import { Plus, TrendingDown, TrendingUp, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { FormattedCurrencyInput } from './ui/formatted-currency-input'
import { useCategory } from '@/components/provider/category-provider'
import {
  ApiCreateEntryDto,
  ApiCurrency,
  ApiTransactionType,
} from '@/__generated__/api'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/api-client'
import { toast } from 'sonner'

const createEntrySchema = z.object({
  type: z.nativeEnum(ApiTransactionType),
  amount: z.number().min(0.01, 'Betrag muss größer als 0 sein'),
  description: z.string().optional(),
  categoryId: z.number().optional(),
  currency: z.nativeEnum(ApiCurrency),
  createdAt: z.string().optional(),
}) satisfies z.ZodType<ApiCreateEntryDto>

// Transaction Type Selector Component
function TransactionTypeSelector({
  value,
  onValueChange,
}: {
  value: ApiTransactionType
  onValueChange: (type: ApiTransactionType) => void
}) {
  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant={
          value === ApiTransactionType.EXPENSE ? 'destructive' : 'outline'
        }
        className="flex-1"
        onClick={() => onValueChange(ApiTransactionType.EXPENSE)}
      >
        <TrendingDown className="mr-2 w-4 h-4" />
        Ausgabe
      </Button>
      <Button
        type="button"
        variant={value === ApiTransactionType.INCOME ? 'default' : 'outline'}
        className="flex-1"
        onClick={() => onValueChange(ApiTransactionType.INCOME)}
      >
        <TrendingUp className="mr-2 w-4 h-4" />
        Einnahme
      </Button>
    </div>
  )
}

export function AddTransactionDialog({
  children,
}: {
  children: React.ReactNode
}) {
  const { categories, getCategoryFromId } = useCategory()
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<z.infer<typeof createEntrySchema>>({
    resolver: zodResolver(createEntrySchema),
    defaultValues: {
      type: ApiTransactionType.EXPENSE,
      amount: 0,
      description: '',
      categoryId: undefined,
      currency: ApiCurrency.EUR,
      createdAt: new Date().toISOString().split('T')[0], // Today's date
    },
  })

  const { mutate, isPending } = useMutation({
    mutationKey: ['entries', 'create'],
    mutationFn: async (values: z.infer<typeof createEntrySchema>) => {
      // Convert amount to cents for API
      const apiValues = {
        ...values,
        amount: Math.round(values.amount * 100),
      }
      return (await apiClient.entries.entryControllerCreate(apiValues)).data
    },
    onSuccess: () => {
      toast.success('Transaktion erfolgreich erstellt')
      queryClient.invalidateQueries({ queryKey: ['entries'] })
      form.reset()
      setOpen(false)
    },
    onError: () => {
      toast.error('Fehler beim Erstellen der Transaktion')
    },
  })

  function onSubmit(values: z.infer<typeof createEntrySchema>) {
    mutate(values)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isPending) {
      form.reset()
    }
    setOpen(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Transaktion hinzufügen
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Transaction Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Typ</FormLabel>
                  <FormControl>
                    <TransactionTypeSelector
                      value={field.value}
                      onValueChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Beschreibung{' '}
                    <span className="text-muted-foreground">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="z. B. REWE Einkauf, Gehalt..."
                      disabled={isPending}
                      autoComplete="off"
                      spellCheck={false}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Betrag <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="top-1/2 left-3 absolute text-muted-foreground text-sm -translate-y-1/2 transform">
                        €
                      </span>
                      <FormattedCurrencyInput
                        placeholder="0,00"
                        className="pl-7"
                        disabled={isPending}
                        autoComplete="off"
                        spellCheck={false}
                        autoCorrect="off"
                        autoCapitalize="off"
                        value={field.value?.toString() || ''}
                        onChange={e =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                        name="amount"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category and Date Row */}
            <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
              {/* Category */}
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Kategorie{' '}
                      <span className="text-muted-foreground">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <CategorySelect
                        value={field.value?.toString() || ''}
                        onChange={val =>
                          field.onChange(val ? parseInt(val) : undefined)
                        }
                        placeholder="Kategorie auswählen"
                        categories={categories}
                        getCategoryFromId={getCategoryFromId}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date */}
              <FormField
                control={form.control}
                name="createdAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Datum{' '}
                      <span className="text-muted-foreground">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="date" disabled={isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                <Plus className="mr-2 w-4 h-4" />
                Hinzufügen
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
