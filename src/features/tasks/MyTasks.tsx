import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useAppStore, selectCategoryMap } from '@/stores/useAppStore'
import { useUiStore } from '@/stores/useUiStore'
import { useNow } from '@/hooks/useNow'
import { useTaskActions } from '@/hooks/useTaskActions'
import { DEFAULT_FILTERS, filterTasks, type TaskFilters } from '@/domain/filters'
import { formatLongDate, sortByTime } from '@/domain/time'
import type { Task } from '@/domain/types'
import { buttonClass, inputClass, primaryButtonClass } from '@/components/Field'
import TaskCard from '@/features/planner/TaskCard'

const PAGE_SIZE = 60

export default function MyTasks() {
  const { todayISO, nowMin } = useNow()
  const tasks = useAppStore((s) => s.tasks)
  const categories = useAppStore((s) => s.categories)
  const openCreate = useUiStore((s) => s.openCreate)
  const actions = useTaskActions()
  const catMap = useMemo(() => selectCategoryMap(categories), [categories])

  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS)
  const [limit, setLimit] = useState(PAGE_SIZE)
  const patch = (p: Partial<TaskFilters>) => {
    setFilters((f) => ({ ...f, ...p }))
    setLimit(PAGE_SIZE)
  }

  const filtered = useMemo(
    () => sortByTime(filterTasks(tasks, filters, todayISO, nowMin)),
    [tasks, filters, todayISO, nowMin],
  )
  const visible = filtered.slice(0, limit)
  const groups = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const t of visible) map.set(t.date, [...(map.get(t.date) ?? []), t])
    return [...map.entries()]
  }, [visible])

  const isFiltered = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS)

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">My Tasks</h1>
          <p className="text-sm text-muted">{filtered.length} {filtered.length === 1 ? 'task' : 'tasks'}</p>
        </div>
        <button onClick={() => openCreate({ date: todayISO })} className={`${primaryButtonClass} inline-flex items-center gap-1.5`}>
          <Plus size={16} aria-hidden /> Add task
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2 lg:grid-cols-5">
        <input
          type="search"
          aria-label="Search tasks"
          placeholder="Search title or description"
          value={filters.query}
          onChange={(e) => patch({ query: e.target.value })}
          className={`${inputClass} col-span-2 lg:col-span-1`}
        />
        <select aria-label="Time range" value={filters.range} onChange={(e) => patch({ range: e.target.value as TaskFilters['range'] })} className={inputClass}>
          <option value="week">This week</option>
          <option value="all">All time</option>
        </select>
        <select aria-label="Category" value={filters.categoryId} onChange={(e) => patch({ categoryId: e.target.value })} className={inputClass}>
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select aria-label="Status" value={filters.status} onChange={(e) => patch({ status: e.target.value as TaskFilters['status'] })} className={inputClass}>
          <option value="all">Any status</option>
          <option value="upcoming">Upcoming</option>
          <option value="current">In progress</option>
          <option value="completed">Completed</option>
          <option value="missed">Missed</option>
        </select>
        <select aria-label="Priority" value={filters.priority} onChange={(e) => patch({ priority: e.target.value as TaskFilters['priority'] })} className={inputClass}>
          <option value="all">Any priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-md border border-dashed border-line p-6 text-center text-sm text-muted">
          {isFiltered ? (
            <>
              <p>No tasks match these filters.</p>
              <button onClick={() => { setFilters(DEFAULT_FILTERS); setLimit(PAGE_SIZE) }} className={`${buttonClass} mt-3`}>Clear filters</button>
            </>
          ) : (
            <p>No tasks yet. Use Add task to schedule your first one.</p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([date, items]) => (
            <section key={date} aria-label={formatLongDate(date)}>
              <h2 className={`mb-2 text-sm font-semibold ${date === todayISO ? 'text-accent' : ''}`}>{formatLongDate(date)}</h2>
              <div className="grid gap-1.5 md:grid-cols-2">
                {items.map((t) => (
                  <TaskCard key={t.id} task={t} category={catMap.get(t.categoryId)} todayISO={todayISO} nowMin={nowMin} actions={actions} />
                ))}
              </div>
            </section>
          ))}
          {filtered.length > visible.length && (
            <button onClick={() => setLimit((l) => l + PAGE_SIZE)} className={buttonClass}>
              Show more ({filtered.length - visible.length} left)
            </button>
          )}
        </div>
      )}
    </div>
  )
}
