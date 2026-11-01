import type { SupabaseClient } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from './config'

let client: Promise<SupabaseClient> | null = null

/** Loaded on demand so the birthday experience never downloads the SDK. */
export function getSupabase() {
  if (!isSupabaseConfigured) return null
  client ??= import('@supabase/supabase-js').then(({ createClient }) => createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  }))
  return client
}
