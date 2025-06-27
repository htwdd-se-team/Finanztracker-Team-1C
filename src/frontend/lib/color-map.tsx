export enum CategoryColors {
  // Primary Colors
  BLUE = 'blue',
  GREEN = 'green',
  RED = 'red',
  ORANGE = 'orange',
  PURPLE = 'purple',

  // Secondary Colors
  TEAL = 'teal',
  PINK = 'pink',
  YELLOW = 'yellow',
  INDIGO = 'indigo',
  EMERALD = 'emerald',

  // Neutral/Accent Colors
  GRAY = 'gray',
  SLATE = 'slate',
  AMBER = 'amber',
  LIME = 'lime',
  CYAN = 'cyan',
}

export const categoryColorMap = {
  [CategoryColors.BLUE]: {
    className:
      'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/30',
    badge: 'bg-blue-500',
    name: 'Blau',
    hex: '#3b82f6',
  },
  [CategoryColors.GREEN]: {
    className:
      'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800/30',
    badge: 'bg-green-500',
    name: 'Grün',
    hex: '#22c55e',
  },
  [CategoryColors.RED]: {
    className:
      'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/30',
    badge: 'bg-red-500',
    name: 'Rot',
    hex: '#ef4444',
  },
  [CategoryColors.ORANGE]: {
    className:
      'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800/30',
    badge: 'bg-orange-500',
    name: 'Orange',
    hex: '#f97316',
  },
  [CategoryColors.PURPLE]: {
    className:
      'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800/30',
    badge: 'bg-purple-500',
    name: 'Lila',
    hex: '#a855f7',
  },
  [CategoryColors.TEAL]: {
    className:
      'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-800/30',
    badge: 'bg-teal-500',
    name: 'Türkis',
    hex: '#14b8a6',
  },
  [CategoryColors.PINK]: {
    className:
      'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800/30',
    badge: 'bg-pink-500',
    name: 'Rosa',
    hex: '#ec4899',
  },
  [CategoryColors.YELLOW]: {
    className:
      'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800/30',
    badge: 'bg-yellow-500',
    name: 'Gelb',
    hex: '#eab308',
  },
  [CategoryColors.INDIGO]: {
    className:
      'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800/30',
    badge: 'bg-indigo-500',
    name: 'Indigo',
    hex: '#6366f1',
  },
  [CategoryColors.EMERALD]: {
    className:
      'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800/30',
    badge: 'bg-emerald-500',
    name: 'Smaragd',
    hex: '#10b981',
  },
  [CategoryColors.GRAY]: {
    className:
      'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800/30',
    badge: 'bg-gray-500',
    name: 'Grau',
    hex: '#6b7280',
  },
  [CategoryColors.SLATE]: {
    className:
      'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/20 dark:text-slate-300 dark:border-slate-800/30',
    badge: 'bg-slate-500',
    name: 'Schiefer',
    hex: '#64748b',
  },
  [CategoryColors.AMBER]: {
    className:
      'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800/30',
    badge: 'bg-amber-500',
    name: 'Bernstein',
    hex: '#f59e0b',
  },
  [CategoryColors.LIME]: {
    className:
      'bg-lime-100 text-lime-800 border-lime-200 dark:bg-lime-900/20 dark:text-lime-300 dark:border-lime-800/30',
    badge: 'bg-lime-500',
    name: 'Limone',
    hex: '#84cc16',
  },
  [CategoryColors.CYAN]: {
    className:
      'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800/30',
    badge: 'bg-cyan-500',
    name: 'Cyan',
    hex: '#06b6d4',
  },
} as const

// Helper function to get color classes
export const getCategoryColorClasses = (color: CategoryColors) => {
  return categoryColorMap[color].className
}

// Helper function to get badge color
export const getCategoryBadgeColor = (color: CategoryColors) => {
  return categoryColorMap[color].badge
}

// Helper function to get color name
export const getCategoryColorName = (color: CategoryColors) => {
  return categoryColorMap[color].name
}

// Helper function to get hex color
export const getCategoryColorHex = (color: CategoryColors) => {
  return categoryColorMap[color].hex
}

// Get all available colors
export const getAllCategoryColors = () => {
  return Object.values(CategoryColors)
}

// Type for color configuration
export type CategoryColorConfig =
  (typeof categoryColorMap)[keyof typeof categoryColorMap]
