'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { DialogHeader, DialogFooter } from '@/components/ui/dialog'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'
import { AusgabeFields, EinnahmeFields } from './transaction-fields'

interface AddTransactionDialogProps {
  children: React.ReactNode
}

const initialAusgabe = { titel: '', betrag: '', kategorie: '' }
const initialEinnahme = { titel: '', betrag: '', kategorie: '' }

function AddTransactionDialog({ children }: AddTransactionDialogProps) {
  const [type, setType] = useState<'ausgabe' | 'einnahme'>('ausgabe')
  const [ausgabe, setAusgabe] = useState(initialAusgabe)
  const [einnahme, setEinnahme] = useState(initialEinnahme)
  const [errors, setErrors] = useState<{
    [key: string]: string | undefined
    betrag?: string
  }>({})

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | { target: { name: string; value: string } }
  ) => {
    const { name, value } = e.target
    if (type === 'ausgabe') {
      setAusgabe(prev => ({ ...prev, [name]: value }))
    } else {
      setEinnahme(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const values = type === 'ausgabe' ? ausgabe : einnahme
    const betragValid =
      values.betrag &&
      !isNaN(Number(values.betrag)) &&
      Number(values.betrag) > 0
    if (!betragValid) {
      setErrors({ betrag: 'Bitte geben Sie einen gültigen Betrag ein.' })
      return
    }
    setErrors({})
    // Submit logic here
    // Reset form
    setAusgabe(initialAusgabe)
    setEinnahme(initialEinnahme)
    // Optionally close dialog
  }

  const handleCancel = () => {
    setAusgabe(initialAusgabe)
    setEinnahme(initialEinnahme)
    setErrors({})
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] w-full p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>
              {type === 'ausgabe'
                ? 'Neue Ausgabe hinzufügen'
                : 'Neue Einnahme hinzufügen'}
            </DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <RadioGroup
            className="flex flex-row gap-6 mb-2"
            value={type}
            onValueChange={value => setType(value as 'ausgabe' | 'einnahme')}
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="ausgabe" id="ausgabe" />
              <label htmlFor="ausgabe">Ausgabe</label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="einnahme" id="einnahme" />
              <label htmlFor="einnahme">Einnahme</label>
            </div>
          </RadioGroup>
          <div className="grid gap-4 w-full">
            {type === 'ausgabe' ? (
              <AusgabeFields
                values={ausgabe}
                onChange={handleChange}
                errors={errors}
              />
            ) : (
              <EinnahmeFields
                values={einnahme}
                onChange={handleChange}
                errors={errors}
              />
            )}
          </div>
          <DialogFooter className="flex flex-row gap-2 justify-end pt-2">
            <DialogClose asChild>
              <Button variant="outline" type="button" onClick={handleCancel}>
                Abbrechen
              </Button>
            </DialogClose>
            <Button type="submit">Speichern</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddTransactionDialog
