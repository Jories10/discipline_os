import { useState } from 'react'
import Modal from '@/components/Modal'
import Field, { buttonClass, inputClass, primaryButtonClass } from '@/components/Field'
import { buildTemplate, tasksToBlocks } from '@/domain/routines'
import { formatLongDate, formatShortDate, weekDates } from '@/domain/time'
import { useAppStore } from '@/stores/useAppStore'
import { useUiStore, type RoutineDialog } from '@/stores/useUiStore'

type Props = { dialog: Extract<RoutineDialog, { type: 'saveDay' | 'saveWeek' }> }

export default function SaveTemplateDialog({ dialog }: Props) {
  const close = useUiStore((s) => s.closeRoutine)
  const notify = useUiStore((s) => s.notify)
  const tasks = useAppStore((s) => s.tasks)
  const addTemplate = useAppStore((s) => s.addTemplate)

  const isDay = dialog.type === 'saveDay'
  const dates = isDay ? [dialog.date] : weekDates(dialog.weekStart)
  const days = dates.map((d) => tasksToBlocks(tasks.filter((t) => t.date === d)))
  const blockCount = days.reduce((n, d) => n + d.length, 0)

  const [name, setName] = useState('')
  const [error, setError] = useState<string>()

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return setError('Give the template a name')
    if (trimmed.length > 60) return setError('Keep the name under 60 characters')
    addTemplate(buildTemplate(trimmed, isDay ? 'day' : 'week', days))
    notify('success', 'Template saved')
    close()
  }

  const subject = isDay ? formatLongDate(dialog.date) : `the week of ${formatShortDate(dates[0])}`

  return (
    <Modal title={isDay ? 'Save day as template' : 'Save week as template'} onClose={close}>
      {blockCount === 0 ? (
        <>
          <p className="mb-4 text-sm text-muted">There are no tasks on {subject} to save.</p>
          <div className="flex justify-end"><button onClick={close} className={buttonClass}>Close</button></div>
        </>
      ) : (
        <form onSubmit={save} noValidate className="space-y-3">
          <p className="text-sm text-muted">Saves {blockCount} {blockCount === 1 ? 'task' : 'tasks'} from {subject}. Completion is not saved, and later changes to this template never alter tasks you've already scheduled.</p>
          <Field label="Template name" error={error}>
            {(id, desc) => <input id={id} autoFocus aria-describedby={desc} aria-invalid={!!error} value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="e.g. Intensive Project Week" />}
          </Field>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={close} className={buttonClass}>Cancel</button>
            <button type="submit" className={primaryButtonClass}>Save template</button>
          </div>
        </form>
      )}
    </Modal>
  )
}
