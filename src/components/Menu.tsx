import { useEffect, useRef, type ReactNode } from 'react'
import { MoreHorizontal } from 'lucide-react'

/** Lightweight dropdown on <details>: keyboard accessible, closes on item click and on outside click. */
export default function Menu({ label, children }: { label: string; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current?.open && !ref.current.contains(e.target as Node)) ref.current.open = false
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  return (
    <details ref={ref} className="relative">
      <summary
        aria-label={label}
        title={label}
        className="flex cursor-pointer list-none items-center rounded border border-transparent p-1.5 text-muted hover:bg-ink/10 hover:text-ink [&::-webkit-details-marker]:hidden"
      >
        <MoreHorizontal size={16} />
      </summary>
      <div
        role="menu"
        onClick={() => { if (ref.current) ref.current.open = false }}
        className="absolute right-0 z-20 mt-1 w-60 rounded-md border border-line bg-surface p-1 shadow-lg"
      >
        {children}
      </div>
    </details>
  )
}

export function MenuItem({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button role="menuitem" onClick={onClick} className="block w-full rounded px-2 py-1.5 text-left text-sm text-ink hover:bg-ink/5">
      {children}
    </button>
  )
}
