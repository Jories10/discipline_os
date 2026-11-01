import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useAppStore, selectCategoryMap } from '@/stores/useAppStore'
import { useUiStore } from '@/stores/useUiStore'
import { useNow } from '@/hooks/useNow'
import { useTaskActions } from '@/hooks/useTaskActions'
import { DEFAULT_FILTERS, filterTasks, type TaskFilters } from '@/domain/filters'
import { formatLongDate, sortByTime } from '@/domain/time'
import type { Task } from '@/domain/types'
import { buttonClass, inputClass, primaryButtonClass } from '@/components/Field'
import TaskCard from '@/features/planner/TaskCard'

const PAGE_SIZE = 10

function getPageItems(pageCount: number, currentPage: number): (number | 'ellipsis')[] {
  if (pageCount <= 5) return Array.from({ length: pageCount }, (_, i) => i + 1)
  if (currentPage <= 3) return [1, 2, 3, 4, 'ellipsis', pageCount]
  if (currentPage >= pageCount - 2) return [1, 'ellipsis', pageCount - 3, pageCount - 2, pageCount - 1, pageCount]
  return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', pageCount]
}

export default function MyTasks() {
  const { todayISO, nowMin } = useNow()
  const tasks = useAppStore((s) => s.tasks)
  const categories = useAppStore((s) => s.categories)
  const openCreate = useUiStore((s) => s.openCreate)
  const actions = useTaskActions()
  const catMap = useMemo(() => selectCategoryMap(categories), [categories])

  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)
  const patch = (p: Partial<TaskFilters>) => {
    setFilters((f) => ({ ...f, ...p }))
    setPage(1)
  }

  const filtered = useMemo(
    () => sortByTime(filterTasks(tasks, filters, todayISO, nowMin)),
    [tasks, filters, todayISO, nowMin],
  )
  const pageCount = Math.ceil(filtered.length / PAGE_SIZE)
  const currentPage = Math.min(page, Math.max(pageCount, 1))
  const firstItem = (currentPage - 1) * PAGE_SIZE
  const visible = filtered.slice(firstItem, firstItem + PAGE_SIZE)
  const pageItems = getPageItems(pageCount, currentPage)
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
              <button onClick={() => { setFilters(DEFAULT_FILTERS); setPage(1) }} className={`${buttonClass} mt-3`}>Clear filters</button>
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
        </div>
      )}
      {filtered.length > 0 && (
        <div className="mt-6 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted" aria-live="polite">
            Showing {firstItem + 1}–{Math.min(firstItem + PAGE_SIZE, filtered.length)} of {filtered.length} {filtered.length === 1 ? 'task' : 'tasks'}
          </p>
          <nav aria-label="Task pagination" className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
              className="inline-flex items-center gap-1 rounded-md border border-line bg-surface px-2.5 py-2 text-sm text-muted hover:bg-ink/5 hover:text-ink disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronLeft size={16} aria-hidden />
              <span className="hidden sm:inline">Previous</span>
            </button>
            {pageItems.map((item, index) => item === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} aria-hidden className="px-1 text-sm text-muted">…</span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => setPage(item)}
                aria-label={`Page ${item}`}
                aria-current={item === currentPage ? 'page' : undefined}
                className={`min-w-9 rounded-md border px-2.5 py-2 text-sm ${
                  item === currentPage
                    ? 'border-accent bg-accent/10 font-medium text-accent'
                    : 'border-line bg-surface text-muted hover:bg-ink/5 hover:text-ink'
                }`}
              >
                {item}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage === pageCount}
              aria-label="Next page"
              className="inline-flex items-center gap-1 rounded-md border border-line bg-surface px-2.5 py-2 text-sm text-muted hover:bg-ink/5 hover:text-ink disabled:pointer-events-none disabled:opacity-40"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight size={16} aria-hidden />
            </button>
          </nav>
        </div>
      )}
    </div>
  )
}
