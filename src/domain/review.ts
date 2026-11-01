import { hasJournalContent } from './journal'
import { computeStats, type DayStats } from './stats'
import { taskStatus, weekDates, sortByTime } from './time'
import type { JournalEntry, Task } from './types'

export interface CategoryBreakdown {
  categoryId: string
  total: number
  completed: number
  scheduledMinutes: number
}

export interface WeekSummary {
  weekStart: string
  dates: string[]
  stats: DayStats
  byDay: { date: string; stats: DayStats }[]
  byCategory: CategoryBreakdown[]
  missed: Task[]
  journalDays: number
}

export const summarizeWeek = (
  tasks: Task[],
  journal: JournalEntry[],
  anyDateInWeek: string,
  todayISO: string,
  nowMin: number,
): WeekSummary => {
  const dates = weekDates(anyDateInWeek)
  const dateSet = new Set(dates)
  const weekTasks = tasks.filter((t) => dateSet.has(t.date))

  const categories = new Map<string, CategoryBreakdown>()
  for (const t of weekTasks) {
    const c = categories.get(t.categoryId) ?? { categoryId: t.categoryId, total: 0, completed: 0, scheduledMinutes: 0 }
    c.total++
    if (t.completed) c.completed++
    c.scheduledMinutes += t.endMin - t.startMin
    categories.set(t.categoryId, c)
  }

  return {
    weekStart: dates[0],
    dates,
    stats: computeStats(weekTasks, todayISO, nowMin),
    byDay: dates.map((date) => ({ date, stats: computeStats(weekTasks.filter((t) => t.date === date), todayISO, nowMin) })),
    byCategory: [...categories.values()].sort((a, b) => b.total - a.total),
    missed: sortByTime(weekTasks.filter((t) => taskStatus(t, todayISO, nowMin) === 'missed')),
    journalDays: journal.filter((e) => dateSet.has(e.date) && hasJournalContent(e)).length,
  }
}
