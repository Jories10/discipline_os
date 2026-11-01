import { taskStatus, weekDates } from './time'
import type { Priority, Task, TaskStatus } from './types'

export interface TaskFilters {
  query: string
  categoryId: string
  status: 'all' | TaskStatus
  priority: 'all' | Priority
  range: 'week' | 'all'
}

export const DEFAULT_FILTERS: TaskFilters = { query: '', categoryId: 'all', status: 'all', priority: 'all', range: 'week' }

export const filterTasks = (tasks: Task[], f: TaskFilters, todayISO: string, nowMin: number): Task[] => {
  const q = f.query.trim().toLowerCase()
  const week = f.range === 'week' ? new Set(weekDates(todayISO)) : null
  return tasks.filter(
    (t) =>
      (!week || week.has(t.date)) &&
      (f.categoryId === 'all' || t.categoryId === f.categoryId) &&
      (f.priority === 'all' || t.priority === f.priority) &&
      (f.status === 'all' || taskStatus(t, todayISO, nowMin) === f.status) &&
      (!q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)),
  )
}
