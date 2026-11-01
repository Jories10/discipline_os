import { useState } from 'react'
import { handleTabKeys } from '@/components/tabKeys'
import { useNow } from '@/hooks/useNow'
import JournalEditor from './JournalEditor'
import JournalHistory from './JournalHistory'
import WeeklyReview from './WeeklyReview'

type Tab = 'write' | 'history' | 'review'
const TABS: { id: Tab; label: string }[] = [
  { id: 'write', label: 'Entry' },
  { id: 'history', label: 'History' },
  { id: 'review', label: 'Weekly review' },
]

export default function DailyJournal() {
  const { todayISO } = useNow()
  const [tab, setTab] = useState<Tab>('write')
  const [date, setDate] = useState(todayISO)

  const openDate = (d: string) => {
    setDate(d)
    setTab('write')
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold tracking-tight">Daily Journal</h1>
      <div role="tablist" aria-label="Journal sections" className="mb-6 flex gap-1 border-b border-line">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            tabIndex={tab === t.id ? 0 : -1}
            onKeyDown={(e) => handleTabKeys(e, i, TABS.length, (n) => setTab(TABS[n].id))}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${tab === t.id ? 'border-accent font-medium text-ink' : 'border-transparent text-muted hover:text-ink'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* The editor stays mounted (hidden) so an unsaved draft survives switching tabs. */}
      <div role="tabpanel" id="panel-write" aria-labelledby="tab-write" hidden={tab !== 'write'}>
        <JournalEditor key={date} date={date} onDateChange={setDate} />
      </div>
      {tab === 'history' && (
        <div role="tabpanel" id="panel-history" aria-labelledby="tab-history"><JournalHistory onOpen={openDate} /></div>
      )}
      {tab === 'review' && (
        <div role="tabpanel" id="panel-review" aria-labelledby="tab-review"><WeeklyReview onOpenDate={openDate} /></div>
      )}
    </div>
  )
}
