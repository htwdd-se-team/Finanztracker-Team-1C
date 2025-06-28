import React, { ChangeEvent, useRef } from 'react'
import { Input } from './input'
import { cn } from '@/lib/utils'

interface FormattedCurrencyInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'onChange' | 'value'
  > {
  onChange: (event: { target: { name: string; value: string } }) => void
  value: string
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
  const raw = value.replace(/[^\d]/g, '')
  const padded = raw.padStart(3, '0')
  const formatted = `${parseInt(padded.slice(0, -2), 10).toLocaleString('de-DE')},${padded.slice(-2)}`

  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^\d]/g, '')
    onChange({
      target: {
        name,
        value: digits.replace(/^0+(?!$)/, ''),
      },
    })
  }

  // Set cursor to end on focus
  const handleFocus = () => {
    window.requestAnimationFrame(() => {
      const el = inputRef.current
      if (el) {
        const len = el.value.length
        el.setSelectionRange(len, len)
      }
    })
  }

  return (
    <Input
      {...props}
      ref={inputRef}
      name={name}
      type="text"
      inputMode="numeric"
      value={raw === '' ? '' : formatted}
      onChange={handleChange}
      onFocus={handleFocus}
      className={cn(
        'text-right',
        'placeholder:text-muted-foreground',
        className
      )}
      autoComplete="off"
      placeholder={placeholder}
    />
  )
}
