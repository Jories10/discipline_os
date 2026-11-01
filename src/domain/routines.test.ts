import { describe, expect, it } from 'vitest'
import { buildDefaultTemplates, buildInitialState } from './seed'
import { buildTemplate, instantiateTemplate, previewApply, shiftTasks, tasksToBlocks, templateDates } from './routines'
import { parsePersisted } from './migrate'
import { searchEntries, hasJournalContent } from './journal'
import { summarizeWeek } from './review'
import { diffDays } from './time'
import { persistedStateSchema, templateSchema, type JournalEntry, type Task } from './types'

const task = (o: Partial<Task> = {}): Task => ({
  id: 't', title: 'x', description: '', date: '2026-11-02', startMin: 420, endMin: 480,
  categoryId: 'c', priority: 'low', completed: false, completedAt: null, actualMinutes: null, createdAt: '', ...o,
})
const entry = (o: Partial<JournalEntry> = {}): JournalEntry => ({
  id: 'e', date: '2026-11-02', accomplished: '', learned: '', challenges: '', improve: '', thoughts: '', createdAt: '', updatedAt: '', ...o,
})

describe('templates', () => {
  it('ships valid default templates', () => {
    for (const t of buildDefaultTemplates()) expect(templateSchema.safeParse(t).success).toBe(true)
  })
  it('instantiates a week template onto Monday to Sunday with fresh ids and no completion', () => {
    const week = buildDefaultTemplates().find((t) => t.scope === 'week')!
    const tasks = instantiateTemplate(week, '2026-11-04') // a Wednesday
    expect(new Set(tasks.map((t) => t.date)).size).toBe(7)
    expect(Math.min(...tasks.map((t) => t.date === '2026-11-02' ? 0 : 1))).toBe(0)
    expect(new Set(tasks.map((t) => t.id)).size).toBe(tasks.length)
    expect(tasks.every((t) => !t.completed && t.actualMinutes === null)).toBe(true)
    expect(templateDates(week, '2026-11-04')).toHaveLength(7)
  })
  it('editing a template never changes tasks created from it', () => {
    const day = buildDefaultTemplates()[0]
    const tasks = instantiateTemplate(day, '2026-11-02')
    const edited = { ...day, days: [[{ ...day.days[0][0], title: 'Changed' }]] }
    expect(edited.days[0][0].title).toBe('Changed')
    expect(tasks[0].title).not.toBe('Changed')
  })
  it('builds a template from tasks in time order', () => {
    const blocks = tasksToBlocks([task({ id: 'b', startMin: 600, endMin: 660 }), task({ id: 'a' })])
    expect(blocks.map((b) => b.startMin)).toEqual([420, 600])
    expect(templateSchema.safeParse(buildTemplate('  Mine ', 'day', [blocks])).success).toBe(true)
  })
})

describe('applying plans', () => {
  const existing = [task({ id: 'done', completed: true }), task({ id: 'open', startMin: 600, endMin: 660 }), task({ id: 'other', date: '2026-11-03' })]
  const incoming = [task({ id: 'new', startMin: 420, endMin: 480 })]
  it('add mode removes nothing', () => {
    expect(previewApply(existing, incoming, ['2026-11-02'], 'add').removeIds).toEqual([])
  })
  it('replace mode removes only unfinished tasks on the target dates and keeps history', () => {
    const p = previewApply(existing, incoming, ['2026-11-02'], 'replace')
    expect(p.removeIds).toEqual(['open'])
    expect(p.keptCompleted).toBe(1)
    expect(p.overlaps).toBe(1) // overlaps the kept completed task
  })
  it('shifts copies by a week and resets completion', () => {
    const [copy] = shiftTasks([task({ completed: true, actualMinutes: 30 })], 7)
    expect(copy).toMatchObject({ date: '2026-11-09', completed: false, actualMinutes: null })
    expect(copy.id).not.toBe('t')
  })
  it('measures whole-day differences across month ends', () => {
    expect(diffDays('2026-10-26', '2026-11-02')).toBe(7)
    expect(diffDays('2026-11-02', '2026-10-26')).toBe(-7)
  })
})

describe('migration', () => {
  it('upgrades version 1 data and adds default templates', () => {
    const v1 = { version: 1, tasks: buildInitialState('2026-11-02').tasks, categories: buildInitialState('2026-11-02').categories }
    const v2 = parsePersisted(v1)
    expect(v2?.version).toBe(2)
    expect(v2?.templates.length).toBeGreaterThan(0)
    expect(v2?.journal).toEqual([])
    expect(persistedStateSchema.safeParse(v2).success).toBe(true)
  })
  it('rejects garbage', () => {
    expect(parsePersisted({ version: 9 })).toBeNull()
    expect(parsePersisted(null)).toBeNull()
  })
})

describe('journal and review', () => {
  it('searches any field, newest first', () => {
    const entries = [entry({ id: '1', date: '2026-11-01', learned: 'Closures' }), entry({ id: '2', date: '2026-11-03', challenges: 'closures again' }), entry({ id: '3' })]
    expect(searchEntries(entries, 'CLOSURES').map((e) => e.id)).toEqual(['2', '1'])
    expect(searchEntries(entries, '').map((e) => e.id)).toEqual(['2', '3', '1'])
  })
  it('detects empty entries', () => {
    expect(hasJournalContent(entry({ thoughts: '   ' }))).toBe(false)
    expect(hasJournalContent(entry({ thoughts: 'ok' }))).toBe(true)
  })
  it('summarizes a week from real data', () => {
    const tasks = [task({ id: 'a', completed: true }), task({ id: 'b', startMin: 600, endMin: 660 }), task({ id: 'c', date: '2026-12-01' })]
    const s = summarizeWeek(tasks, [entry({ thoughts: 'x' }), entry({ id: 'f', date: '2026-12-01', thoughts: 'y' })], '2026-11-04', '2026-11-04', 0)
    expect(s.stats).toMatchObject({ total: 2, completed: 1, missed: 1, percent: 50 })
    expect(s.missed.map((t) => t.id)).toEqual(['b'])
    expect(s.byCategory[0]).toMatchObject({ total: 2, completed: 1 })
    expect(s.journalDays).toBe(1)
  })
})
