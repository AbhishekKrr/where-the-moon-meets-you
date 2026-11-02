import { useEffect, useRef, useState } from 'react'
import { audioPaths } from '../content'

type Status = 'ask' | 'loading' | 'playing' | 'paused' | 'ended' | 'unavailable' | 'skipped'

/** The hidden voice note: never autoplayed, explicit Listen/Skip (FR-036/FR-037). */
export function VoiceNotePrompt({ onDone }: { onDone: () => void }) {
  const [status, setStatus] = useState<Status>('ask')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  useEffect(() => () => audioRef.current?.pause(), [])

  const voice = () => {
    if (!audioRef.current) {
      const audio = new Audio(audioPaths.voiceNote)
      audio.addEventListener('ended', () => setStatus('ended'))
      audio.addEventListener('pause', () => setStatus((current) => current === 'playing' ? 'paused' : current))
      audio.addEventListener('playing', () => setStatus('playing'))
      audio.addEventListener('error', () => setStatus('unavailable'))
      audioRef.current = audio
    }
    return audioRef.current
  }

  const play = (fromStart = false) => {
    const audio = voice()
    if (fromStart) audio.currentTime = 0
    setStatus('loading')
    audio.play().catch(() => setStatus('unavailable'))
  }

  const pause = () => audioRef.current?.pause()

  if (status === 'skipped') return null

  return <div className="voice-note" aria-live="polite">
    {status === 'ask' && <>
      <p>I also recorded a short voice note. Listen if you want.</p>
      <div className="voice-actions">
        <button className="soft-button" onClick={() => play()}>▶ Listen</button>
        <button className="ghost-button" onClick={() => { setStatus('skipped'); onDone() }}>Skip</button>
      </div>
    </>}
    {(status === 'loading' || status === 'playing' || status === 'paused' || status === 'ended') && <>
      <p>{status === 'ended' ? 'That’s it. I’m done talking.' : status === 'loading' ? 'Loading…' : 'Playing…'}</p>
      <div className="voice-actions">
        {status === 'playing' && <button className="soft-button" onClick={pause}>❚❚ Pause</button>}
        {status === 'paused' && <button className="soft-button" onClick={() => play()}>▶ Play</button>}
        {(status === 'paused' || status === 'ended' || status === 'playing') && <button className="ghost-button" onClick={() => play(true)}>↺ Replay</button>}
        <button className="ghost-button" onClick={() => { pause(); onDone() }}>Continue</button>
      </div>
    </>}
    {status === 'unavailable' && <>
      <p>The voice note didn’t load. It mostly said happy birthday, so you didn’t miss much.</p>
      <div className="voice-actions"><button className="soft-button" onClick={onDone}>Continue</button></div>
    </>}
  </div>
}
