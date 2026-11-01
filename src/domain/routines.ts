import { addDays, findOverlaps, sortByTime, startOfWeek, weekDates } from './time'
import type { Task, Template, TemplateBlock } from './types'

export type ApplyMode = 'add' | 'replace'

const newId = () => crypto.randomUUID()
const now = () => new Date().toISOString()

export const tasksToBlocks = (tasks: Task[]): TemplateBlock[] =>
  sortByTime(tasks).map((t) => ({
    title: t.title,
    description: t.description,
    startMin: t.startMin,
    endMin: t.endMin,
    categoryId: t.categoryId,
    priority: t.priority,
  }))

export const buildTemplate = (name: string, scope: Template['scope'], days: TemplateBlock[][], description = ''): Template => ({
  id: newId(),
  name: name.trim(),
  description: description.trim(),
  scope,
  days,
  createdAt: now(),
})

const blocksToTasks = (blocks: TemplateBlock[], date: string): Task[] =>
  blocks.map((b) => ({ ...b, id: newId(), date, completed: false, completedAt: null, actualMinutes: null, createdAt: now() }))

/** Templates are copied into fresh tasks, so editing a template never touches tasks already scheduled. */
export const instantiateTemplate = (template: Template, targetDate: string): Task[] => {
  if (template.scope === 'day') return blocksToTasks(template.days[0], targetDate)
  const dates = weekDates(targetDate)
  return template.days.flatMap((blocks, i) => blocksToTasks(blocks, dates[i]))
}

export const templateDates = (template: Template, targetDate: string): string[] =>
  template.scope === 'day' ? [targetDate] : weekDates(targetDate)

export const templateMinutes = (template: Template): number =>
  template.days.reduce((sum, day) => sum + day.reduce((s, b) => s + (b.endMin - b.startMin), 0), 0)

export const templateBlockCount = (template: Template): number => template.days.reduce((n, d) => n + d.length, 0)

/** Copies tasks forward or backward by whole days, resetting completion so history is never rewritten. */
export const shiftTasks = (tasks: Task[], offsetDays: number): Task[] =>
  tasks.map((t) => ({
    ...t,
    id: newId(),
    date: addDays(t.date, offsetDays),
    completed: false,
    completedAt: null,
    actualMinutes: null,
    createdAt: now(),
  }))

export interface ApplyPreview {
  removeIds: string[]
  add: Task[]
  existingOnDates: number
  keptCompleted: number
  /** Incoming tasks that would overlap something that stays on the calendar. */
  overlaps: number
}

/**
 * "replace" only removes unfinished tasks on the target dates. Completed tasks are history and are always kept.
 */
export const previewApply = (existing: Task[], incoming: Task[], dates: string[], mode: ApplyMode): ApplyPreview => {
  const dateSet = new Set(dates)
  const onDates = existing.filter((t) => dateSet.has(t.date))
  const removeIds = mode === 'replace' ? onDates.filter((t) => !t.completed).map((t) => t.id) : []
  const removed = new Set(removeIds)
  const remaining = onDates.filter((t) => !removed.has(t.id))
  return {
    removeIds,
    add: incoming,
    existingOnDates: onDates.length,
    keptCompleted: onDates.filter((t) => t.completed).length,
    overlaps: incoming.filter((t) => findOverlaps(t, remaining).length > 0).length,
  }
}

export const currentWeekStart = (todayISO: string) => startOfWeek(todayISO)
