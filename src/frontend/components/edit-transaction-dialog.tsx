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
import { Plus, TrendingDown, TrendingUp, Loader2, Pencil } from 'lucide-react'
import { useState, useEffect } from 'react'
import { FormattedCurrencyInput } from './ui/formatted-currency-input'
import { useCategory } from '@/components/provider/category-provider'
import {
  ApiEntryDto,
  ApiUpdateEntryDto,
  ApiCurrency,
  ApiTransactionType,
} from '@/__generated__/api'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/api-client'
import { toast } from 'sonner'

const updateEntrySchema = z.object({
  id: z.number(),
  type: z.nativeEnum(ApiTransactionType),
  amount: z.number().min(0.01, 'Betrag muss größer als 0 sein'),
  description: z.string().optional(),
  categoryId: z.number().optional(),
  currency: z.nativeEnum(ApiCurrency),
  createdAt: z.string().optional(),
}) satisfies z.ZodType<ApiUpdateEntryDto & { id: number }>

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
        className="flex-1 cursor-pointer"
        onClick={() => onValueChange(ApiTransactionType.EXPENSE)}
      >
        <TrendingDown className="mr-2 w-4 h-4" />
        Ausgabe
      </Button>
      <Button
        type="button"
        variant={value === ApiTransactionType.INCOME ? 'default' : 'outline'}
        className="flex-1 cursor-pointer"
        onClick={() => onValueChange(ApiTransactionType.INCOME)}
      >
        <TrendingUp className="mr-2 w-4 h-4" />
        Einnahme
      </Button>
    </div>
  )
}

export function EditTransactionDialog({
  transaction,
  children,
}: {
  transaction: ApiEntryDto
  children: React.ReactNode
}) {
  const { categories, getCategoryFromId } = useCategory()
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<z.infer<typeof updateEntrySchema>>({
    resolver: zodResolver(updateEntrySchema),
    defaultValues: {
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount / 100, // convert cents to euro
      description: transaction.description || '',
      categoryId: transaction.categoryId,
      currency: transaction.currency,
      createdAt: transaction.createdAt?.split('T')[0],
    },
  })

  // Reset form when dialog opens with new transaction
  useEffect(() => {
    if (open) {
      form.reset({
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount / 100,
        description: transaction.description || '',
        categoryId: transaction.categoryId,
        currency: transaction.currency,
        createdAt: transaction.createdAt?.split('T')[0],
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, transaction])

  const { mutate, isPending } = useMutation({
    mutationKey: ['entries', 'update', transaction.id],
    mutationFn: async (values: z.infer<typeof updateEntrySchema>) => {
      const apiValues = {
        ...values,
        amount: Math.round(values.amount * 100),
      }
      return (
        await apiClient.entries.entryControllerUpdate(transaction.id, apiValues)
      ).data
    },
    onSuccess: () => {
      toast.success('Transaktion erfolgreich aktualisiert')
      queryClient.invalidateQueries({ queryKey: ['entries'] })
      setOpen(false)
    },
    onError: () => {
      toast.error('Fehler beim Aktualisieren der Transaktion')
    },
  })

  function onSubmit(values: z.infer<typeof updateEntrySchema>) {
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
          <DialogTitle className="flex items-center gap-2 cursor-pointer">
            <Pencil className="w-5 h-5 text-primary" />
            Transaktion bearbeiten
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
                        value={field.value === undefined ? '' : field.value}
                        onChange={field.onChange}
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
                className="cursor-pointer"
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="cursor-pointer"
              >
                {isPending && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                <Pencil className="mr-2 w-4 h-4" />
                Speichern
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// Example usage (to be placed in your transaction list/table):
// <EditTransactionDialog transaction={transaction}>
//   <Button variant="ghost" size="icon" className="cursor-pointer">
//     <Pencil className="w-4 h-4" />
//   </Button>
// </EditTransactionDialog>
