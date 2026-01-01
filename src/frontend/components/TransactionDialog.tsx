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
import { Separator } from '@/components/ui/separator'
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

// Helper to format date to ISO string
const formatIsoDate = (d: Date): string => d.toISOString().split('T')[0]

// Get date 30 days ago in ISO format
const getThirtyDaysAgoIso = (): string =>
  formatIsoDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))

// Type-safe interface for edit data with optional recurring properties
interface EditDataWithRecurring extends ApiEntryResponseDto {
  isRecurring?: boolean
  recurringBaseInterval?: number
  recurrenceIntervalMonths?: number
}

type FormValues = z.infer<typeof createEntrySchema>

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

  const thirtyDaysAgoIso = getThirtyDaysAgoIso()

  // Helper to build form default values
  const getFormDefaults = (data?: ApiEntryResponseDto): FormValues => {
    if (!data) {
      return {
        type: ApiTransactionType.EXPENSE,
        amount: 0,
        description: '',
        categoryId: undefined,
        currency: ApiCurrency.EUR,
        createdAt: formatIsoDate(new Date()),
      }
    }

    return {
      type: data.type,
      amount: data.amount / 100,
      description: data.description || '',
      categoryId: data.categoryId || undefined,
      currency: data.currency,
      createdAt: data.createdAt?.split('T')[0],
    }
  }

  // Helper to extract recurring data from edit data
  const getRecurringDataFromEdit = (
    data: ApiEntryResponseDto
  ): { isRecurring: boolean; interval: number | undefined } => {
    const editWithRecurring = data as EditDataWithRecurring
    const isRecurringFlag = Boolean(editWithRecurring.isRecurring)
    const interval =
      typeof editWithRecurring.recurringBaseInterval === 'number'
        ? editWithRecurring.recurringBaseInterval
        : typeof editWithRecurring.recurrenceIntervalMonths === 'number'
          ? editWithRecurring.recurrenceIntervalMonths
          : undefined

    return {
      isRecurring: isRecurringFlag,
      interval: isRecurringFlag && interval === undefined ? 1 : interval,
    }
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(createEntrySchema),
    defaultValues: getFormDefaults(editData),
  })

  // Update form when dialog opens or editData changes
  useEffect(() => {
    if (open) {
      form.reset(getFormDefaults(editData))
      if (editData) {
        const { isRecurring: isRec, interval } =
          getRecurringDataFromEdit(editData)
        setIsRecurring(isRec)
        setRecurrenceIntervalMonths(interval)
      } else {
        setIsRecurring(false)
        setRecurrenceIntervalMonths(undefined)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editData])

  // Validation helper
  const validateRecurrence = (): boolean => {
    if (
      isRecurring &&
      (recurrenceIntervalMonths === undefined ||
        recurrenceIntervalMonths === null ||
        recurrenceIntervalMonths < 1 ||
        !Number.isInteger(recurrenceIntervalMonths))
    ) {
      return false
    }
    return true
  }

  // Create new entry
  const createNewEntry = async (
    apiValues: Record<string, unknown>
  ): Promise<ApiEntryResponseDto> => {
    const payload: Record<string, unknown> = {
      ...apiValues,
      isRecurring: Boolean(isRecurring),
    }

    if (isRecurring) {
      payload.recurringBaseInterval = recurrenceIntervalMonths ?? 1
      payload.recurringType = ApiRecurringTransactionType.MONTHLY
    }

    return (
      await apiClient.entries.entryControllerCreate(
        payload as unknown as ApiCreateEntryDto
      )
    ).data
  }

  // Update existing entry
  const updateExistingEntry = async (
    apiValues: Record<string, unknown>
  ): Promise<ApiEntryResponseDto> => {
    const updatePayload: Record<string, unknown> = { ...apiValues }

    if (isRecurring) {
      updatePayload.recurringBaseInterval = recurrenceIntervalMonths ?? 1
      updatePayload.recurringType = ApiRecurringTransactionType.MONTHLY
    }

    const editDataWithRecurring = editData as EditDataWithRecurring
    const wasRecurringOriginally = Boolean(editDataWithRecurring.isRecurring)

    const updated = (
      await apiClient.entries.entryControllerUpdate(
        editData!.id,
        updatePayload as ApiUpdateEntryDto
      )
    ).data

    if (!isRecurring && wasRecurringOriginally) {
      await apiClient.entries.entryControllerDisableScheduledEntry(editData!.id)
    }

    return updated
  }

  // Mutation handler
  const { mutate, isPending } = useMutation({
    mutationKey: editData
      ? ['transactions', 'update', editData.id]
      : ['transactions', 'create'],
    mutationFn: async (values: FormValues) => {
      if (!validateRecurrence()) {
        throw new Error('Ungültiges Intervall')
      }

      const apiValues = {
        ...values,
        amount: Math.floor(values.amount * 100),
      }

      return editData
        ? await updateExistingEntry(apiValues)
        : await createNewEntry(apiValues)
    },
    onSuccess: data => {
      const successMessage = editData
        ? 'Transaktion erfolgreich aktualisiert'
        : 'Transaktion erfolgreich erstellt'
      toast.success(successMessage)

      queryClient.invalidateQueries({ queryKey: ['transactions'] })

      if (isRecurring) {
        queryClient.invalidateQueries({ queryKey: ['scheduled-entries'] })

        const entry = data as EditDataWithRecurring
        if (entry?.transactionId) {
          toast(
            'Hinweis: Die API hat eine sofort ausgeführte Transaktion erstellt. Ein geplanter Eintrag wurde angelegt.'
          )
        }
      }

      form.reset()
      setOpen(false)
    },
    onError: () => {
      const errorMessage = editData
        ? 'Fehler beim Aktualisieren der Transaktion'
        : 'Fehler beim Erstellen der Transaktion'
      toast.error(errorMessage)
    },
  })

  const onSubmit = (values: FormValues) => {
    if (isRecurring && !validateRecurrence()) {
      toast.error(
        'Bitte ein gültiges Intervall in Monaten (ganze Zahl > 0) angeben'
      )
      return
    }

    mutate(values)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isPending) {
      form.reset()
    }
    setOpen(newOpen)
  }

  const handleRecurringToggle = (checked: boolean) => {
    setIsRecurring(checked)

    if (checked) {
      if (
        recurrenceIntervalMonths === undefined ||
        recurrenceIntervalMonths === null
      ) {
        setRecurrenceIntervalMonths(1)
      }

      // Reset date if it's earlier than 30 days ago
      const currentDate = form.getValues('createdAt')
      if (currentDate) {
        const curDate = new Date(currentDate)
        const minDate = new Date(thirtyDaysAgoIso)
        if (curDate < minDate) {
          form.setValue('createdAt', '')
          toast(
            'Ausgewähltes Datum wurde zurückgesetzt: Bei Terminaufträgen sind nur Daten innerhalb der letzten 30 Tage oder in der Zukunft zulässig.'
          )
        }
      }
    }
  }

  const handleDateChange = (dateString: string) => {
    if (!dateString) {
      form.setValue('createdAt', '')
      setCalendarOpen(false)
      return
    }

    if (isRecurring) {
      const selected = new Date(dateString)
      const minDate = new Date(thirtyDaysAgoIso)
      if (selected < minDate) {
        form.setValue('createdAt', thirtyDaysAgoIso)
        toast(
          `Datum liegt mehr als 30 Tage in der Vergangenheit. Auf ${new Date(
            thirtyDaysAgoIso
          ).toLocaleDateString('de-DE')} gesetzt.`
        )
        setCalendarOpen(false)
        return
      }
    }

    form.setValue('createdAt', dateString)
    setCalendarOpen(false)
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
              {/* Date */}
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
                              minValue={
                                isRecurring
                                  ? parseDate(thirtyDaysAgoIso)
                                  : undefined
                              }
                              onChange={date => {
                                handleDateChange(date?.toString() || '')
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
            <Separator />
            <div className="flex items-center justify-between gap-4 min-h-10">
              <div className="flex items-center gap-3">
                <Switch
                  checked={isRecurring}
                  onCheckedChange={handleRecurringToggle}
                  className="cursor-pointer"
                />
                <div className="relative">
                  <div
                    className="group inline-block relative"
                    aria-describedby="recurring-tooltip"
                  >
                    <FormLabel className="cursor-help">Terminauftrag</FormLabel>
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
                <div className="flex items-center gap-2">
                  <span className="text-sm">aller</span>
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
                    placeholder="1"
                    className="w-16 h-9"
                  />
                  <span className="text-sm">Monate</span>
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
