import type { DayPeriod, Task, TaskStatus } from './types'

export const NOON = 12 * 60
export const SIX_PM = 18 * 60
export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const

const pad = (n: number) => String(n).padStart(2, '0')

export const toISODate = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** Parses as a local date (never UTC), avoiding off-by-one-day bugs. */
export const parseISODate = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const addDays = (iso: string, days: number): string => {
  const d = parseISODate(iso)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

/** Weeks run Monday to Sunday. */
export const startOfWeek = (iso: string): string => {
  const offset = (parseISODate(iso).getDay() + 6) % 7
  return addDays(iso, -offset)
}

export const weekDates = (anyDateInWeek: string): string[] => {
  const monday = startOfWeek(anyDateInWeek)
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

/** Whole days from a to b (positive when b is later). Rounded so DST shifts cannot cause off-by-one. */
export const diffDays = (a: string, b: string): number =>
  Math.round((parseISODate(b).getTime() - parseISODate(a).getTime()) / 86_400_000)

export const dayName = (iso: string): string => DAY_NAMES[(parseISODate(iso).getDay() + 6) % 7]

export const toInputTime = (min: number): string => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`

export const fromInputTime = (value: string): number => {
  const [h, m] = value.split(':').map(Number)
  return h * 60 + m
}

export const minutesOfDay = (d: Date): number => d.getHours() * 60 + d.getMinutes()

export const periodOf = (startMin: number): DayPeriod =>
  startMin < NOON ? 'morning' : startMin < SIX_PM ? 'afternoon' : 'evening'

export const formatTime = (min: number): string => {
  const h24 = Math.floor(min / 60) % 24
  const suffix = h24 >= 12 ? 'PM' : 'AM'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h12}:${pad(min % 60)} ${suffix}`
}

export const formatDuration = (min: number): string => {
  const h = Math.floor(min / 60)
  const m = min % 60
  return [h ? `${h}h` : '', m ? `${m}m` : ''].filter(Boolean).join(' ') || '0m'
}

type Span = Pick<Task, 'startMin' | 'endMin'>

/** Half-open intervals: a task ending at 7:00 does not overlap one starting at 7:00. */
export const overlaps = (a: Span, b: Span): boolean => a.startMin < b.endMin && b.startMin < a.endMin

export const findOverlaps = (candidate: Pick<Task, 'id' | 'date' | 'startMin' | 'endMin'>, existing: Task[]): Task[] =>
  existing.filter((t) => t.id !== candidate.id && t.date === candidate.date && overlaps(candidate, t))

/** Status is derived at read time so it can never go stale in storage. */
export const taskStatus = (task: Task, todayISO: string, nowMin: number): TaskStatus => {
  if (task.completed) return 'completed'
  if (task.date < todayISO) return 'missed'
  if (task.date > todayISO) return 'upcoming'
  if (nowMin >= task.endMin) return 'missed'
  if (nowMin >= task.startMin) return 'current'
  return 'upcoming'
}

export const sortByTime = (tasks: Task[]): Task[] =>
  [...tasks].sort((a, b) => a.date.localeCompare(b.date) || a.startMin - b.startMin || a.endMin - b.endMin)

export const formatLongDate = (iso: string): string =>
  parseISODate(iso).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

export const formatShortDate = (iso: string): string =>
  parseISODate(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
