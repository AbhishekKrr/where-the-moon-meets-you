import { lazy, Suspense } from 'react'
import App from './App.tsx'
import './styles/global.css'

// The owner inbox is a separate chunk so the birthday experience stays light (FR-053).
// The path is only a convenience: access is enforced by Supabase Auth and RLS (FR-048).
const PrivateInbox = lazy(() => import('./inbox/PrivateInbox.tsx'))

export default function Root() {
  const isInbox = window.location.pathname.replace(/\/+$/, '') === '/private-inbox'
  if (!isInbox) return <App />
  return <Suspense fallback={<p className="inbox-loading">Opening the inbox…</p>}><PrivateInbox /></Suspense>
}
