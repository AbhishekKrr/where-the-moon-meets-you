import { useEffect } from 'react'

/** A discreet, non-blocking message that fades on its own (FR-005). */
export function Notice({ message, onDismiss }: { message: string | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(onDismiss, 7000)
    return () => window.clearTimeout(timer)
  }, [message, onDismiss])

  return <div className="notice-region" role="status" aria-live="polite">
    {message && <p className="notice"><span>{message}</span><button onClick={onDismiss} aria-label="Dismiss notice">×</button></p>}
  </div>
}
