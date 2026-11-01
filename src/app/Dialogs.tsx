import { lazy, Suspense } from 'react'
import ConfirmDialog from '@/components/ConfirmDialog'
import Toaster from '@/components/Toaster'
import { useUiStore } from '@/stores/useUiStore'

// The form-heavy dialogs are fetched the first time one is opened, not at startup.
const TaskModal = lazy(() => import('@/features/planner/TaskModal'))
const RoutineDialogs = lazy(() => import('@/features/templates/RoutineDialogs'))

export default function Dialogs() {
  const taskModal = useUiStore((s) => s.taskModal)
  const routineDialog = useUiStore((s) => s.routineDialog)
  return (
    <>
      <Suspense fallback={null}>
        {taskModal && <TaskModal />}
        {routineDialog && <RoutineDialogs />}
      </Suspense>
      <ConfirmDialog />
      <Toaster />
    </>
  )
}
