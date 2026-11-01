// Supabase Edge Function (Deno): the only public pathway for private reaction messages.
// Validates input, rate-limits by hashed IP, stores with the service role, then
// notifies the owner by email. Message contents are never logged (NFR-014).
//
// Deploy: supabase functions deploy submit-reaction --no-verify-jwt
// Secrets: ALLOWED_ORIGINS, RATE_LIMIT_SALT, RESEND_API_KEY (optional), OWNER_EMAIL (optional), NOTIFY_FROM (optional)

import { createClient } from 'npm:@supabase/supabase-js@2'

const MESSAGE_LIMIT = 1000
const NAME_LIMIT = 60
const MAX_BODY_BYTES = 8_000
const RATE_WINDOW_MINUTES = 10
const RATE_MAX_PER_WINDOW = 5

const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').map((origin) => origin.trim()).filter(Boolean)

function corsHeaders(origin: string | null): Record<string, string> {
  const allow = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0] ?? ''
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    Vary: 'Origin',
  }
}

function json(status: number, body: unknown, origin: string | null) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } })
}

async function sha256(text: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)

async function notifyOwner(id: string, displayName: string | null, message: string) {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  const to = Deno.env.get('OWNER_EMAIL')
  if (!apiKey || !to) return 'skipped'
  const from = Deno.env.get('NOTIFY_FROM') ?? 'Little World <onboarding@resend.dev>'
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      subject: 'A new note arrived in your little world',
      text: `From: ${displayName ?? 'No name given'}\n\n${message}\n\nManage it in /private-inbox.`,
      html: `<p><strong>From:</strong> ${escapeHtml(displayName ?? 'No name given')}</p><p style="white-space:pre-wrap">${escapeHtml(message)}</p><p>Manage it in <code>/private-inbox</code>.</p>`,
    }),
  })
  if (!response.ok) {
    console.error(`notify failed for message ${id}: status ${response.status}`)
    return 'failed'
  }
  return 'sent'
}

Deno.serve(async (request) => {
  const origin = request.headers.get('origin')
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) })
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed' }, origin)
  if (allowedOrigins.length > 0 && origin && !allowedOrigins.includes(origin)) return json(403, { error: 'Origin not allowed' }, origin)

  const raw = await request.text()
  if (raw.length > MAX_BODY_BYTES) return json(400, { error: 'That note is too long.' }, origin)

  let body: Record<string, unknown>
  try { body = JSON.parse(raw) } catch { return json(400, { error: 'That note could not be read.' }, origin) }

  // Honeypot: quietly accept and discard bot submissions.
  if (typeof body.website === 'string' && body.website.trim() !== '') return json(200, { ok: true }, origin)

  const message = typeof body.message === 'string' ? body.message.trim() : ''
  const nameInput = typeof body.display_name === 'string' ? body.display_name.trim() : ''
  if (!message) return json(400, { error: 'Write something first.' }, origin)
  if (message.length > MESSAGE_LIMIT) return json(400, { error: 'Notes can be up to 1,000 characters.' }, origin)
  if (nameInput.length > NAME_LIMIT) return json(400, { error: `Names can be up to ${NAME_LIMIT} characters.` }, origin)
  const displayName = nameInput || null

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const ipHash = await sha256(`${Deno.env.get('RATE_LIMIT_SALT') ?? 'little-world'}:${ip}`)
  const since = new Date(Date.now() - RATE_WINDOW_MINUTES * 60_000).toISOString()
  const { count, error: countError } = await supabase.from('reaction_rate_limits').select('id', { count: 'exact', head: true }).eq('ip_hash', ipHash).gte('created_at', since)
  if (countError) {
    console.error(`rate check failed: ${countError.code}`)
    return json(500, { error: 'Could not deliver right now.' }, origin)
  }
  if ((count ?? 0) >= RATE_MAX_PER_WINDOW) return json(429, { error: 'Too many notes at once.' }, origin)
  await supabase.from('reaction_rate_limits').insert({ ip_hash: ipHash })
  // Keep the rate-limit log short-lived.
  await supabase.from('reaction_rate_limits').delete().lt('created_at', new Date(Date.now() - 86_400_000).toISOString())

  // Save first; success is reported only after the database write (§15.3).
  const { data, error } = await supabase.from('reaction_messages').insert({ display_name: displayName, message }).select('id').single()
  if (error || !data) {
    console.error(`insert failed: ${error?.code ?? 'no data'}`)
    return json(500, { error: 'Could not deliver right now.' }, origin)
  }

  const notified = await notifyOwner(data.id, displayName, message).catch(() => 'failed')
  console.log(`message ${data.id} stored; notification ${notified}`)
  return json(200, { ok: true }, origin)
})
