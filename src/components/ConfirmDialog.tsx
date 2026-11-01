import Modal from './Modal'
import { buttonClass } from './Field'
import { useUiStore } from '@/stores/useUiStore'

export default function ConfirmDialog() {
  const confirm = useUiStore((s) => s.confirm)
  const close = useUiStore((s) => s.closeConfirm)
  if (!confirm) return null

  return (
    <Modal title={confirm.title} onClose={close}>
      <p className="mb-5 text-sm text-muted">{confirm.message}</p>
      <div className="flex justify-end gap-2">
        <button autoFocus onClick={close} className={buttonClass}>
          Cancel
        </button>
        <button
          onClick={() => {
            confirm.onConfirm()
            close()
          }}
          className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          {confirm.confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
