import { describe, expect, it } from 'vitest'
import { addDays, findOverlaps, formatTime, overlaps, periodOf, startOfWeek, taskStatus, weekDates } from './time'
import { computeStats } from './stats'
import { buildInitialState } from './seed'
import { persistedStateSchema, type Task } from './types'

const task = (over: Partial<Task> = {}): Task => ({
  id: 't', title: 'x', description: '', date: '2026-11-02', startMin: 420, endMin: 480,
  categoryId: 'c', priority: 'low', completed: false, completedAt: null, actualMinutes: null,
  createdAt: '', ...over,
})

describe('time utils', () => {
  it('starts weeks on Monday, including Sundays', () => {
    expect(startOfWeek('2026-11-01')).toBe('2026-10-26')
    expect(startOfWeek('2026-11-02')).toBe('2026-11-02')
    expect(weekDates('2026-10-31')).toHaveLength(7)
  })
  it('adds days across month boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
  })
  it('derives the period from start time', () => {
    expect(periodOf(359)).toBe('morning')
    expect(periodOf(720)).toBe('afternoon')
    expect(periodOf(1080)).toBe('evening')
  })
  it('formats 12-hour times', () => {
    expect(formatTime(0)).toBe('12:00 AM')
    expect(formatTime(13 * 60 + 5)).toBe('1:05 PM')
  })
  it('treats back-to-back tasks as non-overlapping', () => {
    expect(overlaps(task({ startMin: 360, endMin: 420 }), task({ startMin: 420, endMin: 480 }))).toBe(false)
    expect(overlaps(task({ startMin: 360, endMin: 430 }), task({ startMin: 420, endMin: 480 }))).toBe(true)
  })
  it('ignores itself and other dates when finding overlaps', () => {
    const a = task({ id: 'a' })
    expect(findOverlaps(a, [a, task({ id: 'b', date: '2026-11-03' }), task({ id: 'c' })]).map((t) => t.id)).toEqual(['c'])
  })
})

describe('task status', () => {
  const today = '2026-11-02'
  it('derives status from the clock', () => {
    expect(taskStatus(task(), today, 400)).toBe('upcoming')
    expect(taskStatus(task(), today, 450)).toBe('current')
    expect(taskStatus(task(), today, 480)).toBe('missed')
    expect(taskStatus(task({ completed: true }), today, 600)).toBe('completed')
    expect(taskStatus(task({ date: '2026-11-01' }), today, 0)).toBe('missed')
    expect(taskStatus(task({ date: '2026-11-03' }), today, 900)).toBe('upcoming')
  })
})

describe('stats and seed', () => {
  it('computes completion from real tasks', () => {
    const s = computeStats([task({ completed: true }), task({ id: 'b' })], '2026-11-02', 400)
    expect(s).toMatchObject({ total: 2, completed: 1, pending: 1, percent: 50, scheduledMinutes: 120 })
  })
  it('seeds a valid state with no overlaps', () => {
    const state = buildInitialState('2026-10-31')
    expect(persistedStateSchema.safeParse(state).success).toBe(true)
    for (const t of state.tasks) expect(findOverlaps(t, state.tasks)).toEqual([])
    expect(state.tasks.filter((t) => t.date === '2026-10-26')[0].startMin).toBe(360)
  })
})
