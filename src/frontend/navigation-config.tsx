import {
  Home,
  ChartNoAxesCombined,
  TableProperties,
  CalendarClock,
} from 'lucide-react'

export enum TabValues {
  OVERVIEW = 'overview',
  CHARTS = 'graphs',
  TABLE = 'table',
  SCHEDULED = 'scheduled-entries',
}

export const navItems = [
  {
    title: 'Überblick',
    url: '/overview',
    icon: Home,
    value: TabValues.OVERVIEW,
  },
  {
    title: 'Finanzanalysen',
    url: '/graphs',
    icon: ChartNoAxesCombined,
    value: TabValues.CHARTS,
  },
  {
    title: 'Belegübersicht',
    url: '/table',
    icon: TableProperties,
    value: TabValues.TABLE,
  },
  {
    title: 'Daueraufträge',
    url: '/scheduled-entries',
    icon: CalendarClock,
    value: TabValues.SCHEDULED,
  },
]
