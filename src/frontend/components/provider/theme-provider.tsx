import { createContext, useContext, useEffect } from 'react'
import { useTheme as useNextTheme } from 'next-themes'
import { useLocalStorage } from '@mantine/hooks'

export enum ColorTheme {
  DEFAULT = 'default', // Ozean Breeze
  AMBER_MINIMAL = 'amber-minimal',
  CLEAN_SLATE = 'clean-slate',
  MODERN_MINIMAL = 'modern-minimal',
  SUNSET_HORIZON = 'sunset-horizon',
}

export enum Theme {
  DARK = 'dark',
  LIGHT = 'light',
  SYSTEM = 'system',
}

export const ThemeConfig = [
  {
    key: ColorTheme.DEFAULT,
    label: 'Ozean Breeze',
    description: 'Ruhiges Grün',
    colors: ['oklch(0.7227 0.192 149.5793)', 'oklch(0.9514 0.025 236.8242)'],
  },
  {
    key: ColorTheme.AMBER_MINIMAL,
    label: 'Amber Minimal',
    description: 'Warmes Amber',
    colors: ['oklch(0.7686 0.1647 70.0804)', 'oklch(0.9869 0.0214 95.2774)'],
  },
  {
    key: ColorTheme.CLEAN_SLATE,
    label: 'Clean Slate',
    description: 'Sauberes Violett',
    colors: ['oklch(0.5854 0.2041 277.1173)', 'oklch(0.9299 0.0334 272.7879)'],
  },
  {
    key: ColorTheme.SUNSET_HORIZON,
    label: 'Sunset Horizon',
    description: 'Warmer Sonnenuntergang',
    colors: ['oklch(0.7357 0.1641 34.7091)', 'oklch(0.8278 0.1131 57.9984)'],
  },
  {
    key: ColorTheme.MODERN_MINIMAL,
    label: 'Modern Minimal',
    description: 'Modernes Blau',
    colors: ['oklch(0.6231 0.1880 259.8145)', 'oklch(0.9514 0.0250 236.8242)'],
  },
]

const themesClassArray = Object.values(ColorTheme).map(
  theme => `theme-${theme}`
)

interface ThemeProviderContextType {
  colorTheme: ColorTheme
  setColorTheme: (theme: ColorTheme) => void
  themeVariant: Theme
  setThemeVariant: (variant: Theme) => void
}

const ThemeProviderContext = createContext<
  ThemeProviderContextType | undefined
>(undefined)

export function ColorThemeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { setTheme } = useNextTheme()

  const [colorTheme, setColorTheme] = useLocalStorage<ColorTheme>({
    key: 'color-theme',
    defaultValue: ColorTheme.DEFAULT,
  })

  const [themeVariant, setThemeVariant] = useLocalStorage<Theme>({
    key: 'theme-variant',
    defaultValue: Theme.DARK,
  })

  useEffect(() => {
    setTheme(themeVariant === Theme.SYSTEM ? 'system' : themeVariant)
  }, [themeVariant, setTheme])

  useEffect(() => {
    const root = window.document.documentElement
    // Remove all theme classes
    root.classList.remove(...themesClassArray)
    // Add current color theme
    root.classList.add(`theme-${colorTheme}`)
  }, [colorTheme])

  return (
    <ThemeProviderContext.Provider
      value={{ colorTheme, setColorTheme, themeVariant, setThemeVariant }}
    >
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useColorTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error('useColorTheme must be used within a ThemeProvider')

  return context
}
