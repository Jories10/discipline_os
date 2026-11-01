import { Copy, Pencil, Play, Plus, Trash2 } from 'lucide-react'
import { buttonClass, primaryButtonClass } from '@/components/Field'
import { buildTemplate, templateBlockCount, templateMinutes } from '@/domain/routines'
import { formatDuration, toISODate } from '@/domain/time'
import { useAppStore } from '@/stores/useAppStore'
import { useUiStore } from '@/stores/useUiStore'

export default function RoutineTemplates() {
  const templates = useAppStore((s) => s.templates)
  const addTemplate = useAppStore((s) => s.addTemplate)
  const deleteTemplate = useAppStore((s) => s.deleteTemplate)
  const openRoutine = useUiStore((s) => s.openRoutine)
  const askConfirm = useUiStore((s) => s.askConfirm)
  const notify = useUiStore((s) => s.notify)

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Routine Templates</h1>
          <p className="text-sm text-muted">Reusable days and weeks. Applying a template copies it; later edits never change tasks you've already scheduled.</p>
        </div>
        <button onClick={() => openRoutine({ type: 'editTemplate' })} className={`${primaryButtonClass} inline-flex items-center gap-1.5`}>
          <Plus size={16} aria-hidden /> New template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-md border border-dashed border-line p-6 text-center text-sm text-muted">
          No templates yet. Create one here, or save a day or week from the Weekly Planner.
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {templates.map((t) => (
            <li key={t.id} className="flex flex-col rounded-lg border border-line bg-surface p-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-medium">{t.name}</h2>
                <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-xs text-muted">{t.scope === 'week' ? 'Week' : 'Day'}</span>
              </div>
              {t.description && <p className="mt-1 text-sm text-muted">{t.description}</p>}
              <p className="mt-2 text-xs text-muted">{templateBlockCount(t)} blocks · {formatDuration(templateMinutes(t))} scheduled</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => openRoutine({ type: 'apply', templateId: t.id, targetDate: toISODate(new Date()) })} className={`${buttonClass} inline-flex items-center gap-1.5`}><Play size={14} aria-hidden /> Apply</button>
                <button onClick={() => openRoutine({ type: 'editTemplate', templateId: t.id })} className={`${buttonClass} inline-flex items-center gap-1.5`}><Pencil size={14} aria-hidden /> Edit</button>
                <button
                  onClick={() => { addTemplate(buildTemplate(`${t.name} (copy)`.slice(0, 60), t.scope, t.days.map((d) => [...d]), t.description)); notify('success', 'Template duplicated') }}
                  className={`${buttonClass} inline-flex items-center gap-1.5`}
                ><Copy size={14} aria-hidden /> Duplicate</button>
                <button
                  onClick={() => askConfirm({
                    title: 'Delete this template?',
                    message: `"${t.name}" will be removed. Tasks already scheduled from it are not affected.`,
                    confirmLabel: 'Delete template',
                    onConfirm: () => { deleteTemplate(t.id); notify('success', 'Template deleted') },
                  })}
                  className={`${buttonClass} inline-flex items-center gap-1.5 hover:!text-red-600`}
                ><Trash2 size={14} aria-hidden /> Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
