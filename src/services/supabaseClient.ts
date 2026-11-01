import type { SupabaseClient } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from './config'

let client: Promise<SupabaseClient> | null = null

/** Loaded on demand so the birthday experience never downloads the SDK. */
export function getSupabase() {
  if (!isSupabaseConfigured) return null
  client ??= import('@supabase/supabase-js').then(({ createClient }) => createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  })).catch((error: unknown) => {
    // Don't cache a failed load; the next attempt (e.g. after a refresh) retries.
    client = null
    throw error
  })
  return client
}
