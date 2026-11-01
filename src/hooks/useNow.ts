import { useEffect, useState } from 'react'
import { minutesOfDay, toISODate } from '@/domain/time'

/** Re-renders every 30s so "current activity" and "missed" stay accurate without a refresh. */
export function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])
  return { now, todayISO: toISODate(now), nowMin: minutesOfDay(now) }
}
