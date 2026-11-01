import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

/** Keeps a crash in one screen from taking down the navigation. Saved data lives in storage and is not touched here. */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Screen crashed:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div role="alert" className="mx-auto max-w-md rounded-lg border border-line bg-surface p-6 text-center">
        <h1 className="text-base font-semibold">Something went wrong on this screen</h1>
        <p className="mt-2 text-sm text-muted">
          Your saved data is stored separately and was not changed by this error. Try again, or reload the page.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <button onClick={() => this.setState({ error: null })} className="rounded-md border border-line bg-surface px-3 py-2 text-sm hover:bg-ink/5">
            Try again
          </button>
          <button onClick={() => window.location.reload()} className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white hover:opacity-90">
            Reload page
          </button>
        </div>
      </div>
    )
  }
}
