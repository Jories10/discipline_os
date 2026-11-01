import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { useAppStore, type CategoryFields } from '@/stores/useAppStore'
import { useUiStore } from '@/stores/useUiStore'
import type { Category } from '@/domain/types'
import Field, { buttonClass, inputClass, primaryButtonClass } from '@/components/Field'

interface EditorProps {
  initial: CategoryFields
  submitLabel: string
  /** Names already taken by other categories, compared case-insensitively. */
  takenNames: string[]
  onSave: (fields: CategoryFields) => void
  onCancel?: () => void
}

function CategoryEditor({ initial, submitLabel, takenNames, onSave, onCancel }: EditorProps) {
  const [name, setName] = useState(initial.name)
  const [color, setColor] = useState(initial.color)
  const [purpose, setPurpose] = useState(initial.purpose)
  const [error, setError] = useState<string>()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return setError('Enter a category name')
    if (trimmed.length > 60) return setError('Keep the name under 60 characters')
    if (takenNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())) return setError('A category with this name already exists')
    onSave({ name: trimmed, color, purpose: purpose.trim() })
    if (!onCancel) {
      setName('')
      setPurpose('')
    }
    setError(undefined)
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-2 sm:grid-cols-[auto_1fr_1fr_auto] sm:items-end">
      <Field label="Color">
        {(id) => <input id={id} type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-12 cursor-pointer rounded-md border border-line bg-surface p-1" />}
      </Field>
      <Field label="Name" error={error}>
        {(id, desc) => <input id={id} aria-describedby={desc} aria-invalid={!!error} value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />}
      </Field>
      <Field label="Purpose (optional)">
        {(id) => <input id={id} value={purpose} onChange={(e) => setPurpose(e.target.value)} className={inputClass} />}
      </Field>
      <div className="flex gap-2">
        <button type="submit" className={primaryButtonClass}>{submitLabel}</button>
        {onCancel && <button type="button" onClick={onCancel} className={buttonClass}>Cancel</button>}
      </div>
    </form>
  )
}

function CategoryRow({ category }: { category: Category }) {
  const categories = useAppStore((s) => s.categories)
  const usage = useAppStore((s) => s.tasks.filter((t) => t.categoryId === category.id).length)
  const updateCategory = useAppStore((s) => s.updateCategory)
  const deleteCategory = useAppStore((s) => s.deleteCategory)
  const notify = useUiStore((s) => s.notify)

  const others = categories.filter((c) => c.id !== category.id)
  const [mode, setMode] = useState<'view' | 'edit' | 'delete'>('view')
  const [replacement, setReplacement] = useState(others[0]?.id ?? '')

  if (mode === 'edit') {
    return (
      <li className="py-3">
        <CategoryEditor
          initial={category}
          submitLabel="Save"
          takenNames={others.map((c) => c.name)}
          onCancel={() => setMode('view')}
          onSave={(f) => { updateCategory(category.id, f); notify('success', 'Category updated'); setMode('view') }}
        />
      </li>
    )
  }

  return (
    <li className="py-3">
      <div className="flex items-center gap-3">
        <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: category.color }} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{category.name}</p>
          <p className="truncate text-xs text-muted">{category.purpose || 'No description'} · {usage} {usage === 1 ? 'task' : 'tasks'}</p>
        </div>
        <button onClick={() => setMode('edit')} aria-label={`Edit ${category.name}`} className="rounded p-1.5 text-muted hover:bg-ink/10 hover:text-ink"><Pencil size={15} /></button>
        <button
          onClick={() => setMode('delete')}
          disabled={others.length === 0}
          title={others.length === 0 ? 'Keep at least one category' : undefined}
          aria-label={`Delete ${category.name}`}
          className="rounded p-1.5 text-muted hover:bg-ink/10 hover:text-red-600 disabled:opacity-40"
        ><Trash2 size={15} /></button>
      </div>

      {mode === 'delete' && (
        <div className="mt-3 rounded-md border border-line bg-ink/5 p-3 text-sm">
          {usage > 0 ? (
            <Field label={`${usage} ${usage === 1 ? 'task uses' : 'tasks use'} this category. Move them to:`}>
              {(id) => (
                <select id={id} value={replacement} onChange={(e) => setReplacement(e.target.value)} className={inputClass}>
                  {others.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
            </Field>
          ) : (
            <p>Delete "{category.name}"? It has no tasks.</p>
          )}
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => { deleteCategory(category.id, usage > 0 ? replacement : undefined); notify('success', 'Category deleted') }}
              className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              {usage > 0 ? 'Move tasks and delete' : 'Delete category'}
            </button>
            <button onClick={() => setMode('view')} className={buttonClass}>Cancel</button>
          </div>
        </div>
      )}
    </li>
  )
}

export default function CategoryManager() {
  const categories = useAppStore((s) => s.categories)
  const addCategory = useAppStore((s) => s.addCategory)
  const notify = useUiStore((s) => s.notify)

  return (
    <section aria-labelledby="cat-heading">
      <h2 id="cat-heading" className="text-base font-semibold tracking-tight">Categories</h2>
      <p className="mb-4 mt-1 text-sm text-muted">Each category has its own color, shown on task cards and, later, in analytics.</p>
      <div className="rounded-lg border border-line bg-surface p-4">
        <CategoryEditor
          initial={{ name: '', color: '#4f46e5', purpose: '' }}
          submitLabel="Add category"
          takenNames={categories.map((c) => c.name)}
          onSave={(f) => { addCategory(f); notify('success', 'Category added') }}
        />
        <ul className="mt-4 divide-y divide-line border-t border-line">
          {categories.map((c) => <CategoryRow key={c.id} category={c} />)}
        </ul>
      </div>
    </section>
  )
}
