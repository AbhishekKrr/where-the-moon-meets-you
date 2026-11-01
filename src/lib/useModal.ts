import { useEffect, useRef, type RefObject } from 'react'

const focusable = 'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Dialog behaviour shared by the discovery panel, photo viewer, and confirmations:
 * focus moves inside on open, Escape closes, Tab stays inside when `trap` is set,
 * and focus returns to whatever opened the dialog.
 */
export function useModal(ref: RefObject<HTMLElement | null>, onClose: () => void, trap = true) {
  const closeRef = useRef(onClose)
  useEffect(() => { closeRef.current = onClose })

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    const node = ref.current
    const initial = node?.querySelector<HTMLElement>('[data-autofocus]') ?? node?.querySelector<HTMLElement>(focusable)
    initial?.focus({ preventScroll: true })

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); return }
      if (!trap || event.key !== 'Tab' || !node) return
      const items = Array.from(node.querySelectorAll<HTMLElement>(focusable))
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (opener?.isConnected) opener.focus()
    }
  }, [ref, trap])
}
