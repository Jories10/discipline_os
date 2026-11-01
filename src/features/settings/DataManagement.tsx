import { useRef } from 'react'
import { Download, Upload } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { useUiStore } from '@/stores/useUiStore'
import { parsePersisted } from '@/domain/migrate'
import { buildInitialState } from '@/domain/seed'
import { toISODate } from '@/domain/time'
import { buttonClass } from '@/components/Field'

const MAX_IMPORT_BYTES = 5 * 1024 * 1024

export default function DataManagement() {
  const fileRef = useRef<HTMLInputElement>(null)
  const notify = useUiStore((s) => s.notify)
  const askConfirm = useUiStore((s) => s.askConfirm)
  const replaceAll = useAppStore((s) => s.replaceAll)

  const exportData = () => {
    const { tasks, categories, templates, journal } = useAppStore.getState()
    const blob = new Blob([JSON.stringify({ version: 2, tasks, categories, templates, journal }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `discipline-os-backup-${toISODate(new Date())}.json`
    a.click()
    URL.revokeObjectURL(url)
    notify('success', 'Backup downloaded')
  }

  const importData = async (file: File) => {
    if (file.size > MAX_IMPORT_BYTES) return notify('error', 'That file is too large to be a Discipline OS backup.')
    try {
      const data = parsePersisted(JSON.parse(await file.text()))
      if (!data) return notify('error', "That file isn't a valid Discipline OS backup.")
      askConfirm({
        title: 'Replace all current data?',
        message: `This replaces everything with the backup (${data.tasks.length} tasks, ${data.categories.length} categories, ${data.templates.length} templates, ${data.journal.length} journal entries). Export a backup first if you might want the current data back.`,
        confirmLabel: 'Replace data',
        onConfirm: () => { replaceAll(data); notify('success', 'Backup restored') },
      })
    } catch {
      notify('error', "That file isn't valid JSON.")
    }
  }

  const resetAll = () =>
    askConfirm({
      title: 'Reset everything to the starter schedule?',
      message: 'This permanently deletes all your tasks, categories, templates and journal entries, then loads the starter weekday schedule. Export a backup first if you might want your data back.',
      confirmLabel: 'Delete everything and reset',
      onConfirm: () => { replaceAll(buildInitialState(toISODate(new Date()))); notify('success', 'Reset to the starter schedule') },
    })

  return (
    <section aria-labelledby="data-heading">
      <h2 id="data-heading" className="text-base font-semibold tracking-tight">Backup</h2>
      <p className="mb-4 mt-1 text-sm text-muted">Your data is stored only in this browser. Export a backup regularly, and use it to move to another device.</p>
      <div className="flex flex-wrap gap-2">
        <button onClick={exportData} className={`${buttonClass} inline-flex items-center gap-2`}><Download size={16} aria-hidden /> Export backup</button>
        <button onClick={() => fileRef.current?.click()} className={`${buttonClass} inline-flex items-center gap-2`}><Upload size={16} aria-hidden /> Import backup</button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          aria-label="Choose backup file"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void importData(file)
            e.target.value = ''
          }}
        />
      </div>
      <div className="mt-8 rounded-lg border border-red-600/30 p-4">
        <h3 className="text-sm font-semibold">Reset</h3>
        <p className="mb-3 mt-1 text-sm text-muted">Start over with the starter weekday schedule. This cannot be undone.</p>
        <button onClick={resetAll} className="rounded-md border border-red-600/40 px-3 py-2 text-sm text-red-600 hover:bg-red-600/10 dark:text-red-400">Reset all data</button>
      </div>
    </section>
  )
}
