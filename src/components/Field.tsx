import { useId, type ReactNode } from 'react'

export const inputClass =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted/70 disabled:opacity-50'

export const buttonClass =
  'rounded-md border border-line bg-surface px-3 py-2 text-sm hover:bg-ink/5 disabled:opacity-50'
export const primaryButtonClass =
  'rounded-md bg-accent px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50'

interface Props {
  label: string
  error?: string
  children: (id: string, describedBy: string | undefined) => ReactNode
}

export default function Field({ label, error, children }: Props) {
  const id = useId()
  const errId = `${id}-err`
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-muted">
        {label}
      </label>
      {children(id, error ? errId : undefined)}
      {error && (
        <p id={errId} className="mt-1 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
