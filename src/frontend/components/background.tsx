import React from 'react'

interface BackgroundProps {
  children: React.ReactNode
}

export default function Background({ children }: BackgroundProps) {
  return (
    <div className="bg-background min-h-screen">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-br via-background blur-[1px]"
          style={{
            background: `linear-gradient(to bottom right, hsl(from var(--primary) h s l / 0.1), var(--background), hsl(from var(--secondary) h s l / 0.15))`,
          }}
        ></div>
        <div
          className="top-0 left-1/4 absolute blur-3xl rounded-full w-96 h-96"
          style={{
            backgroundColor: `hsl(from var(--primary) h s l / 0.2)`,
          }}
        ></div>
        <div
          className="right-1/4 bottom-0 absolute blur-3xl rounded-full w-80 h-80"
          style={{
            backgroundColor: `hsl(from var(--chart-3) h s l / 0.18)`,
          }}
        ></div>
        <div
          className="top-1/2 left-1/2 absolute blur-2xl rounded-full w-72 h-72 -translate-x-1/2 -translate-y-1/2 transform"
          style={{
            backgroundColor: `hsl(from var(--accent) h s l / 0.15)`,
          }}
        ></div>
        <div
          className="top-1/4 right-1/3 absolute blur-3xl rounded-full w-64 h-64"
          style={{
            backgroundColor: `hsl(from var(--secondary) h s l / 0.12)`,
          }}
        ></div>
      </div>

      {/* Content */}
      <div className="z-10 relative">{children}</div>
    </div>
  )
}
