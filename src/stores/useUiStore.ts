import { create } from 'zustand'
import type { TaskFields } from '@/domain/taskForm'
import type { Task } from '@/domain/types'

export interface TaskModalState {
  mode: 'create' | 'edit'
  task?: Task
  defaults?: Partial<TaskFields>
}
export interface ConfirmState {
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
}
export type RoutineDialog =
  | { type: 'apply'; templateId?: string; targetDate?: string; scope?: 'day' | 'week' }
  | { type: 'saveDay'; date: string }
  | { type: 'saveWeek'; weekStart: string }
  | { type: 'copyWeek'; toWeekStart: string }
  | { type: 'carry'; weekStart: string }
  | { type: 'editTemplate'; templateId?: string }

export interface Toast {
  id: string
  kind: 'success' | 'error'
  message: string
}

interface UiState {
  taskModal: TaskModalState | null
  confirm: ConfirmState | null
  routineDialog: RoutineDialog | null
  toasts: Toast[]
  openCreate: (defaults?: Partial<TaskFields>) => void
  openEdit: (task: Task) => void
  closeTaskModal: () => void
  askConfirm: (c: ConfirmState) => void
  closeConfirm: () => void
  openRoutine: (dialog: RoutineDialog) => void
  closeRoutine: () => void
  notify: (kind: Toast['kind'], message: string) => void
  dismissToast: (id: string) => void
}

export const useUiStore = create<UiState>((set, get) => ({
  taskModal: null,
  confirm: null,
  routineDialog: null,
  toasts: [],
  openCreate: (defaults) => set({ taskModal: { mode: 'create', defaults } }),
  openEdit: (task) => set({ taskModal: { mode: 'edit', task } }),
  closeTaskModal: () => set({ taskModal: null }),
  askConfirm: (confirm) => set({ confirm }),
  closeConfirm: () => set({ confirm: null }),
  openRoutine: (routineDialog) => set({ routineDialog }),
  closeRoutine: () => set({ routineDialog: null }),
  notify: (kind, message) => {
    const id = crypto.randomUUID()
    set((s) => ({ toasts: [...s.toasts, { id, kind, message }] }))
    window.setTimeout(() => get().dismissToast(id), 4000)
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
