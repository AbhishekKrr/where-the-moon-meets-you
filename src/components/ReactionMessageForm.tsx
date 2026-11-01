import { useId, useState, type FormEvent } from 'react'
import { MESSAGE_LIMIT, NAME_LIMIT, validateReaction } from '../lib/reaction'
import { isSupabaseConfigured } from '../services/config'
import { submitReaction } from '../services/reactionMessages'

type Status = 'idle' | 'sending' | 'sent'

/** Optional private note to the owner (FR-041–FR-045). Never displayed publicly. */
export function ReactionMessageForm() {
  const id = useId()
  const [displayName, setDisplayName] = useState('')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [deliveryFailed, setDeliveryFailed] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (status === 'sending') return
    const problem = validateReaction(message, displayName)
    if (problem) { setError(problem); return }
    setError(null)
    setStatus('sending')
    const result = await submitReaction({ displayName, message, website })
    setDeliveryFailed(!result.ok)
    if (result.ok) {
      setStatus('sent')
      setMessage('')
      setDisplayName('')
    } else {
      // Keep the words exactly as typed so nothing is lost (FR-044).
      setStatus('idle')
      setError(result.error ?? 'The note could not be delivered just now. Please try again.')
    }
  }

  if (status === 'sent') {
    return <div className="reaction-form sent" role="status">
      <span aria-hidden="true">✦</span>
      <h3>Got it</h3>
      <p>It came straight to me. Thanks for writing.</p>
      <button className="link-button" onClick={() => setStatus('idle')}>Write another note</button>
    </div>
  }

  return <form className="reaction-form" onSubmit={submit} noValidate aria-describedby={`${id}-privacy`}>
    <h3>Want to say something back?</h3>
    <p id={`${id}-privacy`} className="privacy-note">Only I’ll see this. It doesn’t show up anywhere on the site, and your name is optional.</p>
    {!isSupabaseConfigured && <p className="form-error" role="note">Notes aren’t working yet, sorry. Tell me in person instead.</p>}
    <fieldset disabled={!isSupabaseConfigured || status === 'sending'}>
      <label htmlFor={`${id}-name`}>Name or nickname <small>(optional)</small></label>
      <input id={`${id}-name`} value={displayName} maxLength={NAME_LIMIT} autoComplete="nickname" onChange={(event) => setDisplayName(event.target.value)} />
      <label htmlFor={`${id}-message`}>Your note</label>
      <textarea id={`${id}-message`} value={message} maxLength={MESSAGE_LIMIT} rows={5} aria-describedby={`${id}-count`} aria-invalid={Boolean(error)} onChange={(event) => setMessage(event.target.value)} />
      <p id={`${id}-count`} className={`char-count ${message.length >= MESSAGE_LIMIT ? 'at-limit' : ''}`}>{message.length.toLocaleString('en-GB')} / {MESSAGE_LIMIT.toLocaleString('en-GB')}</p>
      <div className="honeypot" aria-hidden="true">
        <label htmlFor={`${id}-website`}>Website</label>
        <input id={`${id}-website`} tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="soft-button" type="submit">{status === 'sending' ? 'Sending…' : deliveryFailed ? 'Try again' : 'Send privately'}</button>
    </fieldset>
  </form>
}
