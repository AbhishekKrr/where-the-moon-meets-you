// Only the public project URL and anon/publishable key belong in the frontend (§8.4).
// Service-role and email secrets live in the Supabase Edge Function environment.
export const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''
export const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? ''

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)
