// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { useAppStore } from '@/stores/useAppStore'
import { renderApp, resetApp } from '@/test/utils'

beforeEach(resetApp)

describe('every page renders from seeded data', () => {
  it.each([
    ['/', "Today's timeline"],
    ['/planner', 'Weekly Planner'],
    ['/tasks', 'My Tasks'],
    ['/analytics', 'Analytics'],
    ['/journal', 'Daily Journal'],
    ['/templates', 'Routine Templates'],
    ['/settings', 'Settings'],
  ])('%s', async (path, heading) => {
    renderApp(path)
    expect((await screen.findAllByRole('heading', { name: heading })).length).toBeGreaterThan(0)
  })

  it('sends unknown routes to the dashboard', async () => {
    renderApp('/nope')
    expect((await screen.findAllByRole('heading', { name: "Today's timeline" })).length).toBeGreaterThan(0)
  })
})

describe('basic flows', () => {
  it('paginates tasks and resets to the first page when filters change', async () => {
    renderApp('/tasks')
    expect(await screen.findByText('Showing 1–10 of 65 tasks')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(screen.getByText('Showing 11–20 of 65 tasks')).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Search tasks'), { target: { value: 'Weekly review' } })
    expect(screen.getByText('Showing 1–1 of 1 task')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Previous page' }).hasAttribute('disabled')).toBe(true)
  })

  it('saves a journal entry', async () => {
    renderApp('/journal')
    fireEvent.change(await screen.findByLabelText('What did I learn today?'), { target: { value: 'Closures' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save entry' }))
    await waitFor(() => expect(useAppStore.getState().journal[0]?.learned).toBe('Closures'))
  })

  it('applies the weekday template to a day', async () => {
    const before = useAppStore.getState().tasks.length
    renderApp('/templates')
    fireEvent.click((await screen.findAllByRole('button', { name: /Apply/ }))[0])
    fireEvent.click(await screen.findByRole('button', { name: 'Apply template' }))
    await waitFor(() => expect(useAppStore.getState().tasks.length).toBe(before + 12))
  })
})
