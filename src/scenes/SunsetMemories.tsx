import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { memories } from '../content'
import { PhotoFrame } from '../components/PhotoFrame'
import { PolaroidViewer } from '../components/PolaroidViewer'

// Gentle, fixed scatter so the Polaroids look tossed rather than gridded.
const tilts = [-6, 4, -2, 7, -5, 3, -4, 6]

/** Chapter two: the peach-pink sunset and floating Polaroids (FR-022–FR-028). */
export function SunsetMemories({ onContinue }: { onContinue: () => void }) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => { headingRef.current?.focus({ preventScroll: true }) }, [])

  return <section className="story-scene sunset-scene" aria-labelledby="sunset-title">
    <div className="sunset-sky" aria-hidden="true"><span className="sunset-sun" /><span className="sunset-clouds" /></div>
    <div className="story-scroll">
      <header className="story-intro">
        <p className="eyebrow">CHAPTER TWO</p>
        <h2 id="sunset-title" ref={headingRef} tabIndex={-1}>Sunset <em>Memories</em></h2>
        <p>Some photos I like. Tap one to see it bigger.</p>
      </header>
      <ul className="polaroid-scatter">
        {memories.map((memory, index) => <li key={memory.id} style={{ '--tilt': `${tilts[index % tilts.length]}deg`, '--float-delay': `${index * -1.3}s` } as CSSProperties}>
          <button className="polaroid" onClick={() => setViewerIndex(index)} aria-label={`Open memory ${index + 1}: ${memory.caption}`}>
            <PhotoFrame memory={memory} />
            <span className="polaroid-caption" aria-hidden="true">{memory.caption}</span>
          </button>
        </li>)}
      </ul>
      <div className="story-actions">
        <button className="journey-button" onClick={onContinue}>Now, your letter <span aria-hidden="true">→</span></button>
      </div>
    </div>
    {viewerIndex !== null && <PolaroidViewer photos={memories} index={viewerIndex} onIndexChange={setViewerIndex} onClose={() => setViewerIndex(null)} />}
  </section>
}
