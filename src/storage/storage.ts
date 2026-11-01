import { parsePersisted } from '@/domain/migrate'
import { buildInitialState } from '@/domain/seed'
import { toISODate } from '@/domain/time'
import type { PersistedState } from '@/domain/types'

/** The UI and stores depend on this interface only, so a SupabaseAdapter can replace localStorage later. */
export interface StorageAdapter {
  load(): PersistedState
  save(state: PersistedState): void
}

export const STORAGE_KEY = 'discipline-os:v1'

export class LocalStorageAdapter implements StorageAdapter {
  load(): PersistedState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const state = parsePersisted(JSON.parse(raw))
        if (state) return state
        // Keep the unreadable data so it can be recovered manually instead of silently overwriting it.
        localStorage.setItem(`${STORAGE_KEY}:corrupt-${Date.now()}`, raw)
        console.error('Stored data failed validation and was backed up.')
      }
    } catch (error) {
      console.error('Could not read stored data.', error)
    }
    return buildInitialState(toISODate(new Date()))
  }

  save(state: PersistedState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (error) {
      throw new Error('Could not save your changes. Browser storage may be full or disabled.', { cause: error })
    }
  }
}

export const storage: StorageAdapter = new LocalStorageAdapter()
