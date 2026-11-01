import { createContext, useContext } from 'react'

export type Track = 'ambience' | 'sunset' | 'finale'

export type AudioControls = {
  enabled: boolean
  /** Switch the scene track. Call from a tap handler so browsers allow playback. */
  setTrack: (track: Track) => void
  /** Start playback after an explicit choice; must run inside a user gesture. */
  start: () => void
  toggle: () => void
  /** Quiet the music while the voice note plays. */
  duck: (ducked: boolean) => void
}

export const AudioControlsContext = createContext<AudioControls | null>(null)

export function useAudio() {
  const controls = useContext(AudioControlsContext)
  if (!controls) throw new Error('useAudio must be used inside AudioProvider')
  return controls
}
