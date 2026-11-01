// Mirrors the checks in supabase/functions/submit-reaction and the database constraints.
export const MESSAGE_LIMIT = 1000
export const NAME_LIMIT = 60

export function validateReaction(message: string, displayName: string): string | null {
  const text = message.trim()
  if (!text) return 'Write something first.'
  if (text.length > MESSAGE_LIMIT) return `Notes can be up to ${MESSAGE_LIMIT.toLocaleString('en-GB')} characters.`
  if (displayName.trim().length > NAME_LIMIT) return `Names can be up to ${NAME_LIMIT} characters.`
  return null
}
