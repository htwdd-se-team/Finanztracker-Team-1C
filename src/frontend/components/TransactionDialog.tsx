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
import { Switch } from '@/components/ui/switch'
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
  ApiUpdateEntryDto,
  ApiRecurringTransactionType,
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

  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceIntervalMonths, setRecurrenceIntervalMonths] = useState<
    number | undefined
  >(undefined)

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
        const ed = editData as unknown as Record<string, unknown>
        const recurringFlag = Boolean(ed.isRecurring)
        setIsRecurring(recurringFlag)
        const initialInterval =
          typeof ed.recurringBaseInterval === 'number'
            ? (ed.recurringBaseInterval as number)
            : typeof ed.recurrenceIntervalMonths === 'number'
              ? (ed.recurrenceIntervalMonths as number)
              : undefined
        setRecurrenceIntervalMonths(
          recurringFlag && initialInterval === undefined ? 1 : initialInterval
        )
      } else {
        form.reset({
          type: ApiTransactionType.EXPENSE,
          amount: 0,
          description: '',
          categoryId: undefined,
          currency: ApiCurrency.EUR,
          createdAt: new Date().toISOString().split('T')[0],
        })
        setIsRecurring(false)
        setRecurrenceIntervalMonths(undefined)
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
      // validate recurrence before building payload
      if (isRecurring) {
        if (
          recurrenceIntervalMonths === undefined ||
          recurrenceIntervalMonths === null ||
          recurrenceIntervalMonths < 1 ||
          !Number.isInteger(recurrenceIntervalMonths)
        ) {
          throw new Error('Ungültiges Intervall')
        }
      }

      const apiValues = {
        ...values,
        amount: Math.floor(values.amount * 100),
      }

      const payload = { ...apiValues } as unknown as Record<string, unknown>

      if (!editData) {
        payload['isRecurring'] = Boolean(isRecurring)
        if (isRecurring) {
          payload['recurringBaseInterval'] = recurrenceIntervalMonths ?? 1
          payload['recurringType'] = ApiRecurringTransactionType.MONTHLY
        }

        return (
          await apiClient.entries.entryControllerCreate(
            payload as unknown as ApiCreateEntryDto
          )
        ).data
      }

      const updatePayload = { ...apiValues } as unknown as Record<
        string,
        unknown
      >
      if (isRecurring) {
        updatePayload['recurringBaseInterval'] = recurrenceIntervalMonths ?? 1
        updatePayload['recurringType'] = ApiRecurringTransactionType.MONTHLY
      }

      const wasRecurringOriginally = Boolean(
        (editData as unknown as Record<string, unknown>).isRecurring
      )

      const updated = (
        await apiClient.entries.entryControllerUpdate(
          editData.id,
          updatePayload as unknown as ApiUpdateEntryDto
        )
      ).data

      if (!isRecurring && wasRecurringOriginally) {
        await apiClient.entries.entryControllerDisableScheduledEntry(
          editData.id
        )
      }

      return updated
    },
    onSuccess: data => {
      toast.success(
        editData
          ? 'Transaktion erfolgreich aktualisiert'
          : 'Transaktion erfolgreich erstellt'
      )

      // Always refresh transactions
      queryClient.invalidateQueries({ queryKey: ['transactions'] })

      // If we just created/updated a recurring entry, also refresh scheduled entries
      if (isRecurring) {
        queryClient.invalidateQueries({ queryKey: ['scheduled-entries'] })

        // If the API returned a child transaction (transactionId present), inform the user
        const entry = data as unknown as ApiEntryResponseDto
        if (entry && entry.transactionId) {
          toast(
            'Hinweis: Die API hat eine sofort ausgeführte Transaktion erstellt. Ein geplanter Eintrag wurde angelegt.'
          )
        } else {
          toast.success('Terminauftrag angelegt')
        }
      }

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
    // additional validation for recurrence at submit time to show user-friendly toast
    if (isRecurring) {
      if (
        recurrenceIntervalMonths === undefined ||
        recurrenceIntervalMonths === null ||
        recurrenceIntervalMonths < 1 ||
        !Number.isInteger(recurrenceIntervalMonths)
      ) {
        toast.error(
          'Bitte ein gültiges Intervall in Monaten (ganze Zahl > 0) angeben'
        )
        return
      }
    }

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
            {/* Date and Category Row */}
            <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
              {/* Date  */}
              <FormField
                control={form.control}
                name="createdAt"
                render={({ field }) => {
                  const isFutureDate =
                    field.value && new Date(field.value) > new Date()

                  return (
                    <FormItem className="mb-0">
                      <FormLabel>
                        Datum{' '}
                        <span className="text-muted-foreground">
                          (optional)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Popover
                          open={calendarOpen}
                          onOpenChange={setCalendarOpen}
                        >
                          <PopoverTrigger className="mb-0" asChild>
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
                                new Date(field.value).toLocaleDateString(
                                  'de-DE'
                                )
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
            </div>

            {/* Recurring toggle + interval input */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center">
                <div className="mr-5">
                  <Switch
                    checked={isRecurring}
                    onCheckedChange={val => {
                      const b = Boolean(val)
                      setIsRecurring(b)
                      if (
                        b &&
                        (recurrenceIntervalMonths === undefined ||
                          recurrenceIntervalMonths === null)
                      ) {
                        setRecurrenceIntervalMonths(1)
                      }
                    }}
                    className="cursor-pointer"
                  />
                </div>
                <div className="relative">
                  <div
                    className="group inline-block relative"
                    aria-describedby="recurring-tooltip"
                  >
                    <FormLabel>
                      Terminauftrag{' '}
                      <span className="text-muted-foreground">(optional)</span>
                    </FormLabel>
                    <div
                      id="recurring-tooltip"
                      role="tooltip"
                      className="hidden group-hover:block absolute top-full right-0 mt-2 w-64 p-2 rounded bg-card border border-border shadow-md text-sm text-muted-foreground z-20"
                    >
                      Wenn aktiviert, wird die Transaktion in dem angegebenen
                      Intervall automatisch wiederholt.
                    </div>
                  </div>
                </div>
              </div>

              {isRecurring && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FormLabel className="mb-2">
                      Widerholungsintervall{' '}
                      <span className="text-muted-foreground">(Monate)</span>
                    </FormLabel>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      value={recurrenceIntervalMonths ?? ''}
                      onChange={e => {
                        const v = e.target.value
                        const parsed = v === '' ? undefined : parseInt(v, 10)
                        setRecurrenceIntervalMonths(parsed)
                      }}
                      placeholder="z. B. 1"
                      className="w-full"
                    />
                  </div>
                </div>
              )}
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
