import React, { ChangeEvent } from 'react'
import { Input } from './input'
import { cn } from '@/lib/utils'

interface FormattedCurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onChange: (event: { target: { name: string; value: string } }) => void
  value: string | number
  name: string
  placeholder?: string
}

export function FormattedCurrencyInput({
  className = '',
  onChange,
  value,
  name,
  placeholder = '0,00',
  ...props
}: FormattedCurrencyInputProps) {
  // Wert als String, nur Ziffern
  let raw = ''
  if (typeof value === 'number') {
    raw = Math.round(value * 100).toString()
  } else if (typeof value === 'string') {
    raw = value.replace(/[^\d]/g, '')
  }
  // Immer mindestens 3 Stellen (z.B. 000)
  const padded = raw.padStart(3, '0')
  // Komma setzen
  const formatted = `${parseInt(padded.slice(0, -2), 10).toLocaleString('de-DE')},${padded.slice(-2)}`

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Nur Ziffern nehmen
    const digits = e.target.value.replace(/[^\d]/g, '')
    onChange({
      target: {
        name,
        value: (parseInt(digits || '0', 10) / 100).toString(),
      },
    })
  }

  return (
    <Input
      {...props}
      name={name}
      type="text"
      inputMode="numeric"
      value={formatted === '0,00' && !raw ? '' : formatted}
      onChange={handleChange}
      className={cn(
        'text-right',
        'placeholder:text-muted-foreground',
        className
      )}
      dir="rtl"
      placeholder={placeholder}
    />
  )
}
