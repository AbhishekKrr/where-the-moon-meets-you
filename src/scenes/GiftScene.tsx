import { useEffect, useRef, useState } from 'react'
import { gift, giftCode, recipientName, signatureName } from '../content'

type Props = {
  alreadyOpened: boolean
  onOpened: () => void
  onContinue: () => void
}

/** A small gift box that opens to reveal the gift card, after the voice note. */
export function GiftScene({ alreadyOpened, onOpened, onContinue }: Props) {
  const [open, setOpen] = useState(alreadyOpened)
  const [copied, setCopied] = useState<'idle' | 'copied' | 'failed'>('idle')
  const [imageFailed, setImageFailed] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const codeRef = useRef<HTMLInputElement>(null)
  useEffect(() => { headingRef.current?.focus({ preventScroll: true }) }, [])

  const openGift = () => {
    setOpen(true)
    onOpened()
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(giftCode)
      setCopied('copied')
    } catch {
      // Clipboard can be blocked; select the code so it can be copied by hand.
      codeRef.current?.select()
      setCopied('failed')
    }
  }

  return <section className={`story-scene gift-scene ${open ? 'is-open' : ''}`} aria-labelledby="gift-title">
    <div className="finale-sky settled" aria-hidden="true"><span className="finale-stars" /></div>
    <div className="story-scroll">
      <header className="story-intro">
        <p className="eyebrow">{gift.eyebrow}</p>
        <h2 id="gift-title" ref={headingRef} tabIndex={-1}>And a small <em>gift</em></h2>
        <p>{gift.intro}</p>
      </header>

      {!open && <div className="gift-box-wrap">
        <button className="gift-box" onClick={openGift} aria-label="Open your gift">
          <span className="gift-lid" aria-hidden="true"><span className="gift-bow" /></span>
          <span className="gift-base" aria-hidden="true" />
        </button>
        <p className="gift-hint">Go on, open it</p>
      </div>}

      {open && <div className="gift-reveal" aria-live="polite">
        {gift.image && !imageFailed
          ? <figure className="gift-card gift-card-photo">
            <img src={gift.image} alt={gift.imageAlt} onError={() => setImageFailed(true)} />
            <figcaption>
              {gift.amount && <span className="gift-card-amount">{gift.amount}</span>}
              <span className="gift-card-message">{gift.message}</span>
              <span className="signature gift-card-signature">{signatureName}</span>
            </figcaption>
          </figure>
          : <div className="gift-card">
            <span className="gift-card-moon" aria-hidden="true" />
            <p className="gift-card-label">{gift.cardLabel}</p>
            {gift.amount && <p className="gift-card-amount">{gift.amount}</p>}
            <p className="gift-card-for">for {recipientName}</p>
            <p className="gift-card-message">{gift.message}</p>
            <p className="signature gift-card-signature">{signatureName}</p>
          </div>}

        {giftCode
          ? <div className="gift-code">
            <label htmlFor="gift-code">Your claim code</label>
            <div className="gift-code-row">
              <input id="gift-code" ref={codeRef} value={giftCode} readOnly onFocus={(event) => event.target.select()} />
              <button className="soft-button" onClick={copyCode}>{copied === 'copied' ? 'Copied ✓' : 'Copy code'}</button>
            </div>
            <p className="gift-code-status" role="status">{copied === 'failed' ? 'Copying was blocked here, so the code is selected for you to copy.' : ''}</p>
            <a className="ghost-button gift-redeem" href={gift.redeemUrl} target="_blank" rel="noopener noreferrer">Redeem on Amazon ↗</a>
          </div>
          : <p className="gift-delivery">{gift.deliveryNote}</p>}

        <div className="story-actions">
          <button className="journey-button" onClick={onContinue}>Continue <span aria-hidden="true">→</span></button>
        </div>
      </div>}
    </div>
  </section>
}
