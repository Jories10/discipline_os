import { useState } from 'react'
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import Field, { buttonClass, inputClass, primaryButtonClass } from '@/components/Field'
import { hasJournalContent, JOURNAL_KEYS } from '@/domain/journal'
import { computeStats } from '@/domain/stats'
import { addDays, formatLongDate } from '@/domain/time'
import type { JournalFields } from '@/domain/types'
import { useNow } from '@/hooks/useNow'
import { useAppStore } from '@/stores/useAppStore'
import { useUiStore } from '@/stores/useUiStore'

const PROMPTS: Record<keyof JournalFields, string> = {
  accomplished: 'What did I accomplish today?',
  learned: 'What did I learn today?',
  challenges: 'What challenges did I encounter?',
  improve: 'What could I improve tomorrow?',
  thoughts: 'Additional thoughts',
}

interface Props {
  date: string
  onDateChange: (date: string) => void
}

export default function JournalEditor({ date, onDateChange }: Props) {
  const { todayISO, nowMin } = useNow()
  const entry = useAppStore((s) => s.journal.find((e) => e.date === date))
  const dayTasks = useAppStore((s) => s.tasks.filter((t) => t.date === date))
  const saveEntry = useAppStore((s) => s.saveJournalEntry)
  const deleteEntry = useAppStore((s) => s.deleteJournalEntry)
  const askConfirm = useUiStore((s) => s.askConfirm)
  const notify = useUiStore((s) => s.notify)

  const saved: JournalFields = {
    accomplished: entry?.accomplished ?? '',
    learned: entry?.learned ?? '',
    challenges: entry?.challenges ?? '',
    improve: entry?.improve ?? '',
    thoughts: entry?.thoughts ?? '',
  }
  const [draft, setDraft] = useState<JournalFields>(saved)

  const dirty = JOURNAL_KEYS.some((k) => draft[k] !== saved[k])
  const stats = computeStats(dayTasks, todayISO, nowMin)

  const requestDate = (next: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(next) || next === date) return
    if (!dirty) return onDateChange(next)
    askConfirm({
      title: 'Discard unsaved changes?',
      message: 'You have changes in this entry that have not been saved.',
      confirmLabel: 'Discard changes',
      onConfirm: () => onDateChange(next),
    })
  }

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = Object.fromEntries(JOURNAL_KEYS.map((k) => [k, draft[k].trim()])) as unknown as JournalFields
    if (!hasJournalContent(trimmed)) return notify('error', 'Write something before saving.')
    saveEntry(date, trimmed)
    setDraft(trimmed)
    notify('success', 'Journal entry saved')
  }

  const remove = () =>
    askConfirm({
      title: 'Delete this journal entry?',
      message: `The entry for ${formatLongDate(date)} will be permanently removed.`,
      confirmLabel: 'Delete entry',
      onConfirm: () => {
        deleteEntry(date)
        setDraft({ accomplished: '', learned: '', challenges: '', improve: '', thoughts: '' })
        notify('success', 'Entry deleted')
      },
    })

  return (
    <form onSubmit={save} noValidate className="max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => requestDate(addDays(date, -1))} aria-label="Previous day" className="rounded-md border border-line bg-surface p-2 hover:bg-ink/5"><ChevronLeft size={16} /></button>
        <input type="date" aria-label="Entry date" value={date} max={todayISO} onChange={(e) => requestDate(e.target.value)} className={`${inputClass} w-auto`} />
        <button type="button" onClick={() => requestDate(addDays(date, 1))} disabled={date >= todayISO} aria-label="Next day" className="rounded-md border border-line bg-surface p-2 hover:bg-ink/5 disabled:opacity-40"><ChevronRight size={16} /></button>
        {date !== todayISO && <button type="button" onClick={() => requestDate(todayISO)} className={buttonClass}>Today</button>}
      </div>

      <div>
        <h2 className="text-base font-semibold tracking-tight">{formatLongDate(date)}</h2>
        <p className="mt-0.5 text-sm text-muted">
          {stats.total === 0 ? 'No tasks were scheduled this day.' : `${stats.completed} of ${stats.total} tasks completed (${stats.percent}%).`}
          {entry && ` Last saved ${new Date(entry.updatedAt).toLocaleString()}.`}
        </p>
      </div>

      {JOURNAL_KEYS.map((key) => (
        <Field key={key} label={PROMPTS[key]}>
          {(id) => (
            <textarea id={id} rows={key === 'thoughts' ? 4 : 3} maxLength={5000} value={draft[key]} onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))} className={inputClass} />
          )}
        </Field>
      ))}

      <div className="flex items-center justify-between gap-2">
        {entry ? (
          <button type="button" onClick={remove} className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-600/10 dark:text-red-400"><Trash2 size={14} aria-hidden /> Delete entry</button>
        ) : <span />}
        <div className="flex items-center gap-3">
          {dirty && <span className="text-xs text-muted">Unsaved changes</span>}
          <button type="submit" disabled={!dirty} className={primaryButtonClass}>{entry ? 'Save changes' : 'Save entry'}</button>
        </div>
      </div>
    </form>
  )
}
