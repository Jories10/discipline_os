import { useMemo } from 'react'
import { addDays } from '@/domain/time'
import type { Task } from '@/domain/types'
import { useAppStore } from '@/stores/useAppStore'
import { useUiStore } from '@/stores/useUiStore'

/** Single place for task interactions, so every screen behaves the same way. */
export function useTaskActions() {
  const toggleTask = useAppStore((s) => s.toggleTask)
  const deleteTask = useAppStore((s) => s.deleteTask)

  return useMemo(
    () => ({
      toggle: toggleTask,
      edit: (task: Task) => useUiStore.getState().openEdit(task),
      /** Opens the create form prefilled for the next day, so a copy never lands on top of the original. */
      duplicate: (task: Task) =>
        useUiStore.getState().openCreate({
          title: task.title,
          description: task.description,
          date: addDays(task.date, 1),
          startMin: task.startMin,
          endMin: task.endMin,
          categoryId: task.categoryId,
          priority: task.priority,
        }),
      remove: (task: Task) =>
        useUiStore.getState().askConfirm({
          title: 'Delete this task?',
          message: `"${task.title}" will be permanently removed.`,
          confirmLabel: 'Delete task',
          onConfirm: () => {
            deleteTask(task.id)
            useUiStore.getState().notify('success', 'Task deleted')
          },
        }),
    }),
    [toggleTask, deleteTask],
  )
}

export type TaskActions = ReturnType<typeof useTaskActions>
