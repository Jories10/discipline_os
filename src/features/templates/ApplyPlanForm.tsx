import { useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { buttonClass, primaryButtonClass } from '@/components/Field'
import { previewApply, type ApplyMode } from '@/domain/routines'
import type { Task } from '@/domain/types'
import { useAppStore } from '@/stores/useAppStore'
import { useUiStore } from '@/stores/useUiStore'

interface Props {
  incoming: Task[]
  dates: string[]
  confirmLabel: string
  successMessage: string
  /** False for flows that only ever add (carry forward). */
  allowReplace: boolean
  onDone: () => void
  onCancel: () => void
}

/** Shared confirmation step: shows exactly what will be added and removed before anything changes. */
export default function ApplyPlanForm({ incoming, dates, confirmLabel, successMessage, allowReplace, onDone, onCancel }: Props) {
  const existing = useAppStore((s) => s.tasks)
  const applyChanges = useAppStore((s) => s.applyChanges)
  const notify = useUiStore((s) => s.notify)
  const [mode, setMode] = useState<ApplyMode>('add')

  const preview = useMemo(() => previewApply(existing, incoming, dates, allowReplace ? mode : 'add'), [existing, incoming, dates, mode, allowReplace])
  const destructive = preview.removeIds.length > 0

  const confirm = () => {
    applyChanges({ removeIds: preview.removeIds, add: preview.add })
    notify('success', successMessage)
    onDone()
  }

  return (
    <div className="space-y-3">
      {allowReplace && preview.existingOnDates > 0 && (
        <fieldset className="space-y-1.5 rounded-md border border-line p-3 text-sm">
          <legend className="px-1 text-xs text-muted">These days already have {preview.existingOnDates} {preview.existingOnDates === 1 ? 'task' : 'tasks'}</legend>
          <label className="flex items-start gap-2">
            <input type="radio" name="apply-mode" checked={mode === 'add'} onChange={() => setMode('add')} className="mt-1" />
            <span>Add alongside the existing tasks</span>
          </label>
          <label className="flex items-start gap-2">
            <input type="radio" name="apply-mode" checked={mode === 'replace'} onChange={() => setMode('replace')} className="mt-1" />
            <span>Replace unfinished tasks <span className="text-muted">(completed tasks are always kept)</span></span>
          </label>
        </fieldset>
      )}

      <ul className="space-y-1 text-sm">
        <li>Adds <strong>{preview.add.length}</strong> {preview.add.length === 1 ? 'task' : 'tasks'}</li>
        {destructive && <li className="text-red-600 dark:text-red-400">Removes <strong>{preview.removeIds.length}</strong> unfinished {preview.removeIds.length === 1 ? 'task' : 'tasks'}</li>}
        {mode === 'replace' && preview.keptCompleted > 0 && <li className="text-muted">Keeps {preview.keptCompleted} completed {preview.keptCompleted === 1 ? 'task' : 'tasks'} as history</li>}
      </ul>

      {preview.overlaps > 0 && (
        <p role="alert" className="flex items-start gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 p-2.5 text-xs">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden />
          {preview.overlaps} of the new {preview.overlaps === 1 ? 'task overlaps' : 'tasks overlap'} something that stays on the calendar. You can adjust them afterwards.
        </p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel} className={buttonClass}>Cancel</button>
        <button
          onClick={confirm}
          disabled={preview.add.length === 0}
          className={destructive ? 'rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50' : primaryButtonClass}
        >
          {destructive ? `Replace ${preview.removeIds.length} and apply` : confirmLabel}
        </button>
      </div>
    </div>
  )
}
