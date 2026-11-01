import { useState } from 'react'
import type { Memory } from '../content'

/** An image that falls back to a styled placeholder if the file is missing (FR-023/FR-028). */
export function PhotoFrame({ memory, className = '', eager = false }: { memory: Memory; className?: string; eager?: boolean }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const failed = failedSrc === memory.src
  return <div className={`photo-frame ${failed ? 'is-placeholder' : ''} ${className}`}>
    {failed
      ? <div className="photo-placeholder" role="img" aria-label={`${memory.alt} (photo coming soon)`}><span aria-hidden="true">☾</span></div>
      : <img src={memory.src} alt={memory.alt} style={memory.focus ? { objectPosition: memory.focus } : undefined} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailedSrc(memory.src)} />}
  </div>
}
