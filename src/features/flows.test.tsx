// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import ErrorBoundary from '@/components/ErrorBoundary'
import { buildInitialState } from '@/domain/seed'
import type { TaskFields } from '@/domain/taskForm'
import { addDays, dayName, toISODate, weekDates } from '@/domain/time'
import { STORAGE_KEY } from '@/storage/storage'
import { useAppStore } from '@/stores/useAppStore'
import { useUiStore } from '@/stores/useUiStore'
import { renderApp, resetApp } from '@/test/utils'

const TODAY = toISODate(new Date())
const FUTURE = '2030-01-07'
const fields = (o: Partial<TaskFields> = {}): TaskFields => ({
  title: 'Existing', description: '', date: FUTURE, startMin: 540, endMin: 600, categoryId: 'cat-react', priority: 'medium', ...o,
})
const addTask = (o: Partial<TaskFields> = {}) => {
  act(() => useAppStore.getState().addTask(fields(o)))
  return useAppStore.getState().tasks.find((t) => t.title === (o.title ?? 'Existing'))!
}
const taskDialog = () => screen.findByRole('dialog', { hidden: true })
const titled = (title: string) => useAppStore.getState().tasks.filter((t) => t.title === title)

beforeEach(resetApp)

describe('task form', () => {
  it('adds a task', async () => {
    renderApp('/planner')
    act(() => useUiStore.getState().openCreate({ date: FUTURE }))
    const d = await taskDialog()
    fireEvent.change(within(d).getByLabelText('Title'), { target: { value: 'Write tests' } })
    fireEvent.click(within(d).getByRole('button', { name: 'Add task' }))
    await waitFor(() => expect(titled('Write tests')).toHaveLength(1))
    expect(titled('Write tests')[0].date).toBe(FUTURE)
    expect(useUiStore.getState().taskModal).toBeNull()
  })

  it('blocks an overlapping task until the override is ticked', async () => {
    addTask()
    renderApp('/planner')
    act(() => useUiStore.getState().openCreate({ date: FUTURE, startMin: 570, endMin: 630 }))
    const d = await taskDialog()
    fireEvent.change(within(d).getByLabelText('Title'), { target: { value: 'Overlapper' } })
    fireEvent.click(within(d).getByRole('button', { name: 'Add task' }))
    await within(d).findByText(/Tick the box above/)
    expect(titled('Overlapper')).toHaveLength(0)

    fireEvent.click(within(d).getByLabelText(/Schedule it anyway/))
    fireEvent.click(within(d).getByRole('button', { name: 'Add task' }))
    await waitFor(() => expect(titled('Overlapper')).toHaveLength(1))
  })

  it('edits and reschedules a task', async () => {
    const task = addTask({ title: 'Editable' })
    renderApp('/planner')
    act(() => useUiStore.getState().openEdit(task))
    const d = await taskDialog()
    fireEvent.change(within(d).getByLabelText('End'), { target: { value: '11:00' } })
    fireEvent.change(within(d).getByLabelText('Date'), { target: { value: '2030-01-08' } })
    fireEvent.change(within(d).getByLabelText(/Actual focused time/), { target: { value: '45' } })
    fireEvent.click(within(d).getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(titled('Editable')[0]).toMatchObject({ endMin: 660, date: '2030-01-08', actualMinutes: 45 }))
  })

  it('rejects an end time before the start time', async () => {
    renderApp('/planner')
    act(() => useUiStore.getState().openCreate({ date: FUTURE }))
    const d = await taskDialog()
    fireEvent.change(within(d).getByLabelText('Title'), { target: { value: 'Backwards' } })
    fireEvent.change(within(d).getByLabelText('End'), { target: { value: '08:00' } })
    fireEvent.click(within(d).getByRole('button', { name: 'Add task' }))
    expect(await within(d).findByText('End time must be after the start time')).toBeTruthy()
    expect(titled('Backwards')).toHaveLength(0)
  })

  it('requires confirmation before deleting', async () => {
    const task = addTask({ title: 'Doomed' })
    renderApp('/planner')
    act(() => useUiStore.getState().openEdit(task))
    fireEvent.click(within(await taskDialog()).getByRole('button', { name: 'Delete' }))
    expect(titled('Doomed')).toHaveLength(1) // nothing removed yet
    fireEvent.click(await screen.findByRole('button', { name: 'Delete task' }))
    await waitFor(() => expect(titled('Doomed')).toHaveLength(0))
  })
})

describe('task cards', () => {
  it('duplicates into the next day, prefilled', async () => {
    addTask({ title: 'Dup me', date: TODAY })
    renderApp('/tasks')
    // The week has more than one page of tasks, so find it the way a user would.
    fireEvent.change(await screen.findByLabelText('Search tasks'), { target: { value: 'Dup me' } })
    fireEvent.click(await screen.findByRole('button', { name: 'Duplicate Dup me' }))
    const d = await taskDialog()
    expect((within(d).getByLabelText('Date') as HTMLInputElement).value).toBe(addDays(TODAY, 1))
    expect((within(d).getByLabelText('Title') as HTMLInputElement).value).toBe('Dup me')
  })

  it('completes and reopens a task', async () => {
    addTask({ title: 'Mark me', date: TODAY, startMin: 1200, endMin: 1260 })
    renderApp('/')
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Complete Mark me' }))
    expect(titled('Mark me')[0].completed).toBe(true)
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Reopen Mark me' }))
    expect(titled('Mark me')[0].completed).toBe(false)
  })

  it('undoes and redoes planner task changes', async () => {
    addTask({ title: 'Undo me', date: TODAY })
    renderApp('/planner')
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Complete Undo me' }))
    expect(titled('Undo me')[0].completed).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Undo planner change' }))
    expect(titled('Undo me')[0].completed).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Redo planner change' }))
    expect(titled('Undo me')[0].completed).toBe(true)
  })

  it('focuses one day at a time and allows switching days', () => {
    renderApp('/planner')
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(7)
    expect(tabs.find((tab) => tab.getAttribute('aria-selected') === 'true')?.getAttribute('aria-label')).toContain(dayName(TODAY))
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1)

    const otherDay = weekDates(TODAY)[6]
    fireEvent.click(tabs[6])
    expect(screen.getByRole('tabpanel').getAttribute('aria-label')).toBe(`Tasks for ${dayName(otherDay)}`)
  })
})

describe('data safety', () => {
  it('replace keeps completed tasks and only removes unfinished ones', async () => {
    addTask({ title: 'Keep', startMin: 360, endMin: 375 })
    addTask({ title: 'Drop', startMin: 600, endMin: 660 })
    act(() => useAppStore.getState().toggleTask(titled('Keep')[0].id))
    renderApp('/')
    act(() => useUiStore.getState().openRoutine({ type: 'apply', templateId: 'tpl-weekday', targetDate: FUTURE }))
    fireEvent.click(await screen.findByRole('radio', { name: /Replace unfinished tasks/ }))
    fireEvent.click(await screen.findByRole('button', { name: 'Replace 1 and apply' }))
    await waitFor(() => expect(titled('Drop')).toHaveLength(0))
    expect(titled('Keep')).toHaveLength(1)
    expect(useAppStore.getState().tasks.filter((t) => t.date === FUTURE)).toHaveLength(13) // 12 from template + 1 kept
  })

  it('starts a week template by replacing unfinished tasks by default', async () => {
    addTask({ title: 'Old plan', date: FUTURE })
    renderApp('/planner')
    act(() => useUiStore.getState().openRoutine({ type: 'apply', templateId: 'tpl-week', targetDate: FUTURE, scope: 'week' }))

    expect((await screen.findByRole('radio', { name: /Replace unfinished tasks/ }) as HTMLInputElement).checked).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Replace 1 and apply' }))

    await waitFor(() => expect(titled('Old plan')).toHaveLength(0))
    expect(useAppStore.getState().tasks.filter((task) => task.date === FUTURE)).toHaveLength(12)
    fireEvent.click(screen.getByRole('button', { name: 'Undo planner change' }))
    await waitFor(() => expect(titled('Old plan')).toHaveLength(1))
    expect(useAppStore.getState().tasks.filter((task) => task.date === FUTURE)).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Redo planner change' }))
    await waitFor(() => expect(titled('Old plan')).toHaveLength(0))
  })

  it('moves tasks to another category before deleting one', async () => {
    const inJs = useAppStore.getState().tasks.filter((t) => t.categoryId === 'cat-js').length
    const inTs = useAppStore.getState().tasks.filter((t) => t.categoryId === 'cat-ts').length
    expect(inJs).toBeGreaterThan(0)
    renderApp('/settings')
    fireEvent.click(await screen.findByRole('button', { name: 'Delete JavaScript Learning' }))
    fireEvent.change(await screen.findByLabelText(/Move them to/), { target: { value: 'cat-ts' } })
    fireEvent.click(screen.getByRole('button', { name: 'Move tasks and delete' }))
    const s = useAppStore.getState()
    expect(s.categories.some((c) => c.id === 'cat-js')).toBe(false)
    expect(s.tasks.filter((t) => t.categoryId === 'cat-ts')).toHaveLength(inTs + inJs)
  })

  it('adopts changes from another tab without writing them back', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const other = { ...buildInitialState(TODAY), tasks: [] }
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: JSON.stringify(other) }))
    })
    expect(useAppStore.getState().tasks).toHaveLength(0)
    expect(setItem).not.toHaveBeenCalled()
    setItem.mockRestore()
  })

  it('ignores corrupt data from another tab', () => {
    const before = useAppStore.getState().tasks.length
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: '{not json' }))
    })
    expect(useAppStore.getState().tasks).toHaveLength(before)
  })
})

describe('error boundary', () => {
  it('shows a recoverable fallback instead of a blank screen', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    let shouldThrow = true
    const Boom = () => {
      if (shouldThrow) throw new Error('boom')
      return <p>recovered</p>
    }
    render(<ErrorBoundary><Boom /></ErrorBoundary>)
    expect(screen.getByRole('alert').textContent).toMatch(/Something went wrong/)
    shouldThrow = false
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(screen.getByText('recovered')).toBeTruthy()
    vi.restoreAllMocks()
  })
})
