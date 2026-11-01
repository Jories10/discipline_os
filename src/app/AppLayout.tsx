import { Suspense, useEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import ErrorBoundary from '@/components/ErrorBoundary'
import { useTheme } from '@/hooks/useTheme'
import { useAppStore } from '@/stores/useAppStore'
import { useUiStore } from '@/stores/useUiStore'
import Dialogs from './Dialogs'
import MobileNav from './MobileNav'
import { isActivePath, NAV } from './nav'

const Moon = ({ size, 'aria-hidden': ariaHidden }: { size: number; 'aria-hidden'?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden={ariaHidden}>
    <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />
  </svg>
)

const Sun = ({ size, 'aria-hidden': ariaHidden }: { size: number; 'aria-hidden'?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden={ariaHidden}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
  </svg>
)

const X = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m18 6-12 12M6 6l12 12" />
  </svg>
)

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
    isActive ? 'bg-ink/5 font-medium text-ink' : 'text-muted hover:bg-ink/5 hover:text-ink'
  }`

export default function AppLayout() {
  const { theme, toggle } = useTheme()
  const { pathname } = useLocation()
  const saveError = useAppStore((s) => s.saveError)
  const dismiss = useAppStore((s) => s.dismissSaveError)
  const notify = useUiStore((s) => s.notify)
  const mainRef = useRef<HTMLElement>(null)
  const firstRender = useRef(true)

  // Per-route title, and move focus to the content after navigating so keyboard and screen reader users start there.
  useEffect(() => {
    const current = NAV.find((n) => isActivePath(n, pathname))
    document.title = current ? `${current.label} · Discipline OS` : 'Discipline OS'
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    mainRef.current?.focus()
  }, [pathname])

  // Errors thrown in event handlers or promises are not caught by the error boundary; surface them instead of failing silently.
  useEffect(() => {
    const report = (e: ErrorEvent | PromiseRejectionEvent) => {
      console.error('Unhandled error:', 'reason' in e ? e.reason : e.error)
      notify('error', 'Something unexpected went wrong. If it keeps happening, export a backup and reload.')
    }
    window.addEventListener('error', report)
    window.addEventListener('unhandledrejection', report)
    return () => {
      window.removeEventListener('error', report)
      window.removeEventListener('unhandledrejection', report)
    }
  }, [notify])

  return (
    <div className="min-h-screen lg:flex">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:shadow-lg">
        Skip to content
      </a>

      <aside className="hidden w-60 shrink-0 border-r border-line bg-surface p-4 lg:flex lg:flex-col">
        <div className="mb-6 px-3 text-base font-semibold tracking-tight">Discipline OS</div>
        <nav aria-label="Main" className="flex flex-1 flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <Icon size={16} aria-hidden /> {label}
            </NavLink>
          ))}
        </nav>
        <button onClick={toggle} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted hover:bg-ink/5 hover:text-ink">
          {theme === 'dark' ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
          {theme === 'dark' ? 'Light theme' : 'Dark theme'}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 lg:hidden">
          <span className="font-semibold tracking-tight">Discipline OS</span>
        </header>

        {saveError && (
          <div role="alert" className="flex items-center justify-between gap-3 bg-red-600 px-4 py-2 text-sm text-white">
            {saveError}
            <button onClick={dismiss} aria-label="Dismiss"><X size={16} /></button>
          </div>
        )}

        <main id="main" ref={mainRef} tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 p-4 pb-28 focus-visible:ring-0 lg:p-8 lg:pb-8">
          {/* Keyed by route so a crash on one screen clears as soon as you navigate away. */}
          <ErrorBoundary key={pathname}>
            <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>

        <MobileNav theme={theme} onToggleTheme={toggle} />
      </div>
      <Dialogs />
    </div>
  )
}
