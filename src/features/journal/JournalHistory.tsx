import { useMemo, useState } from 'react'
import { buttonClass, inputClass } from '@/components/Field'
import { JOURNAL_KEYS, searchEntries } from '@/domain/journal'
import { formatLongDate } from '@/domain/time'
import { useAppStore } from '@/stores/useAppStore'

const LABELS = { accomplished: 'Accomplished', learned: 'Learned', challenges: 'Challenges', improve: 'To improve', thoughts: 'Thoughts' } as const
const PAGE_SIZE = 30

export default function JournalHistory({ onOpen }: { onOpen: (date: string) => void }) {
  const journal = useAppStore((s) => s.journal)
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(PAGE_SIZE)

  const results = useMemo(() => searchEntries(journal, query), [journal, query])

  return (
    <div className="max-w-3xl space-y-4">
      <input
        type="search"
        aria-label="Search journal entries"
        placeholder="Search everything you've written"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setLimit(PAGE_SIZE) }}
        className={inputClass}
      />

      {results.length === 0 ? (
        <p className="rounded-md border border-dashed border-line p-6 text-center text-sm text-muted">
          {journal.length === 0 ? 'No entries yet. Write your first one in the Today tab.' : 'No entries match your search.'}
        </p>
      ) : (
        <ul className="space-y-3">
          {results.slice(0, limit).map((e) => (
            <li key={e.id} className="rounded-lg border border-line bg-surface p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{formatLongDate(e.date)}</h3>
                <button onClick={() => onOpen(e.date)} className={buttonClass}>Open</button>
              </div>
              <dl className="space-y-1.5 text-sm">
                {JOURNAL_KEYS.filter((k) => e[k].trim()).map((k) => (
                  <div key={k}>
                    <dt className="text-xs text-muted">{LABELS[k]}</dt>
                    <dd className="line-clamp-3 whitespace-pre-wrap">{e[k]}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      )}
      {results.length > limit && <button onClick={() => setLimit((l) => l + PAGE_SIZE)} className={buttonClass}>Show more ({results.length - limit} left)</button>}
    </div>
  )
}
