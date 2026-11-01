import { useMemo, useState } from 'react'
import Modal from '@/components/Modal'
import { buttonClass } from '@/components/Field'
import { shiftTasks } from '@/domain/routines'
import { formatShortDate, formatTime, sortByTime, taskStatus, weekDates, dayName } from '@/domain/time'
import { useNow } from '@/hooks/useNow'
import { useAppStore } from '@/stores/useAppStore'
import { useUiStore } from '@/stores/useUiStore'
import ApplyPlanForm from './ApplyPlanForm'

export default function CarryForwardDialog({ weekStart }: { weekStart: string }) {
  const close = useUiStore((s) => s.closeRoutine)
  const tasks = useAppStore((s) => s.tasks)
  const { todayISO, nowMin } = useNow()

  const missed = useMemo(() => {
    const dates = new Set(weekDates(weekStart))
    return sortByTime(tasks.filter((t) => dates.has(t.date) && taskStatus(t, todayISO, nowMin) === 'missed'))
  }, [tasks, weekStart, todayISO, nowMin])

  const [selected, setSelected] = useState<Set<string>>(() => new Set(missed.map((t) => t.id)))
  const chosen = useMemo(() => missed.filter((t) => selected.has(t.id)), [missed, selected])
  const incoming = useMemo(() => shiftTasks(chosen, 7), [chosen])
  const dates = useMemo(() => [...new Set(incoming.map((t) => t.date))], [incoming])

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <Modal title="Carry unfinished tasks to next week" onClose={close}>
      {missed.length === 0 ? (
        <>
          <p className="mb-4 text-sm text-muted">Nothing to carry forward. No tasks from the week of {formatShortDate(weekStart)} are missed.</p>
          <div className="flex justify-end"><button onClick={close} className={buttonClass}>Close</button></div>
        </>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted">Pick the tasks to copy to the same day and time next week. The originals stay in this week as history.</p>
          <ul className="max-h-64 space-y-1 overflow-y-auto rounded-md border border-line p-2">
            {missed.map((t) => (
              <li key={t.id}>
                <label className="flex items-start gap-2 rounded px-1 py-1 text-sm hover:bg-ink/5">
                  <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggle(t.id)} className="mt-1" />
                  <span>
                    {t.title}
                    <span className="block text-xs text-muted">{dayName(t.date)}, {formatTime(t.startMin)} to {formatTime(t.endMin)}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <ApplyPlanForm
            incoming={incoming}
            dates={dates}
            confirmLabel="Carry forward"
            successMessage="Tasks carried forward"
            allowReplace={false}
            onDone={close}
            onCancel={close}
          />
        </div>
      )}
    </Modal>
  )
}
