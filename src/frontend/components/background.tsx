import React from 'react'

interface BackgroundProps {
  children: React.ReactNode
}

export default function Background({ children }: BackgroundProps) {
  return (
    <div className="bg-background min-h-screen">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-white to-cyan-100"></div>
        <div className="top-0 left-1/4 absolute bg-blue-300/50 blur-3xl rounded-full w-96 h-96"></div>
        <div className="right-1/4 bottom-0 absolute bg-cyan-300/45 blur-3xl rounded-full w-80 h-80"></div>
        <div className="top-1/2 left-1/2 absolute bg-blue-200/40 blur-2xl rounded-full w-72 h-72 -translate-x-1/2 -translate-y-1/2 transform"></div>
        <div className="top-1/4 right-1/3 absolute bg-sky-200/35 blur-3xl rounded-full w-64 h-64"></div>
      </div>

      {/* Content */}
      <div className="z-10 relative">{children}</div>
    </div>
  )
}
