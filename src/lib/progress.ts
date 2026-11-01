import { discoveries, type DiscoveryId } from '../content'

const knownIds = new Set<string>(discoveries.map((item) => item.id))

/** Keeps only known IDs, in journey order, without duplicates (FR-014). */
export function sanitizeDiscovered(value: unknown): DiscoveryId[] {
  if (!Array.isArray(value)) return []
  const found = new Set(value.filter((id): id is DiscoveryId => typeof id === 'string' && knownIds.has(id)))
  return discoveries.map((item) => item.id).filter((id) => found.has(id))
}

export function addDiscovery(discovered: DiscoveryId[], id: DiscoveryId): DiscoveryId[] {
  if (discovered.includes(id)) return discovered
  return sanitizeDiscovered([...discovered, id])
}

/** The first discovery is always open; each later one opens once the previous is found. */
export function isAvailable(discovered: DiscoveryId[], id: DiscoveryId): boolean {
  const index = discoveries.findIndex((item) => item.id === id)
  if (index <= 0) return index === 0
  return discovered.includes(id) || discovered.includes(discoveries[index - 1].id)
}

export function nextDiscovery(discovered: DiscoveryId[]) {
  return discoveries.find((item) => !discovered.includes(item.id)) ?? null
}

export function isComplete(discovered: DiscoveryId[]) {
  return discovered.length === discoveries.length
}
