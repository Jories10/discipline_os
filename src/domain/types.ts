import { z } from 'zod'

/** Dates are local calendar dates "YYYY-MM-DD". Times are minutes since midnight. */
export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
export const minutesSchema = z.number().int().min(0).max(1440)

export const prioritySchema = z.enum(['low', 'medium', 'high'])

export const categorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(60),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  purpose: z.string().max(200).default(''),
})

export const taskSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().trim().min(1).max(120),
    description: z.string().max(2000).default(''),
    date: isoDateSchema,
    startMin: minutesSchema,
    endMin: minutesSchema,
    categoryId: z.string().min(1),
    priority: prioritySchema,
    completed: z.boolean(),
    completedAt: z.string().nullable().default(null),
    /** Real focused time in minutes; optional, entered when editing a task. */
    actualMinutes: z.number().int().min(0).nullable().default(null),
    createdAt: z.string(),
  })
  .refine((t) => t.endMin > t.startMin, { message: 'End must be after start', path: ['endMin'] })

/** A template block is a task without a date or completion state. Templates are copied, never linked, to tasks. */
export const templateBlockSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    description: z.string().max(2000).default(''),
    startMin: minutesSchema,
    endMin: minutesSchema,
    categoryId: z.string().min(1),
    priority: prioritySchema,
  })
  .refine((b) => b.endMin > b.startMin, { message: 'End must be after start', path: ['endMin'] })

/** A "day" template has one list of blocks; a "week" template has seven (Monday to Sunday). */
export const templateSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().trim().min(1).max(60),
    description: z.string().max(300).default(''),
    scope: z.enum(['day', 'week']),
    days: z.array(z.array(templateBlockSchema)).min(1).max(7),
    createdAt: z.string(),
  })
  .refine((t) => t.days.length === (t.scope === 'day' ? 1 : 7), { message: 'Wrong number of days for scope', path: ['days'] })

const journalText = z.string().max(5000).default('')
export const journalEntrySchema = z.object({
  id: z.string().min(1),
  date: isoDateSchema,
  accomplished: journalText,
  learned: journalText,
  challenges: journalText,
  improve: journalText,
  thoughts: journalText,
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const persistedStateSchema = z.object({
  version: z.literal(2),
  tasks: z.array(taskSchema),
  categories: z.array(categorySchema),
  templates: z.array(templateSchema),
  journal: z.array(journalEntrySchema),
})

/** Version 1 (Phases 1 and 2) had no templates or journal; migrate.ts upgrades it. */
export const legacyStateSchemaV1 = z.object({
  version: z.literal(1),
  tasks: z.array(taskSchema),
  categories: z.array(categorySchema),
})

export type Priority = z.infer<typeof prioritySchema>
export type Category = z.infer<typeof categorySchema>
export type Task = z.infer<typeof taskSchema>
export type TemplateBlock = z.infer<typeof templateBlockSchema>
export type Template = z.infer<typeof templateSchema>
export type JournalEntry = z.infer<typeof journalEntrySchema>
export type JournalFields = Pick<JournalEntry, 'accomplished' | 'learned' | 'challenges' | 'improve' | 'thoughts'>
export type PersistedState = z.infer<typeof persistedStateSchema>

export type DayPeriod = 'morning' | 'afternoon' | 'evening'
export type TaskStatus = 'completed' | 'current' | 'upcoming' | 'missed'
