import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AusgabeFieldsProps {
  values: {
    titel: string
    betrag: number | string
    kategorie: string
    budget?: number | string
  }
  onChange: (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | { target: { name: string; value: string } }
  ) => void
  errors: {
    betrag?: string
    [key: string]: string | undefined
  }
}

export function AusgabeFields({
  values,
  onChange,
  errors,
}: AusgabeFieldsProps) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="titel">Titel der Ausgabe (optional)</Label>
        <Input
          type="text"
          id="titel"
          name="titel"
          value={values.titel}
          onChange={onChange}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="betrag">Betrag *</Label>
        <Input
          type="number"
          id="betrag"
          name="betrag"
          value={values.betrag}
          onChange={onChange}
          min="0"
          step="0.01"
          required
          className={errors.betrag ? 'border-red-500' : ''}
        />
        {errors.betrag && (
          <span className="text-red-500 text-xs">
            Bitte einen gültigen Betrag eingeben
          </span>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="budget">Budget (optional)</Label>
        <Input
          type="number"
          id="budget"
          name="budget"
          value={values.budget ?? ''}
          onChange={onChange}
          min="0"
          step="0.01"
        />
      </div>
      <div className="grid gap-2">
        <Select
          value={values.kategorie}
          onValueChange={val =>
            onChange({ target: { name: 'kategorie', value: val } })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Kategorie der Ausgabe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lebensmittel">Lebensmittel</SelectItem>
            <SelectItem value="miete">Miete</SelectItem>
            <SelectItem value="freizeit">Freizeit</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

interface EinnahmeFieldsProps {
  values: {
    titel: string
    betrag: number | string
    kategorie: string
  }
  onChange: (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | { target: { name: string; value: string } }
  ) => void
  errors: {
    betrag?: string
    [key: string]: string | undefined
  }
}

export function EinnahmeFields({
  values,
  onChange,
  errors,
}: EinnahmeFieldsProps) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="titel">Titel der Einnahme (optional)</Label>
        <Input
          type="text"
          id="titel"
          name="titel"
          value={values.titel}
          onChange={onChange}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="betrag">Betrag *</Label>
        <Input
          type="number"
          id="betrag"
          name="betrag"
          value={values.betrag}
          onChange={onChange}
          min="0"
          step="0.01"
          required
          className={errors.betrag ? 'border-red-500' : ''}
        />
        {errors.betrag && (
          <span className="text-red-500 text-xs">
            Bitte einen gültigen Betrag eingeben
          </span>
        )}
      </div>
      <div className="grid gap-2">
        <Select
          value={values.kategorie}
          onValueChange={val =>
            onChange({ target: { name: 'kategorie', value: val } })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Kategorie der Einnahme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gehalt">Gehalt</SelectItem>
            <SelectItem value="zinsen">Zinsen</SelectItem>
            <SelectItem value="sonstiges">Sonstiges</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
