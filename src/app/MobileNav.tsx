import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Ellipsis, Moon, Sun } from 'lucide-react'
import { isActivePath, NAV } from './nav'

interface Props {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export default function MobileNav({ theme, onToggleTheme }: Props) {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const primary = NAV.filter((n) => n.primary)
  const overflow = NAV.filter((n) => !n.primary)
  const overflowActive = overflow.some((n) => isActivePath(n, pathname))
  const tab = (active: boolean) => `flex min-w-0 flex-1 flex-col items-center gap-1 py-2 text-[11px] ${active ? 'text-accent' : 'text-muted'}`

  return (
    <>
      {open && <div className="fixed inset-0 z-30 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
        {open && (
          <div id="more-menu" className="space-y-1 border-b border-line p-2">
            {overflow.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm ${isActive ? 'bg-ink/5 font-medium' : 'text-muted'}`}
              >
                <Icon size={18} aria-hidden /> {label}
              </NavLink>
            ))}
            <button onClick={onToggleTheme} className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted">
              {theme === 'dark' ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
              {theme === 'dark' ? 'Light theme' : 'Dark theme'}
            </button>
          </div>
        )}
        <div className="flex">
          {primary.map(({ to, short, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => tab(isActive)}>
              <Icon size={20} aria-hidden /> {short}
            </NavLink>
          ))}
          <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="more-menu" className={tab(overflowActive || open)}>
            <Ellipsis size={20} aria-hidden /> More
          </button>
        </div>
      </nav>
    </>
  )
}
