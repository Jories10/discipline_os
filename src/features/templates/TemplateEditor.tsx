import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import Modal from '@/components/Modal'
import { handleTabKeys } from '@/components/tabKeys'
import Field, { buttonClass, inputClass, primaryButtonClass } from '@/components/Field'
import { blockFormSchema, blockToForm, formToBlock, type BlockFormValues } from '@/domain/taskForm'
import { buildTemplate } from '@/domain/routines'
import { DAY_NAMES, formatTime, overlaps } from '@/domain/time'
import type { Category, Template, TemplateBlock } from '@/domain/types'
import { useAppStore } from '@/stores/useAppStore'
import { useUiStore } from '@/stores/useUiStore'

const emptyDays = (scope: Template['scope']): TemplateBlock[][] => Array.from({ length: scope === 'day' ? 1 : 7 }, () => [])

function BlockForm({ initial, categories, onSave, onCancel }: { initial?: TemplateBlock; categories: Category[]; onSave: (b: TemplateBlock) => void; onCancel: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<BlockFormValues>({
    resolver: zodResolver(blockFormSchema),
    defaultValues: initial
      ? blockToForm(initial)
      : { title: '', description: '', start: '09:00', end: '10:00', categoryId: categories[0]?.id ?? '', priority: 'medium' },
  })

  // Submitted programmatically so pressing Enter here never submits the surrounding template form.
  return (
    <div className="space-y-2 rounded-md border border-line bg-ink/5 p-3">
      <Field label="Title" error={errors.title?.message}>
        {(id, desc) => <input id={id} autoFocus aria-describedby={desc} className={inputClass} {...register('title')} />}
      </Field>
      <Field label="Description (optional)" error={errors.description?.message}>
        {(id) => <input id={id} className={inputClass} {...register('description')} />}
      </Field>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Field label="Start" error={errors.start?.message}>
          {(id, desc) => <input id={id} type="time" step={300} aria-describedby={desc} className={inputClass} {...register('start')} />}
        </Field>
        <Field label="End" error={errors.end?.message}>
          {(id, desc) => <input id={id} type="time" step={300} aria-describedby={desc} className={inputClass} {...register('end')} />}
        </Field>
        <Field label="Category">
          {(id) => (
            <select id={id} className={inputClass} {...register('categoryId')}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </Field>
        <Field label="Priority">
          {(id) => (
            <select id={id} className={inputClass} {...register('priority')}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
            </select>
          )}
        </Field>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={buttonClass}>Cancel</button>
        <button type="button" onClick={handleSubmit((v) => onSave(formToBlock(v)))} className={primaryButtonClass}>Save block</button>
      </div>
    </div>
  )
}

export default function TemplateEditor({ templateId }: { templateId?: string }) {
  const close = useUiStore((s) => s.closeRoutine)
  const notify = useUiStore((s) => s.notify)
  const templates = useAppStore((s) => s.templates)
  const categories = useAppStore((s) => s.categories)
  const addTemplate = useAppStore((s) => s.addTemplate)
  const updateTemplate = useAppStore((s) => s.updateTemplate)

  const existing = templates.find((t) => t.id === templateId)
  const [name, setName] = useState(existing?.name ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [scope, setScope] = useState<Template['scope']>(existing?.scope ?? 'day')
  const [days, setDays] = useState<TemplateBlock[][]>(() => (existing ? existing.days.map((d) => [...d]) : emptyDays('day')))
  const [active, setActive] = useState(0)
  const [editing, setEditing] = useState<number | 'new' | null>(null)
  const [error, setError] = useState<string>()

  if (templateId && !existing) return null

  const blocks = days[active] ?? []
  const ordered = blocks.map((block, index) => ({ block, index })).sort((a, b) => a.block.startMin - b.block.startMin)

  const changeScope = (next: Template['scope']) => {
    setScope(next)
    setDays(emptyDays(next))
    setActive(0)
    setEditing(null)
  }

  const saveBlock = (block: TemplateBlock) => {
    setDays((prev) =>
      prev.map((d, di) => (di !== active ? d : editing === 'new' ? [...d, block] : d.map((b, i) => (i === editing ? block : b)))),
    )
    setEditing(null)
  }

  const removeBlock = (index: number) => setDays((prev) => prev.map((d, di) => (di === active ? d.filter((_, i) => i !== index) : d)))

  const save = () => {
    const trimmed = name.trim()
    if (!trimmed) return setError('Give the template a name')
    if (trimmed.length > 60) return setError('Keep the name under 60 characters')
    if (days.every((d) => d.length === 0)) return setError('Add at least one block')
    if (existing) updateTemplate(existing.id, { name: trimmed, description: description.trim(), days })
    else addTemplate(buildTemplate(trimmed, scope, days, description))
    notify('success', existing ? 'Template updated' : 'Template created')
    close()
  }

  return (
    <Modal title={existing ? 'Edit template' : 'New template'} onClose={close} wide>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name" error={error}>
            {(id, desc) => <input id={id} autoFocus aria-describedby={desc} aria-invalid={!!error} value={name} onChange={(e) => { setName(e.target.value); setError(undefined) }} className={inputClass} />}
          </Field>
          <Field label="Type">
            {(id) => (
              <select id={id} value={scope} disabled={!!existing} onChange={(e) => changeScope(e.target.value as Template['scope'])} className={inputClass}>
                <option value="day">Single day</option>
                <option value="week">Full week (Monday to Sunday)</option>
              </select>
            )}
          </Field>
        </div>
        <Field label="Description (optional)">
          {(id) => <input id={id} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />}
        </Field>
        <p className="text-xs text-muted">Changes here only affect tasks you schedule from this template in the future. Tasks already on your calendar are never modified.</p>

        {scope === 'week' && (
          <div role="tablist" aria-label="Day of the week" className="flex gap-1 overflow-x-auto">
            {DAY_NAMES.map((d, i) => (
              <button
                key={d}
                role="tab"
                aria-selected={i === active}
                tabIndex={i === active ? 0 : -1}
                onKeyDown={(e) => handleTabKeys(e, i, DAY_NAMES.length, (n) => { setActive(n); setEditing(null) })}
                onClick={() => { setActive(i); setEditing(null) }}
                className={`rounded-md border px-3 py-1.5 text-xs ${i === active ? 'border-accent bg-accent/10 text-accent' : 'border-line text-muted'}`}
              >
                {d.slice(0, 3)} <span className="opacity-60">{days[i].length}</span>
              </button>
            ))}
          </div>
        )}

        <ul className="space-y-1.5">
          {ordered.length === 0 && editing !== 'new' && <li className="rounded-md border border-dashed border-line p-3 text-sm text-muted">No blocks yet.</li>}
          {ordered.map(({ block, index }) =>
            editing === index ? (
              <li key={index}><BlockForm initial={block} categories={categories} onSave={saveBlock} onCancel={() => setEditing(null)} /></li>
            ) : (
              <li key={index} className="flex items-center gap-2 rounded-md border border-line bg-surface p-2.5 text-sm">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: categories.find((c) => c.id === block.categoryId)?.color ?? '#64748b' }} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{block.title}</p>
                  <p className="text-xs text-muted">
                    {formatTime(block.startMin)} to {formatTime(block.endMin)}
                    {blocks.some((o, j) => j !== index && overlaps(block, o)) && <span className="ml-2 text-amber-600 dark:text-amber-400">Overlaps another block</span>}
                  </p>
                </div>
                <button onClick={() => setEditing(index)} aria-label={`Edit ${block.title}`} className="rounded p-1.5 text-muted hover:bg-ink/10"><Pencil size={14} /></button>
                <button onClick={() => removeBlock(index)} aria-label={`Remove ${block.title}`} className="rounded p-1.5 text-muted hover:bg-ink/10 hover:text-red-600"><Trash2 size={14} /></button>
              </li>
            ),
          )}
          {editing === 'new' && <li><BlockForm categories={categories} onSave={saveBlock} onCancel={() => setEditing(null)} /></li>}
        </ul>

        {editing === null && (
          <button onClick={() => setEditing('new')} className={`${buttonClass} inline-flex items-center gap-1.5`}><Plus size={14} aria-hidden /> Add block</button>
        )}

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <button onClick={close} className={buttonClass}>Cancel</button>
          <button onClick={save} className={primaryButtonClass}>{existing ? 'Save template' : 'Create template'}</button>
        </div>
      </div>
    </Modal>
  )
}
