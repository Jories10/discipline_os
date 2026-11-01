import { taskStatus } from './time'
import type { Task } from './types'

export interface DayStats {
  total: number
  completed: number
  missed: number
  pending: number
  percent: number
  scheduledMinutes: number
}

export const computeStats = (tasks: Task[], todayISO: string, nowMin: number): DayStats => {
  let completed = 0
  let missed = 0
  let scheduledMinutes = 0
  for (const t of tasks) {
    scheduledMinutes += t.endMin - t.startMin
    const s = taskStatus(t, todayISO, nowMin)
    if (s === 'completed') completed++
    else if (s === 'missed') missed++
  }
  const total = tasks.length
  return {
    total,
    completed,
    missed,
    pending: total - completed - missed,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
    scheduledMinutes,
  }
}
