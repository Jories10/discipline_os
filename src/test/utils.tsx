import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '@/app/App'
import { buildInitialState } from '@/domain/seed'
import { toISODate } from '@/domain/time'
import { useAppStore } from '@/stores/useAppStore'
import { useUiStore } from '@/stores/useUiStore'

export const renderApp = (path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )

/** Fresh seeded data and closed dialogs, so tests never depend on each other. */
export const resetApp = () => {
  useAppStore.getState().replaceAll(buildInitialState(toISODate(new Date())))
  useUiStore.setState({ taskModal: null, confirm: null, routineDialog: null, toasts: [] })
}
