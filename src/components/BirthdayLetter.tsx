import { letter, recipientName, signatureName } from '../content'

type Props = { open: boolean; onOpen: () => void }

/** A sealed letter that opens when the recipient taps the seal (FR-029–FR-032). */
export function BirthdayLetter({ open, onOpen }: Props) {
  if (!open) {
    return <div className="envelope">
      <div className="envelope-flap" aria-hidden="true" />
      <p className="envelope-to">for {recipientName}</p>
      <button className="wax-seal" onClick={onOpen} aria-label="Break the seal and open your letter"><span aria-hidden="true">☾</span></button>
      <p className="envelope-hint">Tap the seal to open</p>
    </div>
  }
  return <article className="letter-paper" aria-labelledby="letter-salutation" tabIndex={0}>
    <p id="letter-salutation" className="letter-salutation">{letter.salutation}</p>
    {letter.paragraphs.map((paragraph) => <p key={paragraph.slice(0, 24)}>{paragraph}</p>)}
    <p className="letter-signoff">{letter.signOff}</p>
    <p className="signature">{signatureName}</p>
  </article>
}
