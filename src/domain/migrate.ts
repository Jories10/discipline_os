import { buildDefaultTemplates } from './seed'
import { legacyStateSchemaV1, persistedStateSchema, type PersistedState } from './types'

/** Accepts any known stored shape and returns the current one, or null if the data is unusable. */
export const parsePersisted = (raw: unknown): PersistedState | null => {
  const current = persistedStateSchema.safeParse(raw)
  if (current.success) return current.data

  const legacy = legacyStateSchemaV1.safeParse(raw)
  if (legacy.success) {
    return { version: 2, tasks: legacy.data.tasks, categories: legacy.data.categories, templates: buildDefaultTemplates(), journal: [] }
  }
  return null
}
