import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './AppLayout'
import Dashboard from '@/features/dashboard/Dashboard'

// Only the landing page is in the main bundle; every other screen loads on first visit.
const WeeklyPlanner = lazy(() => import('@/features/planner/WeeklyPlanner'))
const MyTasks = lazy(() => import('@/features/tasks/MyTasks'))
const AnalyticsDashboard = lazy(() => import('@/features/analytics/AnalyticsDashboard'))
const DailyJournal = lazy(() => import('@/features/journal/DailyJournal'))
const RoutineTemplates = lazy(() => import('@/features/templates/RoutineTemplates'))
const Settings = lazy(() => import('@/features/settings/Settings'))

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="planner" element={<WeeklyPlanner />} />
        <Route path="tasks" element={<MyTasks />} />
        <Route path="analytics" element={<AnalyticsDashboard />} />
        <Route path="journal" element={<DailyJournal />} />
        <Route path="templates" element={<RoutineTemplates />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
