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
import { Label } from '@/components/ui/label'
import { CategorySelect } from '@/components/category-select'
import { Plus, TrendingDown, TrendingUp } from 'lucide-react'
import { SetStateAction, useState } from 'react'
import { createTransactionEntry } from '@/lib/api/entries'

type TransactionType = 'ausgabe' | 'einnahme'

export function AddTransactionDialog({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<TransactionType>('ausgabe')
  const [titel, setTitel] = useState('')
  const [betrag, setBetrag] = useState('')
  const [kategorie, setKategorie] = useState('')
  const [datum, setDatum] = useState('')

  const handleSubmit = async () => {
    if (!betrag.trim() || isNaN(Number(betrag))) return

    try {
      await createTransactionEntry({
        type,
        amount: Math.round(parseFloat(betrag) * 100), // store in cents
        description: titel || undefined,
        categoryId: kategorie ? parseInt(kategorie) : undefined,
        startDate: datum || undefined,
        currency: 'EUR', // or make dynamic if needed
      })

      // Reset & close
      setTitel('')
      setBetrag('')
      setKategorie('')
      setDatum('')
      setOpen(false)
    } catch (error) {
      console.error(error)
      // Optionally show toast notification here
    }

    setOpen(false)
    setTitel('')
    setBetrag('')
    setKategorie('')
    setDatum('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Transaktion hinzufügen
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Typ */}
          <Label htmlFor="Typ">
            Typ<span className="text-red-500">*</span>
          </Label>
          <div className="flex gap-1">
            <Button
              type="button"
              variant={type === 'ausgabe' ? 'destructive' : 'outline'}
              className="flex-1"
              onClick={() => setType('ausgabe')}
            >
              <TrendingDown className="w-4 h-4" />
              Ausgabe
            </Button>
            <Button
              type="button"
              variant={type === 'einnahme' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setType('einnahme')}
            >
              <TrendingUp className="w-4 h-4" />
              Einnahme
            </Button>
          </div>

          {/* Titel */}
          <div className="grid gap-1">
            <Label htmlFor="Titel">
              Titel<span className="text-muted-foreground">(optional)</span>
            </Label>

            <Input
              id="titel"
              placeholder="z. B. REWE Einkauf, Gehalt..."
              value={titel}
              onChange={e => setTitel(e.target.value)}
            />
          </div>

          {/* Betrag */}
          <div className="grid gap-1">
            <Label htmlFor="betrag">
              Betrag<span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                €
              </span>
              <Input
                id="betrag"
                type="number"
                min="0"
                step="0.01"
                className="pl-7"
                value={betrag}
                onChange={e => setBetrag(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Kategorie */}
          <div className="grid gap-1">
            <Label htmlFor="Kategorie">
              Kategorie{' '}
              <span className="text-muted-foreground">(optional)</span>
            </Label>

            <CategorySelect
              value={kategorie}
              onChange={(val: SetStateAction<string>) => setKategorie(val)}
              placeholder="Kategorie auswählen"
              options={[
                { value: 'lebensmittel', label: 'Lebensmittel' },
                { value: 'miete', label: 'Miete' },
                { value: 'freizeit', label: 'Freizeit' },
              ]}
            />
          </div>

          {/* Datum */}
          <div className="grid gap-1">
            <Label htmlFor="Datum">
              Titel<span className="text-muted-foreground">(optional)</span>
            </Label>

            <Input
              id="datum"
              type="date"
              value={datum}
              onChange={e => setDatum(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="mt-4">
          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={!betrag.trim() || isNaN(Number(betrag))}
          >
            <Plus className="w-4 h-4 mr-2" />
            Hinzufügen
          </Button>
        </DialogFooter>

        <p className="text-xs text-muted-foreground text-center mt-2">
          Felder mit <span className="text-red-500">*</span> sind Pflichtfelder
        </p>
      </DialogContent>
    </Dialog>
  )
}
