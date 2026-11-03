import { create } from 'zustand'
import { parsePersisted } from '@/domain/migrate'
import { storage, STORAGE_KEY } from '@/storage/storage'
import type { TaskFields } from '@/domain/taskForm'
import type { Category, JournalEntry, JournalFields, PersistedState, Task, Template } from '@/domain/types'

export type CategoryFields = Pick<Category, 'name' | 'color' | 'purpose'>
export type TemplateFields = Pick<Template, 'name' | 'description' | 'days'>

interface AppState {
  tasks: Task[]
  categories: Category[]
  templates: Template[]
  journal: JournalEntry[]
  saveError: string | null
  canUndo: boolean
  canRedo: boolean

  toggleTask: (id: string) => void
  addTask: (fields: TaskFields) => void
  updateTask: (id: string, fields: TaskFields & { actualMinutes?: number | null }) => void
  deleteTask: (id: string) => void
  /** Atomic bulk change used by templates, week copy and carry-forward. */
  applyChanges: (changes: { removeIds: string[]; add: Task[] }) => void
  undo: () => void
  redo: () => void

  addCategory: (fields: CategoryFields) => void
  updateCategory: (id: string, fields: CategoryFields) => void
  /** Tasks in the deleted category move to replacementId; the UI requires one when the category is in use. */
  deleteCategory: (id: string, replacementId?: string) => void

  addTemplate: (template: Template) => void
  updateTemplate: (id: string, fields: TemplateFields) => void
  deleteTemplate: (id: string) => void

  saveJournalEntry: (date: string, fields: JournalFields) => void
  deleteJournalEntry: (date: string) => void

  replaceAll: (state: PersistedState) => void
  dismissSaveError: () => void
}

const initial = storage.load()

const HISTORY_LIMIT = 50

export const useAppStore = create<AppState>((set, get) => {
  let pastTasks: Task[][] = []
  let futureTasks: Task[][] = []

  const updateTasks = (update: (tasks: Task[]) => Task[]) =>
    set((state) => {
      const tasks = update(state.tasks)
      if (tasks === state.tasks) return state
      pastTasks = [...pastTasks.slice(-(HISTORY_LIMIT - 1)), state.tasks]
      futureTasks = []
      return { tasks, canUndo: true, canRedo: false }
    })

  return {
  tasks: initial.tasks,
  categories: initial.categories,
  templates: initial.templates,
  journal: initial.journal,
  saveError: null,
  canUndo: false,
  canRedo: false,

  toggleTask: (id) =>
    updateTasks((tasks) => {
      if (!tasks.some((t) => t.id === id)) return tasks
      return tasks.map((t) =>
        t.id === id ? { ...t, completed: !t.completed, completedAt: t.completed ? null : new Date().toISOString() } : t,
      )
    }),

  addTask: (fields) =>
    updateTasks((tasks) => [
        ...tasks,
        { ...fields, id: crypto.randomUUID(), completed: false, completedAt: null, actualMinutes: null, createdAt: new Date().toISOString() },
      ]),

  updateTask: (id, fields) =>
    updateTasks((tasks) => {
      if (!tasks.some((t) => t.id === id)) return tasks
      return tasks.map((t) => (t.id === id ? { ...t, ...fields } : t))
    }),

  deleteTask: (id) =>
    updateTasks((tasks) => {
      const next = tasks.filter((t) => t.id !== id)
      return next.length === tasks.length ? tasks : next
    }),

  applyChanges: ({ removeIds, add }) =>
    updateTasks((tasks) => {
      const remove = new Set(removeIds)
      const remaining = tasks.filter((t) => !remove.has(t.id))
      return remove.size === 0 && add.length === 0 ? tasks : [...remaining, ...add]
    }),

  undo: () => {
    if (pastTasks.length === 0) return
    const tasks = pastTasks.pop()!
    futureTasks.push(get().tasks)
    set({ tasks, canUndo: pastTasks.length > 0, canRedo: true })
  },

  redo: () => {
    if (futureTasks.length === 0) return
    const tasks = futureTasks.pop()!
    pastTasks.push(get().tasks)
    set({ tasks, canUndo: true, canRedo: futureTasks.length > 0 })
  },

  addCategory: (fields) => set((s) => ({ categories: [...s.categories, { ...fields, id: crypto.randomUUID() }] })),

  updateCategory: (id, fields) =>
    set((s) => ({ categories: s.categories.map((c) => (c.id === id ? { ...c, ...fields } : c)) })),

  deleteCategory: (id, replacementId) =>
    set((s) => ({
      categories: s.categories.filter((c) => c.id !== id),
      tasks: replacementId ? s.tasks.map((t) => (t.categoryId === id ? { ...t, categoryId: replacementId } : t)) : s.tasks,
    })),

  addTemplate: (template) => set((s) => ({ templates: [...s.templates, template] })),

  updateTemplate: (id, fields) => set((s) => ({ templates: s.templates.map((t) => (t.id === id ? { ...t, ...fields } : t)) })),

  deleteTemplate: (id) => set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),

  saveJournalEntry: (date, fields) =>
    set((s) => {
      const now = new Date().toISOString()
      const exists = s.journal.some((e) => e.date === date)
      return {
        journal: exists
          ? s.journal.map((e) => (e.date === date ? { ...e, ...fields, updatedAt: now } : e))
          : [...s.journal, { id: crypto.randomUUID(), date, ...fields, createdAt: now, updatedAt: now }],
      }
    }),

  deleteJournalEntry: (date) => set((s) => ({ journal: s.journal.filter((e) => e.date !== date) })),

  replaceAll: (state) =>
    (() => {
      pastTasks = []
      futureTasks = []
      set({ tasks: state.tasks, categories: state.categories, templates: state.templates, journal: state.journal, canUndo: false, canRedo: false })
    })(),

  dismissSaveError: () => set({ saveError: null }),
  }
})

// One persistence subscription for the whole store: every mutation is saved, nothing is saved by hand.
let applyingExternal = false

useAppStore.subscribe((state, prev) => {
  if (
    applyingExternal ||
    state.tasks === prev.tasks &&
    state.categories === prev.categories &&
    state.templates === prev.templates &&
    state.journal === prev.journal
  ) {
    return
  }
  try {
    storage.save({ version: 2, tasks: state.tasks, categories: state.categories, templates: state.templates, journal: state.journal })
  } catch (error) {
    useAppStore.setState({ saveError: error instanceof Error ? error.message : 'Could not save changes.' })
  }
})

export const selectCategoryMap = (categories: Category[]) => new Map(categories.map((c) => [c.id, c]))

/** Keeps several open tabs consistent; without this the last tab to write would silently overwrite the others. */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY || !e.newValue) return
    try {
      const next = parsePersisted(JSON.parse(e.newValue))
      if (!next) return
      // Adopt the other tab's data without writing it back, which would echo between tabs forever.
      applyingExternal = true
      try {
        useAppStore.getState().replaceAll(next)
      } finally {
        applyingExternal = false
      }
    } catch {
      // Unreadable data from another tab is ignored; this tab keeps its own state.
    }
  })
}
