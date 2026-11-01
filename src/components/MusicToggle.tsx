import { useAudio } from '../audio/audioContext'

export function MusicToggle() {
  const { enabled, toggle } = useAudio()
  return <button className={`music-toggle ${enabled ? 'on' : ''}`} onClick={toggle} aria-pressed={enabled} aria-label={enabled ? 'Music on. Turn music off' : 'Music off. Turn music on'}>
    <span aria-hidden="true">{enabled ? '♫' : '♪'}</span><span className="music-toggle-text">{enabled ? 'Music on' : 'Music off'}</span>
  </button>
}
