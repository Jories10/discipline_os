import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { buttonClass } from '@/components/Field'
import { JOURNAL_KEYS } from '@/domain/journal'
import { summarizeWeek } from '@/domain/review'
import { addDays, dayName, formatDuration, formatShortDate, formatTime, startOfWeek } from '@/domain/time'
import { useNow } from '@/hooks/useNow'
import { selectCategoryMap, useAppStore } from '@/stores/useAppStore'
import { useUiStore } from '@/stores/useUiStore'

const LABELS = { accomplished: 'Accomplished', learned: 'Learned', challenges: 'Challenges', improve: 'To improve', thoughts: 'Thoughts' } as const

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
    </div>
  )
}

export default function WeeklyReview({ onOpenDate }: { onOpenDate: (date: string) => void }) {
  const { todayISO, nowMin } = useNow()
  const tasks = useAppStore((s) => s.tasks)
  const journal = useAppStore((s) => s.journal)
  const categories = useAppStore((s) => s.categories)
  const openRoutine = useUiStore((s) => s.openRoutine)
  const catMap = useMemo(() => selectCategoryMap(categories), [categories])

  const thisWeek = startOfWeek(todayISO)
  const [weekStart, setWeekStart] = useState(thisWeek)

  const summary = useMemo(() => summarizeWeek(tasks, journal, weekStart, todayISO, nowMin), [tasks, journal, weekStart, todayISO, nowMin])
  const history = useMemo(
    () => Array.from({ length: 8 }, (_, i) => summarizeWeek(tasks, journal, addDays(thisWeek, -7 * i), todayISO, nowMin)),
    [tasks, journal, thisWeek, todayISO, nowMin],
  )
  const entryByDate = useMemo(() => new Map(journal.map((e) => [e.date, e])), [journal])

  const { stats } = summary
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Week of {formatShortDate(summary.dates[0])} to {formatShortDate(summary.dates[6])}</h2>
          <p className="text-sm text-muted">{weekStart === thisWeek ? 'This week, still in progress.' : weekStart > thisWeek ? 'An upcoming week.' : 'A past week.'}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Previous week" className="rounded-md border border-line bg-surface p-2 hover:bg-ink/5"><ChevronLeft size={16} /></button>
          <button onClick={() => setWeekStart(thisWeek)} className="rounded-md border border-line bg-surface px-3 py-2 text-sm hover:bg-ink/5">This week</button>
          <button onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Next week" className="rounded-md border border-line bg-surface p-2 hover:bg-ink/5"><ChevronRight size={16} /></button>
        </div>
      </div>

      <section aria-label="Week summary" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Completion" value={`${stats.percent}%`} />
        <Stat label="Completed" value={`${stats.completed}/${stats.total}`} />
        <Stat label="Missed" value={stats.missed} />
        <Stat label="Scheduled time" value={formatDuration(stats.scheduledMinutes)} />
        <Stat label="Journal days" value={`${summary.journalDays}/7`} />
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-label="By category">
          <h3 className="mb-3 text-sm font-semibold">By category</h3>
          {summary.byCategory.length === 0 ? (
            <p className="rounded-md border border-dashed border-line p-4 text-sm text-muted">No tasks this week.</p>
          ) : (
            <ul className="space-y-2.5">
              {summary.byCategory.map((c) => {
                const cat = catMap.get(c.categoryId)
                const pct = c.total === 0 ? 0 : Math.round((c.completed / c.total) * 100)
                return (
                  <li key={c.categoryId} className="text-xs">
                    <div className="mb-1 flex justify-between gap-2">
                      <span className="truncate">{cat?.name ?? 'Uncategorized'}</span>
                      <span className="tabular-nums text-muted">{c.completed}/{c.total}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-ink/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${cat?.name ?? 'Uncategorized'} completion`}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cat?.color ?? '#64748b' }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section aria-label="Unfinished tasks">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Missed tasks ({summary.missed.length})</h3>
            {summary.missed.length > 0 && <button onClick={() => openRoutine({ type: 'carry', weekStart })} className={buttonClass}>Carry forward</button>}
          </div>
          {summary.missed.length === 0 ? (
            <p className="rounded-md border border-dashed border-line p-4 text-sm text-muted">Nothing missed. Nice.</p>
          ) : (
            <ul className="max-h-72 space-y-1 overflow-y-auto text-sm">
              {summary.missed.map((t) => (
                <li key={t.id} className="flex justify-between gap-3 rounded border border-line bg-surface px-3 py-1.5">
                  <span className="truncate">{t.title}</span>
                  <span className="shrink-0 text-xs text-muted">{dayName(t.date).slice(0, 3)} {formatTime(t.startMin)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section aria-label="Journal this week">
        <h3 className="mb-3 text-sm font-semibold">Journal this week</h3>
        <ul className="space-y-2">
          {summary.dates.map((d) => {
            const e = entryByDate.get(d)
            const keys = e ? JOURNAL_KEYS.filter((k) => e[k].trim()) : []
            return (
              <li key={d} className="rounded-lg border border-line bg-surface p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{dayName(d)} <span className="font-normal text-muted">{formatShortDate(d)}</span></span>
                  {(keys.length > 0 || d <= todayISO) && (
                    <button onClick={() => onOpenDate(d)} className="text-xs text-accent hover:underline">{keys.length > 0 ? 'Open' : 'Write entry'}</button>
                  )}
                </div>
                {keys.length === 0 ? (
                  <p className="mt-1 text-xs text-muted">No entry</p>
                ) : (
                  <dl className="mt-2 space-y-1 text-sm">
                    {keys.map((k) => (
                      <div key={k}><dt className="text-xs text-muted">{LABELS[k]}</dt><dd className="line-clamp-2 whitespace-pre-wrap">{e![k]}</dd></div>
                    ))}
                  </dl>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <section aria-label="Recent weeks">
        <h3 className="mb-3 text-sm font-semibold">Recent weeks</h3>
        <div className="overflow-x-auto rounded-lg border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted">
              <tr><th className="px-3 py-2 font-medium">Week of</th><th className="px-3 py-2 font-medium">Completion</th><th className="px-3 py-2 font-medium">Tasks</th><th className="px-3 py-2 font-medium">Journal</th><th /></tr>
            </thead>
            <tbody>
              {history.map((w) => (
                <tr key={w.weekStart} className={`border-t border-line ${w.weekStart === weekStart ? 'bg-accent/5' : ''}`}>
                  <td className="px-3 py-2">{formatShortDate(w.weekStart)}</td>
                  <td className="px-3 py-2 tabular-nums">{w.stats.total === 0 ? 'No tasks' : `${w.stats.percent}%`}</td>
                  <td className="px-3 py-2 tabular-nums">{w.stats.completed}/{w.stats.total}</td>
                  <td className="px-3 py-2 tabular-nums">{w.journalDays}/7</td>
                  <td className="px-3 py-2 text-right"><button onClick={() => setWeekStart(w.weekStart)} className="text-xs text-accent hover:underline">Review</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
