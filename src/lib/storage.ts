import type { DiscoveryId } from '../content'
import { sanitizeDiscovered } from './progress'

// Bump the version if the shape changes so old saves are ignored rather than misread.
const STORAGE_KEY = 'where-the-moon-meets-you:journey:v1'

export type JourneyState = {
  discovered: DiscoveryId[]
  letterOpened: boolean
  journeyCompleted: boolean
  keepsakeDownloaded: boolean
  giftOpened: boolean
}

export const emptyJourney: JourneyState = {
  discovered: [],
  letterOpened: false,
  journeyCompleted: false,
  keepsakeDownloaded: false,
  giftOpened: false,
}

/** Best effort: storage can be blocked or cleared, and the story must keep working (§11). */
export function loadJourney(): JourneyState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyJourney
    const saved = JSON.parse(raw) as Partial<Record<keyof JourneyState, unknown>>
    return {
      discovered: sanitizeDiscovered(saved.discovered),
      letterOpened: saved.letterOpened === true,
      journeyCompleted: saved.journeyCompleted === true,
      keepsakeDownloaded: saved.keepsakeDownloaded === true,
      giftOpened: saved.giftOpened === true,
    }
  } catch {
    return emptyJourney
  }
}

export function saveJourney(state: JourneyState) {
  try {
    const { discovered, letterOpened, journeyCompleted, keepsakeDownloaded, giftOpened } = state
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ discovered, letterOpened, journeyCompleted, keepsakeDownloaded, giftOpened }))
  } catch {
    // Storage unavailable: the journey continues for this session only.
  }
}
