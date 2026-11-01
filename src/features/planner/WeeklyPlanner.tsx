import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useAppStore, selectCategoryMap } from '@/stores/useAppStore'
import { useNow } from '@/hooks/useNow'
import { addDays, dayName, formatShortDate, periodOf, sortByTime, startOfWeek, weekDates } from '@/domain/time'
import type { DayPeriod, Task } from '@/domain/types'
import { useTaskActions } from '@/hooks/useTaskActions'
import { useUiStore } from '@/stores/useUiStore'
import { primaryButtonClass } from '@/components/Field'
import Menu, { MenuItem } from '@/components/Menu'
import { handleTabKeys } from '@/components/tabKeys'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import TaskCard from './TaskCard'

const PERIODS: { id: DayPeriod; label: string; hours: string; bar: string }[] = [
  { id: 'morning', label: 'Morning', hours: '6 AM to 12 PM', bar: 'bg-morning' },
  { id: 'afternoon', label: 'Afternoon', hours: '12 PM to 6 PM', bar: 'bg-afternoon' },
  { id: 'evening', label: 'Evening', hours: '6 PM to 9 PM', bar: 'bg-evening' },
]

interface DayColumnProps {
  date: string
  tasks: Task[]
  isToday: boolean
  renderTask: (t: Task) => JSX.Element
  onAdd: (date: string) => void
}

function DayColumn({ date, tasks, isToday, renderTask, onAdd }: DayColumnProps) {
  const openRoutine = useUiStore((s) => s.openRoutine)
  return (
    <section aria-label={dayName(date)} className="min-w-0">
      <div className="mb-3 flex items-center justify-between">
        <h2 className={`text-sm font-semibold ${isToday ? 'text-accent' : ''}`}>
          {dayName(date)} <span className="font-normal text-muted">{formatShortDate(date)}</span>
        </h2>
        <div className="flex items-center">
          <button onClick={() => onAdd(date)} aria-label={`Add task on ${dayName(date)}`} className="rounded p-1.5 text-muted hover:bg-ink/10 hover:text-ink">
            <Plus size={16} />
          </button>
          <Menu label={`${dayName(date)} actions`}>
            <MenuItem onClick={() => openRoutine({ type: 'saveDay', date })}>Save day as template</MenuItem>
            <MenuItem onClick={() => openRoutine({ type: 'apply', targetDate: date, scope: 'day' })}>Apply a template to this day</MenuItem>
          </Menu>
        </div>
      </div>
      <div className="space-y-4">
        {PERIODS.map((p) => {
          const items = tasks.filter((t) => periodOf(t.startMin) === p.id)
          return (
            <div key={p.id}>
              <div className="mb-1.5 flex items-center gap-2 text-xs text-muted">
                <span className={`h-1.5 w-1.5 rounded-full ${p.bar}`} aria-hidden />
                {p.label}
              </div>
              {items.length === 0 ? (
                <p className="rounded-md border border-dashed border-line px-2 py-3 text-xs text-muted">Nothing planned</p>
              ) : (
                <div className="space-y-1.5">{items.map(renderTask)}</div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default function WeeklyPlanner() {
  const { todayISO, nowMin } = useNow()
  const tasks = useAppStore((s) => s.tasks)
  const categories = useAppStore((s) => s.categories)
  const actions = useTaskActions()
  // Only one layout is mounted at a time, instead of rendering the week twice and hiding one with CSS.
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const openCreate = useUiStore((s) => s.openCreate)
  const openRoutine = useUiStore((s) => s.openRoutine)
  const catMap = useMemo(() => selectCategoryMap(categories), [categories])

  const [weekStart, setWeekStart] = useState(() => startOfWeek(todayISO))
  const [selectedDay, setSelectedDay] = useState(todayISO)

  const dates = weekDates(weekStart)
  const byDate = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const t of sortByTime(tasks)) map.set(t.date, [...(map.get(t.date) ?? []), t])
    return map
  }, [tasks])

  const shiftWeek = (weeks: number) => {
    const next = addDays(weekStart, weeks * 7)
    setWeekStart(next)
    setSelectedDay(next === startOfWeek(todayISO) ? todayISO : next)
  }
  const goToday = () => {
    setWeekStart(startOfWeek(todayISO))
    setSelectedDay(todayISO)
  }

  const renderTask = (t: Task) => (
    <TaskCard key={t.id} task={t} category={catMap.get(t.categoryId)} todayISO={todayISO} nowMin={nowMin} actions={actions} />
  )

  const addOn = (date: string) => openCreate({ date })
  const weekHasTasks = dates.some((d) => byDate.has(d))
  const activeDay = dates.includes(selectedDay) ? selectedDay : dates[0]
  const activeDayForAdd = dates.includes(todayISO) ? todayISO : dates[0]

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Weekly Planner</h1>
          <p className="text-sm text-muted">
            {formatShortDate(dates[0])} to {formatShortDate(dates[6])}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <button onClick={() => addOn(activeDayForAdd)} className={`${primaryButtonClass} mr-2 inline-flex items-center gap-1.5`}>
            <Plus size={16} aria-hidden /> Add task
          </button>
          <button onClick={() => shiftWeek(-1)} aria-label="Previous week" className="rounded-md border border-line bg-surface p-2 hover:bg-ink/5">
            <ChevronLeft size={16} />
          </button>
          <button onClick={goToday} className="rounded-md border border-line bg-surface px-3 py-2 text-sm hover:bg-ink/5">
            This week
          </button>
          <button onClick={() => shiftWeek(1)} aria-label="Next week" className="rounded-md border border-line bg-surface p-2 hover:bg-ink/5">
            <ChevronRight size={16} />
          </button>
          <Menu label="Week actions">
            <MenuItem onClick={() => openRoutine({ type: 'copyWeek', toWeekStart: weekStart })}>Copy another week into this week</MenuItem>
            <MenuItem onClick={() => openRoutine({ type: 'apply', targetDate: weekStart, scope: 'week' })}>Start this week from a template</MenuItem>
            <MenuItem onClick={() => openRoutine({ type: 'carry', weekStart })}>Carry unfinished tasks to next week</MenuItem>
            <MenuItem onClick={() => openRoutine({ type: 'saveWeek', weekStart })}>Save this week as a template</MenuItem>
          </Menu>
        </div>
      </div>

      {!weekHasTasks && (
        <p className="mb-6 rounded-md border border-dashed border-line p-4 text-sm text-muted">
          No tasks this week. Use Add task, or open the week menu to start from a template or copy another week.
        </p>
      )}

      {isDesktop ? (
        <div className="grid grid-cols-7 gap-4">
          {dates.map((d) => (
            <DayColumn key={d} date={d} tasks={byDate.get(d) ?? []} isToday={d === todayISO} renderTask={renderTask} onAdd={addOn} />
          ))}
        </div>
      ) : (
        <div>
          <div role="tablist" aria-label="Day of the week" className="mb-4 flex gap-1 overflow-x-auto pb-1">
            {dates.map((d, i) => (
              <button
                key={d}
                role="tab"
                aria-selected={d === activeDay}
                tabIndex={d === activeDay ? 0 : -1}
                onClick={() => setSelectedDay(d)}
                onKeyDown={(e) => handleTabKeys(e, i, dates.length, (n) => setSelectedDay(dates[n]))}
                className={`flex min-w-14 flex-1 flex-col items-center rounded-md border px-2 py-2 text-xs ${
                  d === activeDay ? 'border-accent bg-accent/10 text-accent' : 'border-line bg-surface text-muted'
                }`}
              >
                <span>{dayName(d).slice(0, 3)}</span>
                <span className="text-sm font-medium">{d.slice(8)}</span>
              </button>
            ))}
          </div>
          <DayColumn date={activeDay} tasks={byDate.get(activeDay) ?? []} isToday={activeDay === todayISO} renderTask={renderTask} onAdd={addOn} />
        </div>
      )}
    </div>
  )
}
