import { useEffect, useId, useRef, type ReactNode } from 'react'

interface Props {
  wide?: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

/** Built on the native <dialog>: focus trapping, Escape handling, and inert background come from the browser. */
export default function Modal({ title, onClose, children, wide }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
    return () => dialog?.close()
  }, [])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onMouseDown={(e) => {
        if (e.target === ref.current) onClose()
      }}
      className={`m-auto max-h-[92vh] w-[calc(100%-1.5rem)] ${wide ? 'max-w-2xl' : 'max-w-lg'} overflow-y-auto rounded-xl border border-line bg-surface p-0 text-ink shadow-xl backdrop:bg-black/40`}
    >
      <div className="p-5">
        <h2 id={titleId} className="mb-4 text-base font-semibold tracking-tight">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  )
}
