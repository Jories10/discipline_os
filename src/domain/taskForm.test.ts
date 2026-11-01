import { describe, expect, it } from 'vitest'
import { conflictsFor, fieldsToForm, formToFields, taskFormSchema } from './taskForm'
import { DEFAULT_FILTERS, filterTasks } from './filters'
import type { Task } from './types'

const base = { title: ' Study ', description: '', date: '2026-11-02', start: '07:00', end: '08:30', categoryId: 'c', priority: 'high' as const, actual: '' }
const task = (o: Partial<Task> = {}): Task => ({
  id: 't', title: 'Read docs', description: 'TypeScript handbook', date: '2026-11-02', startMin: 420, endMin: 480,
  categoryId: 'c', priority: 'low', completed: false, completedAt: null, actualMinutes: null, createdAt: '', ...o,
})

describe('task form', () => {
  it('accepts valid input and converts it to minutes', () => {
    const r = taskFormSchema.safeParse(base)
    expect(r.success).toBe(true)
    expect(formToFields(base)).toMatchObject({ title: 'Study', startMin: 420, endMin: 510 })
  })
  it('rejects empty titles and end times that are not after start', () => {
    expect(taskFormSchema.safeParse({ ...base, title: '   ' }).success).toBe(false)
    const r = taskFormSchema.safeParse({ ...base, end: '07:00' })
    expect(!r.success && r.error.issues[0].path).toEqual(['end'])
  })
  it('round-trips fields through the form', () => {
    const f = formToFields(base)
    expect(formToFields(fieldsToForm(f))).toEqual(f)
  })
  it('finds conflicts, ignoring the task being edited and invalid input', () => {
    const tasks = [task({ id: 'a' }), task({ id: 'b', startMin: 600, endMin: 660 })]
    expect(conflictsFor(base, 'new', tasks).map((t) => t.id)).toEqual(['a'])
    expect(conflictsFor(base, 'a', tasks)).toEqual([])
    expect(conflictsFor({ ...base, end: '' }, 'new', tasks)).toEqual([])
  })
})

describe('filters', () => {
  const tasks = [task({ id: 'a' }), task({ id: 'b', title: 'Gym', description: '', categoryId: 'd', date: '2026-12-25' })]
  it('searches title and description, case-insensitively', () => {
    expect(filterTasks(tasks, { ...DEFAULT_FILTERS, range: 'all', query: 'HANDBOOK' }, '2026-11-02', 0).map((t) => t.id)).toEqual(['a'])
  })
  it('limits to the current week by default and filters by category', () => {
    expect(filterTasks(tasks, DEFAULT_FILTERS, '2026-11-02', 0).map((t) => t.id)).toEqual(['a'])
    expect(filterTasks(tasks, { ...DEFAULT_FILTERS, range: 'all', categoryId: 'd' }, '2026-11-02', 0).map((t) => t.id)).toEqual(['b'])
  })
  it('filters by derived status', () => {
    expect(filterTasks(tasks, { ...DEFAULT_FILTERS, range: 'all', status: 'missed' }, '2026-11-02', 900).map((t) => t.id)).toEqual(['a'])
  })
})
