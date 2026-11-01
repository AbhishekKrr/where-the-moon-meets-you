import type { SupabaseClient } from '@supabase/supabase-js'

export type MessageStatus = 'new' | 'read' | 'archived'

export type ReactionMessage = {
  id: string
  created_at: string
  display_name: string | null
  message: string
  status: MessageStatus
  read_at: string | null
  archived_at: string | null
}

// Every call below is still checked by Row Level Security; the UI is not the guard (FR-048).
export async function isInboxOwner(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc('is_inbox_owner')
  if (error) throw error
  return data === true
}

export async function listMessages(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('reaction_messages')
    .select('id, created_at, display_name, message, status, read_at, archived_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as ReactionMessage[]
}

export async function setMessageStatus(supabase: SupabaseClient, message: ReactionMessage, status: MessageStatus) {
  const now = new Date().toISOString()
  const changes = {
    status,
    read_at: status === 'new' ? null : message.read_at ?? now,
    archived_at: status === 'archived' ? now : null,
  }
  const { error } = await supabase.from('reaction_messages').update(changes).eq('id', message.id)
  if (error) throw error
  return { ...message, ...changes }
}

export async function deleteMessage(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from('reaction_messages').delete().eq('id', id)
  if (error) throw error
}
