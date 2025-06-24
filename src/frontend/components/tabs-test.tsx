'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Tab {
  id: string
  label: string
  content: React.ReactNode
}

interface AnimatedTabsProps {
  tabs?: Tab[]
  defaultTab?: string
  className?: string
}

const defaultTabs: Tab[] = [
  {
    id: 'tab1',
    label: 'Tab 1',
    content: (
      <div className="gap-4 grid grid-cols-2 w-full h-full">
        <img
          src="https://images.unsplash.com/photo-1493552152660-f915ab47ae9d?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Tab 1"
          className="shadow-[0_0_20px_rgba(0,0,0,0.2)] !m-0 mt-0 border-none rounded-lg w-full h-60 object-cover"
        />

        <div className="flex flex-col gap-y-2">
          <h2 className="!m-0 mt-0 mb-0 font-bold text-white text-2xl">
            Tab 1
          </h2>
          <p className="mt-0 text-gray-200 text-sm">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
            quos.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'tab2',
    label: 'Tab 2',
    content: (
      <div className="gap-4 grid grid-cols-2 w-full h-full">
        <img
          src="https://images.unsplash.com/photo-1506543730435-e2c1d4553a84?q=80&w=2362&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Tab 2"
          className="shadow-[0_0_20px_rgba(0,0,0,0.2)] !m-0 mt-0 border-none rounded-lg w-full h-60 object-cover"
        />
        <div className="flex flex-col gap-y-2">
          <h2 className="!m-0 mt-0 mb-0 font-bold text-white text-2xl">
            Tab 2
          </h2>
          <p className="mt-0 text-gray-200 text-sm">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
            quos.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'tab3',
    label: 'Tab 3',
    content: (
      <div className="gap-4 grid grid-cols-2 w-full h-full">
        <img
          src="https://images.unsplash.com/photo-1522428938647-2baa7c899f2f?q=80&w=2000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Tab 3"
          className="shadow-[0_0_20px_rgba(0,0,0,0.2)] !m-0 mt-0 border-none rounded-lg w-full h-60 object-cover"
        />
        <div className="flex flex-col gap-y-2">
          <h2 className="!m-0 mt-0 mb-0 font-bold text-white text-2xl">
            Tab 3
          </h2>
          <p className="mt-0 text-gray-200 text-sm">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
            quos.
          </p>
        </div>
      </div>
    ),
  },
]

const AnimatedTabs = ({
  tabs = defaultTabs,
  defaultTab,
  className,
}: AnimatedTabsProps) => {
  const [activeTab, setActiveTab] = useState<string>(defaultTab || tabs[0]?.id)

  if (!tabs?.length) return null

  return (
    <div className={cn('w-full max-w-lg flex flex-col gap-y-1', className)}>
      <div className="flex flex-wrap gap-2 bg-[#11111198] bg-opacity-50 backdrop-blur-sm p-1 rounded-xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'relative px-3 py-1.5 text-sm font-medium rounded-lg text-white outline-none transition-colors'
            )}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="active-tab"
                className="absolute inset-0 bg-[#111111d1] bg-opacity-50 shadow-[0_0_20px_rgba(0,0,0,0.2)] backdrop-blur-sm !rounded-lg"
                transition={{ type: 'spring', duration: 0.6 }}
              />
            )}
            <span className="z-10 relative">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-[#11111198] bg-opacity-50 shadow-[0_0_20px_rgba(0,0,0,0.2)] backdrop-blur-sm p-4 border rounded-xl h-full min-h-60 text-white">
        {tabs.map(
          tab =>
            activeTab === tab.id && (
              <motion.div
                key={tab.id}
                initial={{
                  opacity: 0,
                  scale: 0.95,
                  x: -10,
                  filter: 'blur(10px)',
                }}
                animate={{ opacity: 1, scale: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.95, x: -10, filter: 'blur(10px)' }}
                transition={{
                  duration: 0.5,
                  ease: 'circInOut',
                  type: 'spring',
                }}
              >
                {tab.content}
              </motion.div>
            )
        )}
      </div>
    </div>
  )
}

export { AnimatedTabs }
