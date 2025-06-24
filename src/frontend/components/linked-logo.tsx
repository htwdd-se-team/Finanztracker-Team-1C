import Link from 'next/link'

export default function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 ${className}`}
    >
      FinApp
    </Link>
  )
}
