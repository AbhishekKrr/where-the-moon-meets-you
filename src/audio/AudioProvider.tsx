import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { audioPaths } from '../content'
import { AudioControlsContext, type AudioControls, type Track } from './audioContext'

const VOLUME = 0.55
const FADE_MS = 900

type Props = {
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  onNotice: (message: string) => void
  children: ReactNode
}

/**
 * Plays one scene track at a time (NFR-012) and crossfades between them (FR-052).
 * Nothing plays until the recipient chooses music and taps (FR-003/FR-004); any
 * failure falls back to silence with a gentle notice (FR-005).
 */
export function AudioProvider({ enabled, onEnabledChange, onNotice, children }: Props) {
  const elements = useRef(new Map<Track, HTMLAudioElement>())
  const fades = useRef(new Map<HTMLAudioElement, number>())
  const desired = useRef<Track>('ambience')
  const enabledRef = useRef(enabled)
  const ducked = useRef(false)
  const callbacks = useRef({ onEnabledChange, onNotice })
  useEffect(() => { callbacks.current = { onEnabledChange, onNotice } })
  useEffect(() => { enabledRef.current = enabled }, [enabled])

  const controls = useMemo<AudioControls>(() => {
    const fadeTo = (audio: HTMLAudioElement, target: number, then?: () => void) => {
      window.clearInterval(fades.current.get(audio))
      const start = audio.volume
      const began = performance.now()
      const timer = window.setInterval(() => {
        const progress = Math.min(1, (performance.now() - began) / FADE_MS)
        try { audio.volume = start + (target - start) * progress } catch { /* iOS volume is read-only */ }
        if (progress < 1) return
        window.clearInterval(timer)
        fades.current.delete(audio)
        then?.()
      }, 40)
      fades.current.set(audio, timer)
    }

    const fail = () => {
      if (!enabledRef.current) return
      enabledRef.current = false
      elements.current.forEach((audio) => audio.pause())
      callbacks.current.onEnabledChange(false)
      callbacks.current.onNotice('The music didn’t load, so it’ll stay quiet. You can try the music button again.')
    }

    const element = (track: Track) => {
      let audio = elements.current.get(track)
      if (!audio) {
        audio = new Audio(audioPaths[track])
        audio.loop = true
        audio.preload = 'auto'
        audio.addEventListener('error', () => { if (desired.current === track) fail() })
        elements.current.set(track, audio)
      }
      return audio
    }

    const fadeOutOthers = (keep?: HTMLAudioElement) => {
      elements.current.forEach((audio) => {
        if (audio !== keep && !audio.paused) fadeTo(audio, 0, () => audio.pause())
      })
    }

    const play = () => {
      if (!enabledRef.current || ducked.current) return
      const audio = element(desired.current)
      fadeOutOthers(audio)
      if (!audio.paused) { fadeTo(audio, VOLUME); return }
      try { audio.volume = 0 } catch { /* read-only on iOS */ }
      audio.play().then(() => fadeTo(audio, VOLUME)).catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        fail()
      })
    }

    return {
      enabled,
      setTrack: (track) => { desired.current = track; play() },
      start: () => { enabledRef.current = true; play() },
      toggle: () => {
        const next = !enabledRef.current
        enabledRef.current = next
        callbacks.current.onEnabledChange(next)
        if (next) play()
        else fadeOutOthers()
      },
      duck: (on) => {
        ducked.current = on
        if (on) fadeOutOthers()
        else play()
      },
    }
  }, [enabled])

  useEffect(() => {
    const playing = elements.current
    return () => playing.forEach((audio) => audio.pause())
  }, [])

  return <AudioControlsContext.Provider value={controls}>{children}</AudioControlsContext.Provider>
}
