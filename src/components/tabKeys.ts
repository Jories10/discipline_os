import type { KeyboardEvent } from 'react'

/** Arrow, Home and End navigation for a tablist whose tabs are direct children of the same element. */
export function handleTabKeys(e: KeyboardEvent<HTMLElement>, index: number, count: number, select: (index: number) => void) {
  let next: number | null = null
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % count
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (index - 1 + count) % count
  else if (e.key === 'Home') next = 0
  else if (e.key === 'End') next = count - 1
  if (next === null) return
  e.preventDefault()
  select(next)
  ;(e.currentTarget.parentElement?.children[next] as HTMLElement | undefined)?.focus()
}
