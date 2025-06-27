import {
  DollarSign,
  CreditCard,
  Banknote,
  Coins,
  TrendingUp,
  Receipt,
  Wallet,
  PiggyBank,
  ShoppingCart,
  Car,
  Home,
  Utensils,
  Gamepad2,
  Plane,
  Heart,
  GraduationCap,
  Briefcase,
  Shirt,
  Fuel,
  Coffee,
  Gift,
  Phone,
  Zap,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Calendar,
  Settings,
  Calculator,
  Tag,
  Stethoscope,
  Dumbbell,
  Book,
  Music,
  Camera,
  Scissors,
  Wrench,
  Baby,
  PawPrint,
  Trees,
  Cigarette,
  Wine,
  Pill,
  Building,
  ShieldQuestion,
} from 'lucide-react'

export enum IconNames {
  // === EXPENSE CATEGORIES ===

  // Grundbedürfnisse (Basic Needs)
  SHOPPING_CART = 'shopping-cart', // Einkäufe
  HOME = 'home', // Wohnen/Miete
  UTENSILS = 'utensils', // Essen & Trinken
  COFFEE = 'coffee', // Café/Restaurant

  // Transport
  CAR = 'car', // Auto/Transport
  FUEL = 'fuel', // Benzin

  // Persönliche Ausgaben
  SHIRT = 'shirt', // Kleidung
  SCISSORS = 'scissors', // Friseur/Beauty
  HEART = 'heart', // Gesundheit
  STETHOSCOPE = 'stethoscope', // Arzt/Medical
  PILL = 'pill', // Medikamente

  // Unterhaltung & Freizeit
  GAMEPAD = 'gamepad2', // Unterhaltung
  MUSIC = 'music', // Musik/Streaming
  CAMERA = 'camera', // Hobby/Fotografie
  DUMBBELL = 'dumbbell', // Fitness/Sport
  BOOK = 'book', // Bücher/Bildung

  // Soziales & Familie
  GIFT = 'gift', // Geschenke
  BABY = 'baby', // Baby/Kinder
  PAW_PRINT = 'paw-print', // Haustiere

  // Reisen & Urlaub
  PLANE = 'plane', // Reisen

  // Bildung & Beruf
  GRADUATION_CAP = 'graduation-cap', // Bildung
  BRIEFCASE = 'briefcase', // Arbeit/Business

  // Kommunikation & Services
  PHONE = 'phone', // Telekommunikation
  ZAP = 'zap', // Strom/Utilities
  WRENCH = 'wrench', // Reparaturen/Services

  // Genussmittel
  WINE = 'wine', // Alkohol
  CIGARETTE = 'cigarette', // Tabak

  // Sonstiges
  TREES = 'trees', // Garten/Pflanzen
  CREDIT_CARD = 'credit-card', // Banking/Gebühren
  RECEIPT = 'receipt', // Sonstige Belege

  // === INCOME CATEGORIES ===
  DOLLAR_SIGN = 'dollar-sign', // Gehalt
  TRENDING_UP = 'trending-up', // Bonus/Zusatzeinkommen
  COINS = 'coins', // Trinkgeld/Kleineinkommen
  BUILDING = 'building', // Mieteinnahmen

  // === FINANCIAL MANAGEMENT ===
  WALLET = 'wallet', // Bargeld
  PIGGY_BANK = 'piggy-bank', // Sparen
  BANKNOTE = 'banknote', // Geldtransfer
  CALCULATOR = 'calculator', // Finanzplanung

  // === UI ICONS ===
  PLUS = 'plus',
  EDIT = 'edit',
  TRASH = 'trash2',
  SEARCH = 'search',
  FILTER = 'filter',
  CALENDAR = 'calendar',
  SETTINGS = 'settings',
  TAG = 'tag',

  // === MISC ===
  QUESTION_MARK = 'question-mark',
}

export const IconMap = {
  // Expense Categories
  [IconNames.SHOPPING_CART]: ShoppingCart,
  [IconNames.HOME]: Home,
  [IconNames.UTENSILS]: Utensils,
  [IconNames.COFFEE]: Coffee,
  [IconNames.CAR]: Car,
  [IconNames.FUEL]: Fuel,
  [IconNames.SHIRT]: Shirt,
  [IconNames.SCISSORS]: Scissors,
  [IconNames.HEART]: Heart,
  [IconNames.STETHOSCOPE]: Stethoscope,
  [IconNames.PILL]: Pill,
  [IconNames.GAMEPAD]: Gamepad2,
  [IconNames.MUSIC]: Music,
  [IconNames.CAMERA]: Camera,
  [IconNames.DUMBBELL]: Dumbbell,
  [IconNames.BOOK]: Book,
  [IconNames.GIFT]: Gift,
  [IconNames.BABY]: Baby,
  [IconNames.PAW_PRINT]: PawPrint,
  [IconNames.PLANE]: Plane,
  [IconNames.GRADUATION_CAP]: GraduationCap,
  [IconNames.BRIEFCASE]: Briefcase,
  [IconNames.PHONE]: Phone,
  [IconNames.ZAP]: Zap,
  [IconNames.WRENCH]: Wrench,
  [IconNames.WINE]: Wine,
  [IconNames.CIGARETTE]: Cigarette,
  [IconNames.TREES]: Trees,
  [IconNames.CREDIT_CARD]: CreditCard,
  [IconNames.RECEIPT]: Receipt,

  // Income Categories
  [IconNames.DOLLAR_SIGN]: DollarSign,
  [IconNames.TRENDING_UP]: TrendingUp,
  [IconNames.COINS]: Coins,
  [IconNames.BUILDING]: Building,

  // Financial Management
  [IconNames.WALLET]: Wallet,
  [IconNames.PIGGY_BANK]: PiggyBank,
  [IconNames.BANKNOTE]: Banknote,
  [IconNames.CALCULATOR]: Calculator,

  // UI Icons
  [IconNames.PLUS]: Plus,
  [IconNames.EDIT]: Edit,
  [IconNames.TRASH]: Trash2,
  [IconNames.SEARCH]: Search,
  [IconNames.FILTER]: Filter,
  [IconNames.CALENDAR]: Calendar,
  [IconNames.SETTINGS]: Settings,
  [IconNames.TAG]: Tag,

  // Misc
  [IconNames.QUESTION_MARK]: ShieldQuestion,
} as const

// Helper function to get an icon component by name
export const getIcon = (iconName: IconNames) => {
  return IconMap[iconName]
}

// Type for icon component
export type IconComponent = (typeof IconMap)[keyof typeof IconMap]

export const IconRender = ({
  iconName,
  className = 'w-4 h-4',
}: {
  iconName: IconNames | string
  className?: string
}) => {
  const IconComponent = getIcon(iconName as IconNames) || ShieldQuestion
  return <IconComponent className={className} />
}
