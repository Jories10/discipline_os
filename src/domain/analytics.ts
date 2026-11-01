import { computeStats } from './stats'
import { addDays, dayName, DAY_NAMES, formatShortDate, parseISODate, startOfWeek, taskStatus, weekDates } from './time'
import type { Task } from './types'

const duration = (t: Task) => t.endMin - t.startMin
const sum = (nums: number[]) => nums.reduce((a, b) => a + b, 0)

/** Real focused time only counts what the user entered; it is never estimated from the schedule. */
const focusOf = (tasks: Task[]) => {
  const tracked = tasks.filter((t) => t.actualMinutes !== null)
  return { focusedMin: sum(tracked.map((t) => t.actualMinutes ?? 0)), trackedCount: tracked.length }
}

export interface DayPoint {
  date: string
  label: string
  total: number
  completed: number
  missed: number
  pending: number
  /** null when nothing is scheduled or the day hasn't started, so charts show a gap instead of a fake 0%. */
  percent: number | null
  scheduledMin: number
  completedMin: number
  focusedMin: number
  trackedCount: number
}

export const buildDayPoints = (tasks: Task[], anyDateInWeek: string, todayISO: string, nowMin: number): DayPoint[] =>
  weekDates(anyDateInWeek).map((date) => {
    const dayTasks = tasks.filter((t) => t.date === date)
    const s = computeStats(dayTasks, todayISO, nowMin)
    return {
      date,
      label: dayName(date).slice(0, 3),
      total: s.total,
      completed: s.completed,
      missed: s.missed,
      pending: s.pending,
      percent: s.total === 0 || date > todayISO ? null : s.percent,
      scheduledMin: s.scheduledMinutes,
      completedMin: sum(dayTasks.filter((t) => t.completed).map(duration)),
      ...focusOf(dayTasks),
    }
  })

export interface WeekPoint {
  weekStart: string
  label: string
  total: number
  completed: number
  percent: number | null
}

/** The last `count` weeks, oldest first, ending with the current week. */
export const buildWeekPoints = (tasks: Task[], todayISO: string, nowMin: number, count = 12): WeekPoint[] =>
  Array.from({ length: count }, (_, i) => {
    const weekStart = addDays(startOfWeek(todayISO), -7 * (count - 1 - i))
    const dates = new Set(weekDates(weekStart))
    const s = computeStats(tasks.filter((t) => dates.has(t.date)), todayISO, nowMin)
    return { weekStart, label: formatShortDate(weekStart), total: s.total, completed: s.completed, percent: s.total === 0 ? null : s.percent }
  })

export interface CategoryPoint {
  categoryId: string
  total: number
  completed: number
  percent: number
  scheduledMin: number
  completedMin: number
}

export const buildCategoryPoints = (tasks: Task[], anyDateInWeek: string): CategoryPoint[] => {
  const dates = new Set(weekDates(anyDateInWeek))
  const map = new Map<string, CategoryPoint>()
  for (const t of tasks) {
    if (!dates.has(t.date)) continue
    const c = map.get(t.categoryId) ?? { categoryId: t.categoryId, total: 0, completed: 0, percent: 0, scheduledMin: 0, completedMin: 0 }
    c.total++
    c.scheduledMin += duration(t)
    if (t.completed) {
      c.completed++
      c.completedMin += duration(t)
    }
    map.set(t.categoryId, c)
  }
  return [...map.values()]
    .map((c) => ({ ...c, percent: Math.round((c.completed / c.total) * 100) }))
    .sort((a, b) => b.scheduledMin - a.scheduledMin)
}

/** Most tasks completed; ties go to more completed time. Needs at least one completion. */
export const mostProductiveDay = (days: DayPoint[]): DayPoint | null => {
  const best = [...days].sort((a, b) => b.completed - a.completed || b.completedMin - a.completedMin)[0]
  return best && best.completed > 0 ? best : null
}

export interface WeekdayPattern {
  weekday: string
  avgPercent: number | null
  days: number
}

/** Average completion per weekday over finished days (today is excluded because it is still in progress). */
export const weekdayPattern = (tasks: Task[], todayISO: string, weeks = 12): WeekdayPattern[] => {
  const start = addDays(startOfWeek(todayISO), -7 * (weeks - 1))
  const byDate = new Map<string, Task[]>()
  for (const t of tasks) {
    if (t.date >= start && t.date < todayISO) byDate.set(t.date, [...(byDate.get(t.date) ?? []), t])
  }
  const acc = DAY_NAMES.map(() => ({ sum: 0, n: 0 }))
  for (const [date, list] of byDate) {
    const i = (parseISODate(date).getDay() + 6) % 7
    acc[i].sum += (list.filter((t) => t.completed).length / list.length) * 100
    acc[i].n++
  }
  return DAY_NAMES.map((name, i) => ({ weekday: name.slice(0, 3), avgPercent: acc[i].n ? Math.round(acc[i].sum / acc[i].n) : null, days: acc[i].n }))
}

const completedDates = (tasks: Task[]) => new Set(tasks.filter((t) => t.completed).map((t) => t.date))

/** Consecutive days with at least one completed task. A day that hasn't produced one yet doesn't break the streak. */
export const activeStreak = (tasks: Task[], todayISO: string): number => {
  const done = completedDates(tasks)
  let day = done.has(todayISO) ? todayISO : addDays(todayISO, -1)
  let n = 0
  while (done.has(day)) {
    n++
    day = addDays(day, -1)
  }
  return n
}

export const activeDaysInLast = (tasks: Task[], todayISO: string, days = 28): number => {
  const done = completedDates(tasks)
  return Array.from({ length: days }, (_, i) => addDays(todayISO, -i)).filter((d) => done.has(d)).length
}

export interface MissedCount {
  title: string
  count: number
}

export const mostMissed = (tasks: Task[], todayISO: string, nowMin: number, weeks = 12, limit = 5): MissedCount[] => {
  const start = addDays(startOfWeek(todayISO), -7 * (weeks - 1))
  const counts = new Map<string, MissedCount>()
  for (const t of tasks) {
    if (t.date < start || taskStatus(t, todayISO, nowMin) !== 'missed') continue
    const key = t.title.trim().toLowerCase()
    const entry = counts.get(key) ?? { title: t.title.trim(), count: 0 }
    entry.count++
    counts.set(key, entry)
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.title.localeCompare(b.title)).slice(0, limit)
}

export const toHours = (minutes: number): number => Math.round(minutes / 6) / 10
