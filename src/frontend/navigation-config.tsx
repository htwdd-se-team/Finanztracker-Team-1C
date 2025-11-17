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
    title: 'Terminüberweisungen',
    url: '/scheduled-entries',
    icon: CalendarClock,
    value: TabValues.SCHEDULED,
  },
]
