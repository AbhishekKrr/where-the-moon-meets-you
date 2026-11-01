import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { deleteMessage, isInboxOwner, listMessages, setMessageStatus, type ReactionMessage } from '../services/inboxMessages'
import { getSupabase } from '../services/supabaseClient'
import '../styles/global.css'
import './inbox.css'

type View = 'inbox' | 'archived'
type Access = 'checking' | 'signed-out' | 'denied' | 'owner'

const formatDate = (value: string) => new Date(value).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })

/** Owner-only message management (FR-048–FR-051). */
export default function PrivateInbox() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [access, setAccess] = useState<Access>('checking')
  const [unconfigured] = useState(() => getSupabase() === null)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    const pending = getSupabase()
    if (!pending) return
    let unsubscribe = () => {}
    pending.catch(() => setLoadFailed(true))
    pending.then((client) => {
      setSupabase(client)
      client.auth.getSession().then(({ data }) => {
        setSession(data.session)
        if (!data.session) setAccess('signed-out')
      })
      const { data } = client.auth.onAuthStateChange((_event, next) => {
        setSession(next)
        if (!next) setAccess('signed-out')
      })
      unsubscribe = () => data.subscription.unsubscribe()
    }, () => { /* handled by the catch above */ })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabase || !session) return
    let cancelled = false
    isInboxOwner(supabase)
      .then((owner) => { if (!cancelled) setAccess(owner ? 'owner' : 'denied') })
      .catch(() => { if (!cancelled) setAccess('denied') })
    return () => { cancelled = true }
  }, [supabase, session])

  if (unconfigured) return <InboxShell><p>Supabase is not configured for this build. Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.</p></InboxShell>
  if (loadFailed) return <InboxShell><p role="alert">The inbox could not load. Check your connection and refresh the page.</p></InboxShell>
  if (!supabase || access === 'checking') return <InboxShell><p>Checking who is here…</p></InboxShell>
  if (access === 'signed-out' || !session) return <InboxShell><SignIn supabase={supabase} /></InboxShell>
  if (access === 'denied') return <InboxShell>
    <p role="alert">This account does not have access to the inbox.</p>
    <button className="ghost-button" onClick={() => supabase.auth.signOut()}>Sign out</button>
  </InboxShell>
  return <Messages supabase={supabase} email={session.user.email ?? ''} />
}

function InboxShell({ children }: { children: ReactNode }) {
  return <main className="inbox"><header className="inbox-header"><h1>Private inbox</h1></header><div className="inbox-panel">{children}</div></main>
}

function SignIn({ supabase }: { supabase: SupabaseClient }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)

  const send = async (event: FormEvent) => {
    event.preventDefault()
    setState('sending')
    setError(null)
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      // Only the pre-created owner account can sign in; no new accounts are made here.
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/private-inbox` },
    })
    if (signInError) { setState('idle'); setError('That sign-in link could not be sent. Check the address and try again.') }
    else setState('sent')
  }

  if (state === 'sent') return <p role="status">If that address belongs to the inbox owner, a sign-in link is on its way. Open it in this browser.</p>
  return <form className="inbox-signin" onSubmit={send}>
    <p>Sign in with a magic link to read private notes.</p>
    <label htmlFor="inbox-email">Email</label>
    <input id="inbox-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="soft-button" type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Send magic link'}</button>
  </form>
}

function Messages({ supabase, email }: { supabase: SupabaseClient; email: string }) {
  const [messages, setMessages] = useState<ReactionMessage[] | null>(null)
  const [view, setView] = useState<View>('inbox')
  const [error, setError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<ReactionMessage | null>(null)

  const load = useCallback(async () => {
    try {
      setMessages(await listMessages(supabase))
      setError(null)
    } catch {
      setError('Messages could not be loaded. Try refreshing.')
    }
  }, [supabase])

  useEffect(() => {
    let cancelled = false
    listMessages(supabase)
      .then((rows) => { if (!cancelled) setMessages(rows) })
      .catch(() => { if (!cancelled) setError('Messages could not be loaded. Try refreshing.') })
    return () => { cancelled = true }
  }, [supabase])

  const act = async (action: () => Promise<void>) => {
    try { await action(); setError(null) } catch { setError('That change did not save. Please try again.') }
  }

  const changeStatus = (message: ReactionMessage, status: ReactionMessage['status']) => act(async () => {
    const updated = await setMessageStatus(supabase, message, status)
    setMessages((rows) => rows?.map((row) => row.id === updated.id ? updated : row) ?? rows)
  })

  const remove = (message: ReactionMessage) => act(async () => {
    setPendingDelete(null)
    await deleteMessage(supabase, message.id)
    setMessages((rows) => rows?.filter((row) => row.id !== message.id) ?? rows)
  })

  const visible = messages?.filter((row) => view === 'archived' ? row.status === 'archived' : row.status !== 'archived') ?? []
  const unread = messages?.filter((row) => row.status === 'new').length ?? 0

  return <main className="inbox">
    <header className="inbox-header">
      <h1>Private inbox</h1>
      <div><span className="inbox-email">{email}</span><button className="ghost-button" onClick={() => supabase.auth.signOut()}>Sign out</button></div>
    </header>
    <div className="inbox-tabs" role="tablist" aria-label="Message folders">
      <button role="tab" aria-selected={view === 'inbox'} onClick={() => setView('inbox')}>Inbox {unread > 0 && <b>{unread} new</b>}</button>
      <button role="tab" aria-selected={view === 'archived'} onClick={() => setView('archived')}>Archived</button>
      <button className="link-button" onClick={load}>Refresh</button>
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {messages === null && !error && <p>Loading messages…</p>}
    {messages !== null && visible.length === 0 && <p className="inbox-empty">{view === 'archived' ? 'Nothing archived.' : 'No notes yet.'}</p>}
    <ul className="inbox-list">
      {visible.map((message) => <li key={message.id} className={`inbox-message status-${message.status}`}>
        <div className="inbox-meta">
          <strong>{message.display_name || 'No name given'}</strong>
          <span>{formatDate(message.created_at)}</span>
          <span className="status-badge">{message.status === 'new' ? 'Unread' : message.status === 'read' ? 'Read' : 'Archived'}</span>
        </div>
        {/* Rendered as plain text, never as HTML. */}
        <p className="inbox-text">{message.message}</p>
        <div className="inbox-actions">
          {message.status === 'new' && <button className="ghost-button" onClick={() => changeStatus(message, 'read')}>Mark read</button>}
          {message.status === 'read' && <button className="ghost-button" onClick={() => changeStatus(message, 'new')}>Mark unread</button>}
          {message.status === 'archived'
            ? <button className="ghost-button" onClick={() => changeStatus(message, message.read_at ? 'read' : 'new')}>Move to inbox</button>
            : <button className="ghost-button" onClick={() => changeStatus(message, 'archived')}>Archive</button>}
          <button className="ghost-button danger" onClick={() => setPendingDelete(message)}>Delete</button>
        </div>
      </li>)}
    </ul>
    {pendingDelete && <ConfirmDialog
      title="Delete this note permanently?"
      body="It will be removed from the database. Any email notification already sent cannot be retracted."
      confirmLabel="Delete forever"
      onConfirm={() => remove(pendingDelete)}
      onCancel={() => setPendingDelete(null)} />}
  </main>
}
