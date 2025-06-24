import {
  Home,
  ChartNoAxesCombined,
  TableProperties,
  UserRoundCog,
} from 'lucide-react'

export enum TabValues {
  OVERVIEW = 'overview',
  CHARTS = 'graphs',
  TABLE = 'table',
  PROFILE = 'profile',
}

export const navItems = [
  {
    title: 'Übersicht',
    url: '/overview',
    icon: Home,
    value: TabValues.OVERVIEW,
  },
  {
    title: 'Graphen',
    url: '/graphs',
    icon: ChartNoAxesCombined,
    value: TabValues.CHARTS,
  },
  {
    title: 'Tabellen',
    url: '/table',
    icon: TableProperties,
    value: TabValues.TABLE,
  },
  {
    title: 'Profil',
    url: '/profile',
    icon: UserRoundCog,
    value: TabValues.PROFILE,
  },
]
