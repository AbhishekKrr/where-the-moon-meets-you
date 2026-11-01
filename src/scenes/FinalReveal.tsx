import { useEffect, useRef } from 'react'
import { discoveries, finalWish, signatureName } from '../content'
import { ConstellationSymbol } from '../components/ConstellationSymbol'
import { VoiceNotePrompt } from '../components/VoiceNotePrompt'

const allLit = discoveries.map((item) => item.id)

/** The sunset melting into starlight, the final wish, and the voice-note choice (FR-033–FR-036). */
export function FinalReveal({ onContinue }: { onContinue: () => void }) {
  const wishRef = useRef<HTMLParagraphElement>(null)
  useEffect(() => { wishRef.current?.focus({ preventScroll: true }) }, [])

  return <section className="story-scene finale-scene" aria-label="The final wish">
    <div className="finale-sky" aria-hidden="true">
      <span className="finale-sunset" /><span className="finale-stars" /><span className="finale-moon" />
    </div>
    <div className="story-scroll finale-content">
      <ConstellationSymbol found={allLit} className="finale-constellation" showGuides />
      <p ref={wishRef} tabIndex={-1} className="final-wish">{finalWish}</p>
      <p className="signature finale-signature">{signatureName}</p>
      <div className="finale-voice"><VoiceNotePrompt onDone={onContinue} /></div>
    </div>
  </section>
}
