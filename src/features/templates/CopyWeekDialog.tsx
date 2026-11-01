import { useMemo, useState } from 'react'
import Modal from '@/components/Modal'
import Field, { inputClass } from '@/components/Field'
import { shiftTasks } from '@/domain/routines'
import { addDays, diffDays, formatShortDate, startOfWeek, weekDates } from '@/domain/time'
import { useAppStore } from '@/stores/useAppStore'
import { useUiStore } from '@/stores/useUiStore'
import ApplyPlanForm from './ApplyPlanForm'

export default function CopyWeekDialog({ toWeekStart }: { toWeekStart: string }) {
  const close = useUiStore((s) => s.closeRoutine)
  const tasks = useAppStore((s) => s.tasks)
  const [from, setFrom] = useState(addDays(toWeekStart, -7))

  const valid = /^\d{4}-\d{2}-\d{2}$/.test(from)
  const fromStart = valid ? startOfWeek(from) : ''
  const offset = valid ? diffDays(fromStart, toWeekStart) : 0

  const incoming = useMemo(() => {
    if (!valid || offset === 0) return []
    const sourceDates = new Set(weekDates(from))
    return shiftTasks(tasks.filter((t) => sourceDates.has(t.date)), offset)
  }, [tasks, from, valid, offset])

  return (
    <Modal title="Copy a week into this week" onClose={close}>
      <div className="space-y-3">
        <Field label="Copy from the week containing">
          {(id) => <input id={id} type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass} />}
        </Field>
        <p className="text-xs text-muted">
          {valid && offset === 0
            ? 'Choose a different week than the one you are copying into.'
            : valid
              ? `Week of ${formatShortDate(fromStart)} into the week of ${formatShortDate(toWeekStart)}. Copies start unfinished; the original week is untouched.`
              : 'Choose a date.'}
        </p>
        <ApplyPlanForm
          incoming={incoming}
          dates={weekDates(toWeekStart)}
          confirmLabel="Copy week"
          successMessage="Week copied"
          allowReplace
          onDone={close}
          onCancel={close}
        />
      </div>
    </Modal>
  )
}
