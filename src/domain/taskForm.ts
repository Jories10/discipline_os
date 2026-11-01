import { z } from 'zod'
import { findOverlaps, fromInputTime, toInputTime } from './time'
import { prioritySchema, type Task, type TemplateBlock } from './types'

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const baseFields = {
  title: z.string().trim().min(1, 'Give it a title').max(120, 'Keep the title under 120 characters'),
  description: z.string().max(2000, 'Keep the description under 2000 characters'),
  start: z.string().regex(TIME_RE, 'Enter a start time'),
  end: z.string().regex(TIME_RE, 'Enter an end time'),
  categoryId: z.string().min(1, 'Choose a category'),
  priority: prioritySchema,
}

const endAfterStart = (v: { start: string; end: string }, ctx: z.RefinementCtx) => {
  if (fromInputTime(v.end) <= fromInputTime(v.start)) {
    ctx.addIssue({ code: 'custom', path: ['end'], message: 'End time must be after the start time' })
  }
}

export const taskFormSchema = z
  .object({
    ...baseFields,
    date: z.string().regex(DATE_RE, 'Choose a date'),
    /** Real focused minutes, kept as text so an empty box means "not recorded". */
    actual: z.string().regex(/^\d{0,4}$/, 'Use whole minutes'),
  })
  .superRefine(endAfterStart)

export const blockFormSchema = z.object(baseFields).superRefine(endAfterStart)

export type TaskFormValues = z.infer<typeof taskFormSchema>
export type BlockFormValues = z.infer<typeof blockFormSchema>
export type TaskFields = Pick<Task, 'title' | 'description' | 'date' | 'startMin' | 'endMin' | 'categoryId' | 'priority'>

export const formToFields = (v: TaskFormValues): TaskFields => ({
  title: v.title.trim(),
  description: v.description.trim(),
  date: v.date,
  startMin: fromInputTime(v.start),
  endMin: fromInputTime(v.end),
  categoryId: v.categoryId,
  priority: v.priority,
})

export const formToActual = (v: TaskFormValues): number | null => (v.actual === '' ? null : Number(v.actual))

export const fieldsToForm = (f: TaskFields, actualMinutes: number | null = null): TaskFormValues => ({
  title: f.title,
  description: f.description,
  date: f.date,
  start: toInputTime(f.startMin),
  end: toInputTime(Math.min(f.endMin, 1439)),
  categoryId: f.categoryId,
  priority: f.priority,
  actual: actualMinutes === null ? '' : String(actualMinutes),
})

export const blockToForm = (b: TemplateBlock): BlockFormValues => ({
  title: b.title,
  description: b.description,
  start: toInputTime(b.startMin),
  end: toInputTime(Math.min(b.endMin, 1439)),
  categoryId: b.categoryId,
  priority: b.priority,
})

export const formToBlock = (v: BlockFormValues): TemplateBlock => ({
  title: v.title.trim(),
  description: v.description.trim(),
  startMin: fromInputTime(v.start),
  endMin: fromInputTime(v.end),
  categoryId: v.categoryId,
  priority: v.priority,
})

/** Live overlap check while the form is still being typed: returns [] until the times are valid. */
export const conflictsFor = (v: Pick<TaskFormValues, 'date' | 'start' | 'end'>, id: string, tasks: Task[]): Task[] => {
  if (!DATE_RE.test(v.date) || !TIME_RE.test(v.start) || !TIME_RE.test(v.end)) return []
  const startMin = fromInputTime(v.start)
  const endMin = fromInputTime(v.end)
  if (endMin <= startMin) return []
  return findOverlaps({ id, date: v.date, startMin, endMin }, tasks)
}
