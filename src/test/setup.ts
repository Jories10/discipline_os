import { afterEach } from 'vitest'

// jsdom has no <dialog> modal support or ResizeObserver; emulate just enough for the app and Recharts.
if (typeof HTMLDialogElement !== 'undefined') {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }
}
if (typeof window !== 'undefined' && !('ResizeObserver' in window)) {
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
}
if (typeof document !== 'undefined') {
  const { cleanup } = await import('@testing-library/react')
  afterEach(cleanup)
}
