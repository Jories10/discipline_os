import type { JournalEntry, JournalFields } from './types'

export const JOURNAL_KEYS: (keyof JournalFields)[] = ['accomplished', 'learned', 'challenges', 'improve', 'thoughts']

export const hasJournalContent = (f: JournalFields): boolean => JOURNAL_KEYS.some((k) => f[k].trim().length > 0)

/** Newest first; matches any field, case-insensitively. */
export const searchEntries = (entries: JournalEntry[], query: string): JournalEntry[] => {
  const q = query.trim().toLowerCase()
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))
  return q ? sorted.filter((e) => JOURNAL_KEYS.some((k) => e[k].toLowerCase().includes(q))) : sorted
}
