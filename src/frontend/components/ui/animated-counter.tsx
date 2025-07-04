'use client'

import * as React from 'react'
import { MotionValue, motion, useSpring, useTransform } from 'framer-motion'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedCounterProps
  extends React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > {
  start?: number
  end: number
  duration?: number
  className?: string
  fontSize?: number
  currency?: boolean
  locale?: string
  decimalPlaces?: number
  prefix?: string
  suffix?: string
  animationDelay?: number
}

export const AnimatedCounter = ({
  start = 0,
  end,
  duration = 2000,
  className,
  fontSize = 16,
  currency = false,
  locale = 'de-DE',
  decimalPlaces = 2,
  prefix = '',
  suffix = '',
  animationDelay = 0,
  ...rest
}: AnimatedCounterProps) => {
  const [value, setValue] = useState(start)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (animationDelay > 0) {
      const delayTimeout = setTimeout(() => {
        setIsAnimating(true)
      }, animationDelay)
      return () => clearTimeout(delayTimeout)
    } else {
      setIsAnimating(true)
    }
  }, [animationDelay])

  useEffect(() => {
    if (!isAnimating) return

    const startTime = Date.now()
    const difference = end - start

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentValue = start + difference * easeOut

      setValue(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [start, end, duration, isAnimating])

  const formatValue = (val: number) => {
    if (currency) {
      return val.toLocaleString(locale, {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      })
    }

    return val.toLocaleString(locale, {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    })
  }

  // For integer values or simple counters, use digit-by-digit animation
  if (!currency && Number.isInteger(end) && Math.abs(end) < 1000000) {
    return (
      <DigitCounter
        value={Math.round(value)}
        className={className}
        fontSize={fontSize}
        prefix={prefix}
        suffix={suffix}
        {...rest}
      />
    )
  }

  // For currency or large values, use simple animated text
  return (
    <div
      style={{ fontSize }}
      className={cn('font-bold tabular-nums', className)}
      {...rest}
    >
      {prefix}
      {formatValue(value)}
      {suffix}
    </div>
  )
}

interface DigitCounterProps
  extends React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > {
  value: number
  fontSize?: number
  prefix?: string
  suffix?: string
}

const DigitCounter = ({
  value,
  className,
  fontSize = 16,
  prefix = '',
  suffix = '',
  ...rest
}: DigitCounterProps) => {
  const height = fontSize + 4

  const getDigits = (num: number) => {
    const absNum = Math.abs(num)
    const digits = []

    if (absNum >= 1000000) digits.push(Math.floor(absNum / 1000000) % 10)
    if (absNum >= 100000) digits.push(Math.floor(absNum / 100000) % 10)
    if (absNum >= 10000) digits.push(Math.floor(absNum / 10000) % 10)
    if (absNum >= 1000) digits.push(Math.floor(absNum / 1000) % 10)
    if (absNum >= 100) digits.push(Math.floor(absNum / 100) % 10)
    if (absNum >= 10) digits.push(Math.floor(absNum / 10) % 10)
    digits.push(absNum % 10)

    return digits
  }

  const digits = getDigits(value)
  const isNegative = value < 0

  return (
    <div
      style={{ fontSize }}
      className={cn(
        'flex overflow-hidden leading-none font-bold tabular-nums',
        className
      )}
      {...rest}
    >
      {prefix}
      {isNegative && <span>-</span>}
      {digits.map((digit, index) => (
        <Digit key={index} value={digit} height={height} />
      ))}
      {suffix}
    </div>
  )
}

function Digit({ value, height }: { value: number; height: number }) {
  const animatedValue = useSpring(value, {
    damping: 20,
    stiffness: 100,
  })

  useEffect(() => {
    animatedValue.set(value)
  }, [animatedValue, value])

  return (
    <div style={{ height }} className="relative w-[1ch]">
      {[...Array(10)].map((_, i) => (
        <AnimatedNumber key={i} mv={animatedValue} number={i} height={height} />
      ))}
    </div>
  )
}

function AnimatedNumber({
  mv,
  number,
  height,
}: {
  mv: MotionValue
  number: number
  height: number
}) {
  const y = useTransform(mv, latest => {
    const placeValue = latest % 10
    const offset = (10 + number - placeValue) % 10

    let memo = offset * height

    if (offset > 5) {
      memo -= 10 * height
    }

    return memo
  })

  return (
    <motion.span
      style={{ y }}
      className="absolute inset-0 flex justify-center items-center"
    >
      {number}
    </motion.span>
  )
}
