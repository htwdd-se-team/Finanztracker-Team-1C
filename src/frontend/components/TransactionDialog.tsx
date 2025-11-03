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
import {
  Plus,
  TrendingDown,
  TrendingUp,
  Loader2,
  Edit,
  CalendarIcon,
  AlertTriangle,
} from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar-rac'
import { parseDate } from '@internationalized/date'
import { useState, useEffect } from 'react'
import { FormattedCurrencyInput } from './ui/formatted-currency-input'
import { useCategory } from '@/components/provider/category-provider'
import {
  ApiCurrency,
  ApiTransactionType,
  ApiEntryResponseDto,
  ApiCreateEntryDto,
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

export function TransactionDialog({
  children,
  editData,
}: {
  children: React.ReactNode
  editData?: ApiEntryResponseDto
}) {
  const { categories, getCategoryFromId } = useCategory()
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const [calendarOpen, setCalendarOpen] = useState(false)

  const form = useForm<z.infer<typeof createEntrySchema>>({
    resolver: zodResolver(createEntrySchema),
    defaultValues: editData
      ? {
          type: editData.type,
          amount: editData.amount / 100,
          description: editData.description || '',
          categoryId: editData.categoryId,
          currency: editData.currency,
          createdAt: editData.createdAt?.split('T')[0],
        }
      : {
          type: ApiTransactionType.EXPENSE,
          amount: 0,
          description: '',
          categoryId: undefined,
          currency: ApiCurrency.EUR,
          createdAt: new Date().toISOString().split('T')[0],
        },
  })

  useEffect(() => {
    if (open) {
      if (editData) {
        form.reset({
          type: editData.type,
          amount: editData.amount / 100,
          description: editData.description || '',
          categoryId: editData.categoryId,
          currency: editData.currency,
          createdAt: editData.createdAt?.split('T')[0],
        })
      } else {
        form.reset({
          type: ApiTransactionType.EXPENSE,
          amount: 0,
          description: '',
          categoryId: undefined,
          currency: ApiCurrency.EUR,
          createdAt: new Date().toISOString().split('T')[0],
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editData])

  // Mutations
  const { mutate, isPending } = useMutation({
    mutationKey: editData
      ? ['transactions', 'update', editData.id]
      : ['transactions', 'create'],
    mutationFn: async (values: z.infer<typeof createEntrySchema>) => {
      const apiValues = {
        ...values,
        amount: Math.floor(values.amount * 100),
      }
      if (editData) {
        return (
          await apiClient.entries.entryControllerUpdate(editData.id, apiValues)
        ).data
      } else {
        return (await apiClient.entries.entryControllerCreate(apiValues)).data
      }
    },
    onSuccess: () => {
      toast.success(
        editData
          ? 'Transaktion erfolgreich aktualisiert'
          : 'Transaktion erfolgreich erstellt'
      )
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      form.reset()
      setOpen(false)
    },
    onError: () => {
      toast.error(
        editData
          ? 'Fehler beim Aktualisieren der Transaktion'
          : 'Fehler beim Erstellen der Transaktion'
      )
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
            {editData ? (
              <Edit className="w-5 h-5 text-primary" />
            ) : (
              <Plus className="w-5 h-5 text-primary" />
            )}
            {editData ? 'Transaktion bearbeiten' : 'Transaktion hinzufügen'}
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
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={
                          field.value === ApiTransactionType.EXPENSE
                            ? 'destructive'
                            : 'outline'
                        }
                        className="flex-1 cursor-pointer"
                        onClick={() =>
                          field.onChange(ApiTransactionType.EXPENSE)
                        }
                      >
                        <TrendingDown className="mr-2 w-4 h-4" />
                        Ausgabe
                      </Button>
                      <Button
                        type="button"
                        variant={
                          field.value === ApiTransactionType.INCOME
                            ? 'default'
                            : 'outline'
                        }
                        className="flex-1 cursor-pointer"
                        onClick={() =>
                          field.onChange(ApiTransactionType.INCOME)
                        }
                      >
                        <TrendingUp className="mr-2 w-4 h-4" />
                        Einnahme
                      </Button>
                    </div>
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
                render={({ field }) => {
                  const isFutureDate = field.value && new Date(field.value) > new Date()

                  return (
                    <FormItem className = "mb-0">
                      <FormLabel>
                        Datum{' '}
                        <span className="text-muted-foreground">(optional)</span>
                      </FormLabel>
                      <FormControl>
                        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                          <PopoverTrigger className = "mb-0" asChild>
                            <Button
                              variant="outline"
                              className={`w-full justify-start text-left font-normal ${
                                !field.value && 'text-muted-foreground'
                              }`}
                              disabled={isPending}
                              type="button"
                            >
                              <CalendarIcon className="mr-2 w-4 h-4" />
                              {field.value ? (
                                new Date(field.value).toLocaleDateString('de-DE')
                              ) : (
                                <span>Datum auswählen</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="p-0 w-auto" align="start">
                            <Calendar
                              value={
                                field.value ? parseDate(field.value) : undefined
                              }
                              onChange={date => {
                                field.onChange(date ? date.toString() : '')
                                setCalendarOpen(false)
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      {isFutureDate && (
                        <p className="flex items-center text-sm text-gray-600 -mt-1.5 whitespace-nowrap">
                          <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 mr-1 flex-shrink-0" />
                          Dieses Datum liegt in der Zukunft
                        </p>
                      )}
                      <FormMessage />
                  </FormItem>
                  )
                }}
              />
            </div>
            <DialogFooter>
              <Button
                className="cursor-pointer"
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                Abbrechen
              </Button>
              <Button
                className="cursor-pointer"
                type="submit"
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                {editData ? (
                  <Edit className="mr-2 w-4 h-4" />
                ) : (
                  <Plus className="mr-2 w-4 h-4" />
                )}
                {editData ? 'Aktualisieren' : 'Hinzufügen'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
