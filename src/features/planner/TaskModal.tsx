import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle } from 'lucide-react'
import Modal from '@/components/Modal'
import Field, { buttonClass, inputClass, primaryButtonClass } from '@/components/Field'
import { conflictsFor, fieldsToForm, formToActual, formToFields, taskFormSchema, type TaskFormValues } from '@/domain/taskForm'
import { dayName, formatTime, fromInputTime, periodOf, toISODate } from '@/domain/time'
import type { TaskFields } from '@/domain/taskForm'
import { useAppStore } from '@/stores/useAppStore'
import { useUiStore, type TaskModalState } from '@/stores/useUiStore'
import { useTaskActions } from '@/hooks/useTaskActions'

const DEFAULT_FIELDS: Omit<TaskFields, 'date' | 'categoryId'> = {
  title: '', description: '', startMin: 9 * 60, endMin: 10 * 60, priority: 'medium',
}

function TaskForm({ modal }: { modal: TaskModalState }) {
  const close = useUiStore((s) => s.closeTaskModal)
  const notify = useUiStore((s) => s.notify)
  const tasks = useAppStore((s) => s.tasks)
  const categories = useAppStore((s) => s.categories)
  const addTask = useAppStore((s) => s.addTask)
  const updateTask = useAppStore((s) => s.updateTask)
  const actions = useTaskActions()

  const editing = modal.mode === 'edit' ? modal.task : undefined
  const [allowOverlap, setAllowOverlap] = useState(false)
  const [overlapBlocked, setOverlapBlocked] = useState(false)

  const defaults = useMemo<TaskFormValues>(() => {
    if (editing) return fieldsToForm(editing, editing.actualMinutes)
    return fieldsToForm({
      ...DEFAULT_FIELDS,
      date: toISODate(new Date()),
      categoryId: categories[0]?.id ?? '',
      ...modal.defaults,
    })
  }, [editing, modal.defaults, categories])

  const { register, handleSubmit, watch, formState: { errors } } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: defaults,
  })

  const watched = watch()
  const conflicts = conflictsFor(watched, editing?.id ?? '', tasks)
  const period = /^\d{2}:\d{2}$/.test(watched.start) ? periodOf(fromInputTime(watched.start)) : null
  const dateValid = /^\d{4}-\d{2}-\d{2}$/.test(watched.date)

  const onSubmit = (values: TaskFormValues) => {
    if (conflicts.length > 0 && !allowOverlap) {
      setOverlapBlocked(true)
      return
    }
    const fields = formToFields(values)
    if (editing) updateTask(editing.id, { ...fields, actualMinutes: formToActual(values) })
    else addTask(fields)
    notify('success', editing ? 'Task updated' : 'Task added')
    close()
  }

  return (
    <Modal title={editing ? 'Edit task' : 'New task'} onClose={close}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
        <Field label="Title" error={errors.title?.message}>
          {(id, desc) => (
            <input id={id} autoFocus aria-describedby={desc} aria-invalid={!!errors.title} className={inputClass} placeholder="What will you do?" {...register('title')} />
          )}
        </Field>

        <Field label="Description (optional)" error={errors.description?.message}>
          {(id, desc) => <textarea id={id} rows={3} aria-describedby={desc} className={inputClass} {...register('description')} />}
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Date" error={errors.date?.message}>
            {(id, desc) => <input id={id} type="date" aria-describedby={desc} className={inputClass} {...register('date')} />}
          </Field>
          <Field label="Start" error={errors.start?.message}>
            {(id, desc) => <input id={id} type="time" step={300} aria-describedby={desc} className={inputClass} {...register('start')} />}
          </Field>
          <Field label="End" error={errors.end?.message}>
            {(id, desc) => <input id={id} type="time" step={300} aria-describedby={desc} className={inputClass} {...register('end')} />}
          </Field>
        </div>
        {dateValid && period && (
          <p className="text-xs text-muted">
            {dayName(watched.date)}, {period}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Category" error={errors.categoryId?.message}>
            {(id, desc) => (
              <select id={id} aria-describedby={desc} className={inputClass} {...register('categoryId')}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Priority">
            {(id) => (
              <select id={id} className={inputClass} {...register('priority')}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            )}
          </Field>
        </div>

        {editing && (
          <Field label="Actual focused time in minutes (optional)" error={errors.actual?.message}>
            {(id, desc) => (
              <input id={id} inputMode="numeric" aria-describedby={desc} className={inputClass} placeholder="Leave empty if not tracked" {...register('actual')} />
            )}
          </Field>
        )}

        {conflicts.length > 0 && (
          <div role="alert" className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
            <p className="flex items-center gap-2 font-medium">
              <AlertTriangle size={16} aria-hidden /> This overlaps with {conflicts.length === 1 ? 'another task' : `${conflicts.length} tasks`}
            </p>
            <ul className="mt-1 list-disc pl-6 text-xs text-muted">
              {conflicts.map((c) => (
                <li key={c.id}>{c.title}, {formatTime(c.startMin)} to {formatTime(c.endMin)}</li>
              ))}
            </ul>
            <label className="mt-2 flex items-center gap-2 text-xs">
              <input type="checkbox" checked={allowOverlap} onChange={(e) => { setAllowOverlap(e.target.checked); setOverlapBlocked(false) }} />
              Schedule it anyway, the overlap is intentional
            </label>
            {overlapBlocked && <p className="mt-1 text-xs text-red-600 dark:text-red-400">Tick the box above to save an overlapping task.</p>}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-2">
          {editing ? (
            <button
              type="button"
              onClick={() => { close(); actions.remove(editing) }}
              className="rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-600/10 dark:text-red-400"
            >
              Delete
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button type="button" onClick={close} className={buttonClass}>Cancel</button>
            <button type="submit" className={primaryButtonClass}>{editing ? 'Save changes' : 'Add task'}</button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default function TaskModal() {
  const modal = useUiStore((s) => s.taskModal)
  return modal ? <TaskForm modal={modal} /> : null
}
