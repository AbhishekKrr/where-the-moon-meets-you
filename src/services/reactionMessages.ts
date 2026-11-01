import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from './config'

export type ReactionInput = {
  displayName: string
  message: string
  /** Honeypot field: real visitors never see or fill it. */
  website: string
}

export type SubmitResult = { ok: boolean; error?: string }

/**
 * Sends a private reaction through the constrained Edge Function pathway (FR-046).
 * The browser can never read messages back.
 */
export async function submitReaction(input: ReactionInput): Promise<SubmitResult> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Private notes are not switched on yet.' }
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 15000)
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/submit-reaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` },
      body: JSON.stringify({ display_name: input.displayName.trim() || null, message: input.message.trim(), website: input.website }),
      signal: controller.signal,
    })
    if (response.ok) return { ok: true }
    if (response.status === 429) return { ok: false, error: 'That was a lot of notes at once. Please wait a few minutes and try again.' }
    if (response.status === 400) {
      const body = await response.json().catch(() => null) as { error?: string } | null
      return { ok: false, error: body?.error ?? 'Something about that note could not be sent. Please check it and try again.' }
    }
    return { ok: false, error: 'The note could not be delivered just now. Your words are still here, so you can try again.' }
  } catch {
    return { ok: false, error: 'The connection drifted away. Your words are still here, so you can try again.' }
  } finally {
    window.clearTimeout(timeout)
  }
}
