import React, { ChangeEvent, useRef, useState } from 'react'
import { Input } from './input'
import { cn } from '@/lib/utils'

interface FormattedCurrencyInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'onChange' | 'value'
  > {
  onChange: (event: { target: { name: string; value: number } }) => void
  value: number | '' // float (Euro) or empty
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
  const [inputError, setInputError] = useState(false)
  // Convert float value to cent-string for formatting
  let raw = ''
  if (typeof value === 'number' && !isNaN(value)) {
    raw = Math.round(value * 100).toString()
  }
  // Format for display
  let formatted = ''
  if (raw !== '') {
    const padded = raw.padStart(3, '0')
    formatted = `${parseInt(padded.slice(0, -2), 10).toLocaleString('de-DE')},${padded.slice(-2)}`
  }

  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const valueRaw = e.target.value
    // Check for invalid (non-digit) characters except allowed formatting
    if (/[^\d.,]/.test(valueRaw)) {
      setInputError(true)
    } else {
      setInputError(false)
    }
    const digits = valueRaw.replace(/[^\d]/g, '')
    // Convert cent-string to float (Euro)
    const floatValue = digits ? parseInt(digits, 10) / 100 : 0
    onChange({
      target: {
        name,
        value: floatValue,
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
    <div>
      <Input
        {...props}
        ref={inputRef}
        name={name}
        type="text"
        inputMode="numeric"
        value={value === '' ? '' : formatted}
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
      {inputError && (
        <div className="text-xs text-red-500 mt-1">
          Bitte nur Zahlen eingeben!
        </div>
      )}
    </div>
  )
}
