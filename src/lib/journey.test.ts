import { afterEach, describe, expect, it, vi } from 'vitest'
import { discoveries } from '../content'
import { addDiscovery, isAvailable, isComplete, nextDiscovery, sanitizeDiscovered } from './progress'
import { validateReaction } from './reaction'
import { emptyJourney, loadJourney, saveJourney } from './storage'

describe('discovery progress', () => {
  it('starts with only the Moonflower available (FR-012)', () => {
    expect(isAvailable([], 'moonflower')).toBe(true)
    expect(isAvailable([], 'starlit-fountain')).toBe(false)
    expect(nextDiscovery([])?.id).toBe('moonflower')
  })

  it('never adds duplicates when a marker is reopened (FR-014, TC-006)', () => {
    const once = addDiscovery([], 'moonflower')
    const twice = addDiscovery(once, 'moonflower')
    expect(twice).toEqual(['moonflower'])
    expect(twice).toBe(once)
  })

  it('unlocks each discovery after the previous one', () => {
    const found = addDiscovery([], 'moonflower')
    expect(isAvailable(found, 'starlit-fountain')).toBe(true)
    expect(isAvailable(found, 'wishing-tree')).toBe(false)
  })

  it('cleans up unknown, duplicate, and out-of-order saved IDs', () => {
    expect(sanitizeDiscovered(['wishing-tree', 'nope', 'moonflower', 'moonflower', 4])).toEqual(['moonflower', 'wishing-tree'])
    expect(sanitizeDiscovered('moonflower')).toEqual([])
  })

  it('is complete only when all five are found', () => {
    const all = discoveries.reduce((list, item) => addDiscovery(list, item.id), [] as ReturnType<typeof sanitizeDiscovered>)
    expect(all).toHaveLength(5)
    expect(isComplete(all)).toBe(true)
    expect(nextDiscovery(all)).toBeNull()
  })
})

describe('reaction validation (FR-043, TC-014)', () => {
  it('rejects empty and whitespace-only notes', () => {
    expect(validateReaction('', '')).not.toBeNull()
    expect(validateReaction('  \n\t ', '')).not.toBeNull()
  })

  it('accepts 1,000 characters and rejects 1,001', () => {
    expect(validateReaction('a'.repeat(1000), '')).toBeNull()
    expect(validateReaction('a'.repeat(1001), '')).not.toBeNull()
  })

  it('limits the optional name', () => {
    expect(validateReaction('hello', 'n'.repeat(61))).not.toBeNull()
    expect(validateReaction('hello', '')).toBeNull()
  })
})

describe('journey storage (FR-019)', () => {
  afterEach(() => { vi.unstubAllGlobals() })

  const stubStorage = () => {
    const store = new Map<string, string>()
    vi.stubGlobal('window', { localStorage: { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => { store.set(key, value) } } })
    return store
  }

  it('round-trips progress', () => {
    stubStorage()
    saveJourney({ ...emptyJourney, discovered: ['moonflower'], letterOpened: true, giftOpened: true })
    const loaded = loadJourney()
    expect(loaded.discovered).toEqual(['moonflower'])
    expect(loaded.letterOpened).toBe(true)
    expect(loaded.giftOpened).toBe(true)
  })

  it('falls back to a fresh journey when storage is blocked or corrupt', () => {
    vi.stubGlobal('window', { localStorage: { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') } } })
    expect(loadJourney()).toEqual(emptyJourney)
    expect(() => saveJourney(emptyJourney)).not.toThrow()

    const store = stubStorage()
    store.set('where-the-moon-meets-you:journey:v1', '{not json')
    expect(loadJourney()).toEqual(emptyJourney)
  })
})
