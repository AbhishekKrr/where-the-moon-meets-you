type Props = {
  onEnter: () => void
  returning: boolean
  onReadLetter: () => void
  onKeepsake: () => void
  onRestart: () => void
}

/** Opening and Secret Door. The greeting stays hidden until the door is entered (FR-001, FR-002, FR-006). */
export function OpeningScene({ onEnter, returning, onReadLetter, onKeepsake, onRestart }: Props) {
  return <div className="opening-content">
    <p className="eyebrow">OPEN WHEN YOU’RE READY</p>
    <h1>Where the Moon<span>Meets You</span></h1>
    <p className="intro">I made you something. Come in.</p>
    <div className="door-area">
      <button className="secret-door" onClick={onEnter} aria-label="Open the secret door">
        <span className="door-glow" /><span className="door-frame"><span className="door-panel"><span className="door-moon">☾</span><span className="door-knob" /></span></span>
      </button>
    </div>
    <button className="enter-button" onClick={onEnter}>Tap to enter <span>✦</span></button>
    {returning && <nav className="returning-links" aria-label="Welcome back">
      <span>Back again?</span>
      <button className="link-button" onClick={onReadLetter}>Read Your Letter Again</button>
      <button className="link-button" onClick={onKeepsake}>Your card &amp; a note</button>
      <button className="link-button quiet" onClick={onRestart}>Start the Journey Again</button>
    </nav>}
  </div>
}
