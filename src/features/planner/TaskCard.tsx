import { memo } from 'react'
import { Check, Copy, Pencil, Trash2 } from 'lucide-react'
import { formatTime, taskStatus } from '@/domain/time'
import type { Category, Task } from '@/domain/types'
import type { TaskActions } from '@/hooks/useTaskActions'

interface Props {
  task: Task
  category?: Category
  todayISO: string
  nowMin: number
  actions: TaskActions
}

const iconBtn =
  'rounded p-1 text-muted hover:bg-ink/10 hover:text-ink'

function TaskCard({ task, category, todayISO, nowMin, actions }: Props) {
  const status = taskStatus(task, todayISO, nowMin)
  const color = category?.color ?? '#64748b'

  return (
    <div
      className={`group flex gap-2 rounded-md border bg-surface p-2.5 transition-colors ${
        status === 'current' ? 'border-accent ring-1 ring-accent/30' : 'border-line'
      } ${status === 'completed' ? 'opacity-60' : ''}`}
      style={{ borderLeftColor: color, borderLeftWidth: 3 }}
    >
      <button
        role="checkbox"
        aria-checked={task.completed}
        aria-label={`${task.completed ? 'Reopen' : 'Complete'} ${task.title}`}
        onClick={() => actions.toggle(task.id)}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
          task.completed ? 'border-accent bg-accent text-white' : 'border-muted/50 hover:border-accent'
        }`}
      >
        {task.completed && <Check size={12} strokeWidth={3} />}
      </button>

      <div className="min-w-0 flex-1">
        <button
          onClick={() => actions.edit(task)}
          className={`block w-full text-left text-sm font-medium leading-snug hover:underline ${task.completed ? 'line-through' : ''}`}
        >
          {task.title}
        </button>
        <p className="mt-0.5 text-xs text-muted">
          {formatTime(task.startMin)} to {formatTime(task.endMin)}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden />
            {category?.name ?? 'Uncategorized'}
          </span>
          <span>{task.priority} priority</span>
          {status === 'missed' && <span className="font-medium text-red-600 dark:text-red-400">Missed</span>}
          {status === 'current' && <span className="font-medium text-accent">Now</span>}
        </p>
        {task.description && <p className="mt-1 line-clamp-2 text-xs text-muted">{task.description}</p>}

        <div className="mt-1.5 flex gap-0.5 lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
          <button onClick={() => actions.edit(task)} aria-label={`Edit ${task.title}`} title="Edit" className={iconBtn}><Pencil size={14} /></button>
          <button onClick={() => actions.duplicate(task)} aria-label={`Duplicate ${task.title}`} title="Duplicate to next day" className={iconBtn}><Copy size={14} /></button>
          <button onClick={() => actions.remove(task)} aria-label={`Delete ${task.title}`} title="Delete" className={`${iconBtn} hover:!text-red-600`}><Trash2 size={14} /></button>
        </div>
      </div>
    </div>
  )
}

export default memo(TaskCard)
