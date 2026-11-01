import { useState } from 'react'
import type { MusicPreference } from '../lib/storage'

type Props = {
  musicChoice: MusicPreference | null
  onMusicChoice: (choice: MusicPreference) => void
  onEnter: () => void
  returning: boolean
  onReadLetter: () => void
  onKeepsake: () => void
  onRestart: () => void
}

/** Opening and Secret Door. The greeting stays hidden until the door is entered (FR-001–FR-006). */
export function OpeningScene({ musicChoice, onMusicChoice, onEnter, returning, onReadLetter, onKeepsake, onRestart }: Props) {
  const [nudge, setNudge] = useState(false)
  const enter = () => {
    if (musicChoice === null) { setNudge(true); return }
    onEnter()
  }
  return <div className="opening-content">
    <p className="eyebrow">OPEN WHEN YOU’RE READY</p>
    <h1>Where the Moon<span>Meets You</span></h1>
    <p className="intro">I made you something. Come in.</p>
    <div className="door-area">
      <button className={`secret-door ${musicChoice === null ? 'waiting' : ''}`} onClick={enter} aria-label="Open the secret door" aria-disabled={musicChoice === null} aria-describedby="music-question">
        <span className="door-glow" /><span className="door-frame"><span className="door-panel"><span className="door-moon">☾</span><span className="door-knob" /></span></span>
      </button>
    </div>
    <p id="music-question" className={`music-question ${nudge && musicChoice === null ? 'nudge' : ''}`}>Would you like to hear this little world?</p>
    <div className="music-options" role="group" aria-labelledby="music-question">
      <button className={musicChoice === 'on' ? 'music-option selected' : 'music-option'} aria-pressed={musicChoice === 'on'} onClick={() => onMusicChoice('on')}>♫ With music</button>
      <button className={musicChoice === 'off' ? 'music-option selected' : 'music-option'} aria-pressed={musicChoice === 'off'} onClick={() => onMusicChoice('off')}>In silence</button>
    </div>
    <p className="choice-hint" aria-live="polite">{nudge && musicChoice === null ? 'Pick music or silence first, then tap the door.' : ''}</p>
    <button className="enter-button" onClick={enter} aria-disabled={musicChoice === null}>Tap to enter <span>✦</span></button>
    {returning && <nav className="returning-links" aria-label="Welcome back">
      <span>Back again?</span>
      <button className="link-button" onClick={onReadLetter}>Read Your Letter Again</button>
      <button className="link-button" onClick={onKeepsake}>Your card &amp; a note</button>
      <button className="link-button quiet" onClick={onRestart}>Start the Journey Again</button>
    </nav>}
  </div>
}
