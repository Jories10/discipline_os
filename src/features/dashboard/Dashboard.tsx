import { useMemo } from 'react'
import { useAppStore, selectCategoryMap } from '@/stores/useAppStore'
import { useNow } from '@/hooks/useNow'
import { computeStats } from '@/domain/stats'
import { dayName, formatDuration, formatLongDate, formatTime, sortByTime, taskStatus, weekDates } from '@/domain/time'
import { Plus } from 'lucide-react'
import { primaryButtonClass } from '@/components/Field'
import { useTaskActions } from '@/hooks/useTaskActions'
import { useUiStore } from '@/stores/useUiStore'
import TaskCard from '@/features/planner/TaskCard'

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
    </div>
  )
}

export default function Dashboard() {
  const { todayISO, nowMin } = useNow()
  const tasks = useAppStore((s) => s.tasks)
  const categories = useAppStore((s) => s.categories)
  const actions = useTaskActions()
  const openCreate = useUiStore((s) => s.openCreate)
  const catMap = useMemo(() => selectCategoryMap(categories), [categories])

  const todayTasks = useMemo(() => sortByTime(tasks.filter((t) => t.date === todayISO)), [tasks, todayISO])
  const dates = weekDates(todayISO)
  const weekTasks = useMemo(() => tasks.filter((t) => dates.includes(t.date)), [tasks, todayISO]) // eslint-disable-line react-hooks/exhaustive-deps

  const today = computeStats(todayTasks, todayISO, nowMin)
  const week = computeStats(weekTasks, todayISO, nowMin)
  const next = todayTasks.find((t) => taskStatus(t, todayISO, nowMin) === 'current' || taskStatus(t, todayISO, nowMin) === 'upcoming')

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
        <h1 className="text-xl font-semibold tracking-tight">{formatLongDate(todayISO)}</h1>
        <p className="mt-1 text-sm text-muted">
          {today.total === 0
            ? 'Nothing is scheduled today.'
            : next
              ? `Next up: ${next.title} at ${formatTime(next.startMin)}`
              : 'Everything scheduled for today is behind you.'}
        </p>
        </div>
        <button onClick={() => openCreate({ date: todayISO })} className={`${primaryButtonClass} inline-flex items-center gap-1.5`}>
          <Plus size={16} aria-hidden /> Add task
        </button>
      </header>

      <section aria-label="Today" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Today's progress" value={`${today.percent}%`} />
        <Stat label="Completed today" value={today.completed} />
        <Stat label="Remaining today" value={today.pending} />
        <Stat label="Scheduled today" value={formatDuration(today.scheduledMinutes)} />
      </section>

      <div className="grid gap-8 lg:grid-cols-5">
        <section aria-label="Today's timeline" className="lg:col-span-3">
          <h2 className="mb-3 text-sm font-semibold">Today's timeline</h2>
          {todayTasks.length === 0 ? (
            <p className="rounded-md border border-dashed border-line p-4 text-sm text-muted">No tasks today.</p>
          ) : (
            <div className="space-y-1.5">
              {todayTasks.map((t) => (
                <TaskCard key={t.id} task={t} category={catMap.get(t.categoryId)} todayISO={todayISO} nowMin={nowMin} actions={actions} />
              ))}
            </div>
          )}
        </section>

        <section aria-label="This week" className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold">This week</h2>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <Stat label="Weekly completion" value={`${week.percent}%`} />
            <Stat label="Total tasks" value={week.total} />
            <Stat label="Pending" value={week.pending} />
            <Stat label="Missed" value={week.missed} />
          </div>
          <ul className="space-y-2">
            {dates.map((d) => {
              const s = computeStats(weekTasks.filter((t) => t.date === d), todayISO, nowMin)
              return (
                <li key={d} className="flex items-center gap-3 text-xs">
                  <span className={`w-9 ${d === todayISO ? 'font-semibold text-accent' : 'text-muted'}`}>{dayName(d).slice(0, 3)}</span>
                  <div
                    className="h-2 flex-1 overflow-hidden rounded-full bg-ink/10"
                    role="progressbar"
                    aria-valuenow={s.percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${dayName(d)} completion`}
                  >
                    <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${s.percent}%` }} />
                  </div>
                  <span className="w-16 text-right tabular-nums text-muted">{s.completed}/{s.total}</span>
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </div>
  )
}
