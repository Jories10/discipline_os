import { describe, expect, it } from 'vitest'
import { activeDaysInLast, activeStreak, buildCategoryPoints, buildDayPoints, buildWeekPoints, mostMissed, mostProductiveDay, toHours, weekdayPattern } from './analytics'
import type { Task } from './types'

// 2026-11-04 is a Wednesday.
const TODAY = '2026-11-04'
const task = (o: Partial<Task> = {}): Task => ({
  id: crypto.randomUUID(), title: 'x', description: '', date: '2026-11-02', startMin: 420, endMin: 480,
  categoryId: 'c', priority: 'low', completed: false, completedAt: null, actualMinutes: null, createdAt: '', ...o,
})

describe('day points', () => {
  const tasks = [
    task({ date: '2026-11-02', completed: true, actualMinutes: 50 }),
    task({ date: '2026-11-02' }),
    task({ date: '2026-11-03', completed: true }),
    task({ date: '2026-11-05' }),
  ]
  const days = buildDayPoints(tasks, TODAY, TODAY, 0)
  it('covers Monday to Sunday with real counts', () => {
    expect(days.map((d) => d.label)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
    expect(days[0]).toMatchObject({ total: 2, completed: 1, missed: 1, percent: 50, scheduledMin: 120, completedMin: 60 })
  })
  it('leaves gaps instead of fake zeros for empty and future days', () => {
    expect(days[2].percent).toBeNull() // Wednesday, nothing scheduled
    expect(days[3]).toMatchObject({ total: 1, percent: null }) // Thursday is in the future
  })
  it('counts only entered focus time and how many tasks were tracked', () => {
    expect(days[0]).toMatchObject({ focusedMin: 50, trackedCount: 1 })
    expect(days[1]).toMatchObject({ focusedMin: 0, trackedCount: 0 })
  })
  it('picks the most productive day by completions', () => {
    expect(mostProductiveDay(days)?.label).toBe('Mon')
    expect(mostProductiveDay(buildDayPoints([task()], TODAY, TODAY, 0))).toBeNull()
  })
})

describe('trends', () => {
  it('builds twelve weeks ending with the current one', () => {
    const weeks = buildWeekPoints([task({ completed: true })], TODAY, 0, 12)
    expect(weeks).toHaveLength(12)
    expect(weeks[11]).toMatchObject({ weekStart: '2026-11-02', total: 1, percent: 100 })
    expect(weeks[0].percent).toBeNull()
  })
  it('averages completion per weekday over finished days only', () => {
    const tasks = [
      task({ date: '2026-10-26', completed: true }), task({ date: '2026-10-26' }), // Mon 50%
      task({ date: '2026-11-02', completed: true }), // Mon 100%
      task({ date: TODAY, completed: true }), // today excluded
    ]
    const p = weekdayPattern(tasks, TODAY)
    expect(p[0]).toMatchObject({ weekday: 'Mon', avgPercent: 75, days: 2 })
    expect(p[2].avgPercent).toBeNull()
  })
  it('computes streaks without letting an unfinished today break them', () => {
    const tasks = [task({ date: '2026-11-03', completed: true }), task({ date: '2026-11-02', completed: true }), task({ date: '2026-10-30', completed: true })]
    expect(activeStreak(tasks, TODAY)).toBe(2)
    expect(activeStreak([...tasks, task({ date: TODAY, completed: true })], TODAY)).toBe(3)
    expect(activeStreak([], TODAY)).toBe(0)
    expect(activeDaysInLast(tasks, TODAY, 28)).toBe(3)
  })
  it('ranks the most often missed tasks, case-insensitively', () => {
    const tasks = [task({ title: 'Gym', date: '2026-11-02' }), task({ title: 'gym ', date: '2026-11-03' }), task({ title: 'Read', date: '2026-11-02' }), task({ title: 'Done', completed: true })]
    expect(mostMissed(tasks, TODAY, 0)).toEqual([{ title: 'Gym', count: 2 }, { title: 'Read', count: 1 }])
  })
})

describe('categories and units', () => {
  it('breaks the week down by category, largest first', () => {
    const tasks = [task({ categoryId: 'a', completed: true }), task({ categoryId: 'a' }), task({ categoryId: 'b', startMin: 0, endMin: 600 }), task({ categoryId: 'a', date: '2026-12-25' })]
    const c = buildCategoryPoints(tasks, TODAY)
    expect(c.map((x) => x.categoryId)).toEqual(['b', 'a'])
    expect(c[1]).toMatchObject({ total: 2, completed: 1, percent: 50, completedMin: 60 })
  })
  it('converts minutes to one-decimal hours', () => {
    expect(toHours(90)).toBe(1.5)
    expect(toHours(100)).toBe(1.7)
  })
})
