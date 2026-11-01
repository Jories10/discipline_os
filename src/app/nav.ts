import { BarChart3, BookOpen, CalendarDays, LayoutDashboard, ListChecks, Repeat, Settings, type LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string
  label: string
  short: string
  icon: LucideIcon
  end: boolean
  /** Shown directly in the mobile bottom bar; the rest live under "More". */
  primary: boolean
}

export const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', short: 'Home', icon: LayoutDashboard, end: true, primary: true },
  { to: '/planner', label: 'Weekly Planner', short: 'Planner', icon: CalendarDays, end: false, primary: true },
  { to: '/tasks', label: 'My Tasks', short: 'Tasks', icon: ListChecks, end: false, primary: true },
  { to: '/analytics', label: 'Analytics', short: 'Stats', icon: BarChart3, end: false, primary: false },
  { to: '/journal', label: 'Daily Journal', short: 'Journal', icon: BookOpen, end: false, primary: true },
  { to: '/templates', label: 'Routine Templates', short: 'Routines', icon: Repeat, end: false, primary: false },
  { to: '/settings', label: 'Settings', short: 'Settings', icon: Settings, end: false, primary: false },
]

export const isActivePath = (item: NavItem, pathname: string) => (item.end ? pathname === item.to : pathname.startsWith(item.to))
