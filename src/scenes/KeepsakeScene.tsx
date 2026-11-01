import { useEffect, useRef } from 'react'
import { closingLine } from '../content'
import { BirthdayCardDownload } from '../components/BirthdayCardDownload'
import { ReactionMessageForm } from '../components/ReactionMessageForm'

type Props = {
  onDownloaded: () => void
  onReadLetter: () => void
  onOpenGift: () => void
  onReplayEnding: () => void
  onRestart: () => void
}

/** Keepsake card, private note, and the ways back in (FR-038–FR-041, FR-056). */
export function KeepsakeScene({ onDownloaded, onReadLetter, onOpenGift, onReplayEnding, onRestart }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => { headingRef.current?.focus({ preventScroll: true }) }, [])

  return <section className="story-scene keepsake-scene" aria-labelledby="keepsake-title">
    <div className="finale-sky settled" aria-hidden="true"><span className="finale-stars" /></div>
    <div className="story-scroll">
      <header className="story-intro">
        <p className="eyebrow">SOMETHING TO KEEP</p>
        <h2 id="keepsake-title" ref={headingRef} tabIndex={-1}>Your <em>Birthday Card</em></h2>
        <p>Download it if you want to keep it.</p>
      </header>
      <BirthdayCardDownload onDownloaded={onDownloaded} />
      <ReactionMessageForm />
      <p className="closing-line keepsake-closing">{closingLine}</p>
      <nav className="revisit-links" aria-label="Revisit">
        <button className="link-button" onClick={onReadLetter}>Read Your Letter Again</button>
        <button className="link-button" onClick={onOpenGift}>See your gift again</button>
        <button className="link-button" onClick={onReplayEnding}>Watch the ending again</button>
        <button className="link-button quiet" onClick={onRestart}>Start the Journey Again</button>
      </nav>
    </div>
  </section>
}
