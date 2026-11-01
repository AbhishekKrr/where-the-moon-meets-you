import { useEffect, useRef, useState } from 'react'
import { BirthdayLetter } from '../components/BirthdayLetter'

type Props = {
  onOpened: () => void
  onContinue: () => void
  /** Present when the letter was reopened from a return visit. */
  onBack?: () => void
}

/** The sealed letter beneath the moon (FR-029). */
export function LetterScene({ onOpened, onContinue, onBack }: Props) {
  const [open, setOpen] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => { headingRef.current?.focus({ preventScroll: true }) }, [])

  const openLetter = () => {
    setOpen(true)
    onOpened()
  }

  return <section className={`story-scene letter-scene ${open ? 'is-open' : ''}`} aria-labelledby="letter-title">
    <div className="letter-sky" aria-hidden="true"><span className="letter-moon" /></div>
    <div className="story-scroll">
      <header className="story-intro">
        <p className="eyebrow">CHAPTER THREE</p>
        <h2 id="letter-title" ref={headingRef} tabIndex={-1}>A Letter <em>for You</em></h2>
      </header>
      <BirthdayLetter open={open} onOpen={openLetter} />
      {open && <div className="story-actions">
        <button className="journey-button" onClick={onContinue}>Keep going <span aria-hidden="true">→</span></button>
        {onBack && <button className="link-button" onClick={onBack}>Back to your card</button>}
      </div>}
    </div>
  </section>
}
