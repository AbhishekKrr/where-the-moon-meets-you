import { useRef, type CSSProperties } from 'react'
import { memories, type Discovery } from '../content'
import { useModal } from '../lib/useModal'
import { PhotoFrame } from './PhotoFrame'

type Props = { discovery: Discovery; style?: CSSProperties; onClose: () => void }

/** A dismissible, non-modal panel: closing it never undoes progress (FR-013). */
export function DiscoveryMessage({ discovery, style, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  useModal(ref, onClose, false)
  const photo = memories.find((memory) => memory.id === discovery.photoId)
  return <div ref={ref} className={`discovery-message ${photo ? 'with-photo' : ''}`} style={style} role="dialog" aria-labelledby="discovery-title" aria-describedby="discovery-text">
    <button onClick={onClose} aria-label="Close discovery message" data-autofocus>×</button>
    <span aria-hidden="true">☾</span>
    <h3 id="discovery-title">{discovery.name}</h3>
    <p id="discovery-text">{discovery.message}</p>
    {photo && <figure className="discovery-photo"><PhotoFrame memory={photo} eager /><figcaption>{photo.caption}</figcaption></figure>}
  </div>
}
