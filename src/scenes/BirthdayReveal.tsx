import { useEffect, useRef } from 'react'
import { birthdayGreeting, recipientName } from '../content'

/** The greeting revealed after the door (FR-008/FR-009). */
export function BirthdayReveal({ onBegin }: { onBegin: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => { headingRef.current?.focus({ preventScroll: true }) }, [])
  return <div className="birthday-reveal">
    <p className="eyebrow">SURPRISE</p>
    <h1 ref={headingRef} tabIndex={-1}>Happy Birthday,<span>{recipientName}.</span></h1>
    <p className="intro">{birthdayGreeting}</p>
    <div className="reveal-star" aria-hidden="true">✧</div>
    <p className="closing-line">There’s more. Go explore.</p>
    <button className="journey-button" onClick={onBegin}>Begin the journey <span aria-hidden="true">→</span></button>
  </div>
}
