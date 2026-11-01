import { useUiStore } from '@/stores/useUiStore'

export default function Toaster() {
  const toasts = useUiStore((s) => s.toasts)
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:items-end lg:px-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto rounded-md px-4 py-2 text-sm text-white shadow-lg ${t.kind === 'error' ? 'bg-red-600' : 'bg-ink text-canvas'}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
