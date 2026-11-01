import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  activeDaysInLast, activeStreak, buildCategoryPoints, buildDayPoints, buildWeekPoints,
  mostMissed, mostProductiveDay, toHours, weekdayPattern,
} from '@/domain/analytics'
import { computeStats } from '@/domain/stats'
import { addDays, dayName, formatDuration, formatShortDate, startOfWeek, weekDates } from '@/domain/time'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useNow } from '@/hooks/useNow'
import { selectCategoryMap, useAppStore } from '@/stores/useAppStore'
import ChartCard from './ChartCard'

const COLORS = { completed: '#22c55e', missed: '#ef4444', pending: '#94a3b8', scheduled: '#94a3b8', focused: '#6366f1', accent: '#6366f1' }
const CHART_HEIGHT = 240

// Axis text and grid use currentColor, so they follow the light/dark theme without extra wiring.
const axisTick = { fill: 'currentColor', fontSize: 12 }
const tooltipStyle = {
  contentStyle: { background: 'rgb(var(--surface))', border: '1px solid rgb(var(--line))', borderRadius: 8, fontSize: 12, color: 'rgb(var(--ink))' },
  cursor: { fill: 'currentColor', fillOpacity: 0.06 },
}
const Grid = () => <CartesianGrid stroke="currentColor" strokeOpacity={0.12} vertical={false} />

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  )
}

export default function AnalyticsDashboard() {
  const { todayISO, nowMin } = useNow()
  const tasks = useAppStore((s) => s.tasks)
  const categories = useAppStore((s) => s.categories)
  const catMap = useMemo(() => selectCategoryMap(categories), [categories])

  const roomy = useMediaQuery('(min-width: 640px)')
  const thisWeek = startOfWeek(todayISO)
  const [weekStart, setWeekStart] = useState(thisWeek)

  const days = useMemo(() => buildDayPoints(tasks, weekStart, todayISO, nowMin), [tasks, weekStart, todayISO, nowMin])
  const weekTasks = useMemo(() => {
    const dates = new Set(weekDates(weekStart))
    return tasks.filter((t) => dates.has(t.date))
  }, [tasks, weekStart])
  const week = useMemo(() => computeStats(weekTasks, todayISO, nowMin), [weekTasks, todayISO, nowMin])
  const categoryPoints = useMemo(() => buildCategoryPoints(tasks, weekStart), [tasks, weekStart])
  const trend = useMemo(() => buildWeekPoints(tasks, todayISO, nowMin), [tasks, todayISO, nowMin])
  const pattern = useMemo(() => weekdayPattern(tasks, todayISO), [tasks, todayISO])
  const missedTop = useMemo(() => mostMissed(tasks, todayISO, nowMin), [tasks, todayISO, nowMin])
  const streak = useMemo(() => activeStreak(tasks, todayISO), [tasks, todayISO])
  const activeDays = useMemo(() => activeDaysInLast(tasks, todayISO), [tasks, todayISO])

  const best = mostProductiveDay(days)
  const focusedMin = days.reduce((n, d) => n + d.focusedMin, 0)
  const trackedCount = days.reduce((n, d) => n + d.trackedCount, 0)

  const timeData = days.map((d) => ({ label: d.label, scheduled: toHours(d.scheduledMin), focused: toHours(d.focusedMin) }))
  const categoryData = categoryPoints.map((c) => ({
    name: catMap.get(c.categoryId)?.name ?? 'Uncategorized',
    scheduled: toHours(c.scheduledMin),
    completed: toHours(c.completedMin),
  }))

  const describe = (items: { label: string; value: string }[]) => items.map((i) => `${i.label} ${i.value}`).join(', ')

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted">Week of {formatShortDate(weekStart)} to {formatShortDate(addDays(weekStart, 6))}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Previous week" className="rounded-md border border-line bg-surface p-2 hover:bg-ink/5"><ChevronLeft size={16} /></button>
          <button onClick={() => setWeekStart(thisWeek)} className="rounded-md border border-line bg-surface px-3 py-2 text-sm hover:bg-ink/5">This week</button>
          <button onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Next week" className="rounded-md border border-line bg-surface p-2 hover:bg-ink/5"><ChevronRight size={16} /></button>
        </div>
      </div>

      <section aria-label="Week summary" className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Stat label="Weekly completion" value={`${week.percent}%`} />
        <Stat label="Completed" value={`${week.completed}/${week.total}`} hint={`${week.pending} still pending`} />
        <Stat label="Missed" value={week.missed} />
        <Stat label="Scheduled time" value={formatDuration(week.scheduledMinutes)} />
        <Stat
          label="Focused time"
          value={trackedCount === 0 ? 'Not tracked' : formatDuration(focusedMin)}
          hint={trackedCount === 0 ? 'Enter it when editing a task' : `${trackedCount} ${trackedCount === 1 ? 'task' : 'tasks'} tracked`}
        />
        <Stat label="Most productive day" value={best ? dayName(best.date) : 'None yet'} hint={best ? `${best.completed} completed` : 'Complete a task first'} />
      </section>

      {week.total === 0 && (
        <p className="rounded-md border border-dashed border-line p-4 text-sm text-muted">No tasks are scheduled this week, so the weekly charts are empty. The trend charts below still show your history.</p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Daily completion"
          subtitle="Share of each day's tasks completed. Empty and future days have no bar."
          summary={describe(days.map((d) => ({ label: d.label, value: d.percent === null ? 'none' : `${d.percent}%` })))}
        >
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart data={days} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <Grid />
              <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={axisTick} axisLine={false} tickLine={false} unit="%" />
              <Tooltip {...tooltipStyle} formatter={(v) => `${v}%`} />
              <Bar dataKey="percent" name="Completion" fill={COLORS.accent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Completed vs unfinished"
          subtitle="Tasks per day. Missed means the time has passed without completion."
          summary={describe(days.map((d) => ({ label: d.label, value: `${d.completed} completed, ${d.missed} missed, ${d.pending} pending` })))}
        >
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart data={days} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <Grid />
              <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="completed" name="Completed" stackId="a" fill={COLORS.completed} />
              <Bar dataKey="missed" name="Missed" stackId="a" fill={COLORS.missed} />
              <Bar dataKey="pending" name="Pending" stackId="a" fill={COLORS.pending} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Scheduled vs focused time"
          subtitle="Hours. Focused time is only what you entered on tasks, never an estimate."
          summary={describe(timeData.map((d) => ({ label: d.label, value: `${d.scheduled} scheduled, ${d.focused} focused hours` })))}
        >
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart data={timeData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <Grid />
              <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} unit="h" />
              <Tooltip {...tooltipStyle} formatter={(v) => `${v} h`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="scheduled" name="Scheduled" fill={COLORS.scheduled} radius={[4, 4, 0, 0]} />
              <Bar dataKey="focused" name="Focused" fill={COLORS.focused} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Productivity by category"
          subtitle="Hours scheduled and hours of tasks completed."
          summary={categoryData.length === 0 ? 'No tasks this week' : describe(categoryData.map((c) => ({ label: c.name, value: `${c.completed} of ${c.scheduled} hours` })))}
        >
          {categoryData.length === 0 ? (
            <p className="py-16 text-center text-sm">No tasks this week.</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(CHART_HEIGHT, categoryData.length * 44 + 56)}>
              <BarChart data={categoryData} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
                <CartesianGrid stroke="currentColor" strokeOpacity={0.12} horizontal={false} />
                <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} unit="h" />
                <YAxis type="category" dataKey="name" width={roomy ? 130 : 88} tick={axisTick} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} formatter={(v) => `${v} h`} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="scheduled" name="Scheduled" fill={COLORS.scheduled} radius={[0, 4, 4, 0]} />
                <Bar dataKey="completed" name="Completed" fill={COLORS.completed} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <h2 className="text-base font-semibold tracking-tight">Consistency over time</h2>

      <section aria-label="Consistency" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Current streak" value={`${streak} ${streak === 1 ? 'day' : 'days'}`} hint="In a row with a completed task" />
        <Stat label="Active days" value={`${activeDays}/28`} hint="Days with a completed task, last 4 weeks" />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Weekly completion, last 12 weeks"
          subtitle="Weeks with no tasks are left blank."
          summary={describe(trend.map((w) => ({ label: w.label, value: w.percent === null ? 'none' : `${w.percent}%` })))}
        >
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <LineChart data={trend} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <Grid />
              <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis domain={[0, 100]} tick={axisTick} axisLine={false} tickLine={false} unit="%" />
              <Tooltip {...tooltipStyle} formatter={(v) => `${v}%`} />
              <Line type="monotone" dataKey="percent" name="Completion" stroke={COLORS.accent} strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Average completion by weekday"
          subtitle="Finished days from the last 12 weeks. Today is excluded."
          summary={describe(pattern.map((p) => ({ label: p.weekday, value: p.avgPercent === null ? 'no data' : `${p.avgPercent}% over ${p.days} days` })))}
        >
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart data={pattern} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <Grid />
              <XAxis dataKey="weekday" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={axisTick} axisLine={false} tickLine={false} unit="%" />
              <Tooltip {...tooltipStyle} formatter={(v) => `${v}%`} />
              <Bar dataKey="avgPercent" name="Average completion" fill={COLORS.accent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <section aria-label="Most missed tasks">
        <h2 className="mb-3 text-base font-semibold tracking-tight">Most often missed, last 12 weeks</h2>
        {missedTop.length === 0 ? (
          <p className="rounded-md border border-dashed border-line p-4 text-sm text-muted">No missed tasks in this period.</p>
        ) : (
          <ul className="max-w-xl space-y-1.5">
            {missedTop.map((m) => (
              <li key={m.title} className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface px-3 py-2 text-sm">
                <span className="truncate">{m.title}</span>
                <span className="shrink-0 tabular-nums text-muted">{m.count}×</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
