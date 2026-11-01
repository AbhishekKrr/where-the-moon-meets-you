import { useEffect, useRef } from 'react'
import type { Memory } from '../content'
import { useModal } from '../lib/useModal'
import { PhotoFrame } from './PhotoFrame'

type Props = {
  photos: Memory[]
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
}

/** Enlarged photo view. Next/previous wrap around the collection (FR-026). */
export function PolaroidViewer({ photos, index, onIndexChange, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  useModal(ref, onClose)
  const photo = photos[index]
  const step = (delta: number) => onIndexChange((index + delta + photos.length) % photos.length)
  const stepRef = useRef(step)
  useEffect(() => { stepRef.current = step })

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') stepRef.current(1)
      if (event.key === 'ArrowLeft') stepRef.current(-1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return <div className="modal-backdrop photo-backdrop" onClick={onClose}>
    <div ref={ref} className="polaroid-viewer" role="dialog" aria-modal="true" aria-label={`Memory ${index + 1} of ${photos.length}`} onClick={(event) => event.stopPropagation()}>
      <button className="viewer-close" onClick={onClose} aria-label="Close photo" data-autofocus>×</button>
      <figure className="polaroid large" key={photo.id}>
        <PhotoFrame memory={photo} eager />
        <figcaption>{photo.caption}</figcaption>
      </figure>
      <div className="viewer-controls">
        <button onClick={() => step(-1)} aria-label="Previous memory">←</button>
        <span aria-live="polite">{index + 1} / {photos.length}</span>
        <button onClick={() => step(1)} aria-label="Next memory">→</button>
      </div>
    </div>
  </div>
}
