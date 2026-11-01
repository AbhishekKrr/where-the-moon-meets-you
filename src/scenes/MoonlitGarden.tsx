import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { discoveries, optionalSecretMessage, type Discovery, type DiscoveryId } from '../content'
import { ConstellationMap } from '../components/ConstellationMap'
import { ConstellationSymbol } from '../components/ConstellationSymbol'
import { DiscoveryMarker } from '../components/DiscoveryMarker'
import { DiscoveryMessage } from '../components/DiscoveryMessage'
import { isAvailable, isComplete, nextDiscovery } from '../lib/progress'

type Props = {
  discovered: DiscoveryId[]
  onDiscover: (id: DiscoveryId) => void
  onContinue: () => void
  onSkip: () => void
  onRestart: () => void
}

const SKIP_AFTER_MS = 60_000

export function MoonlitGarden({ discovered, onDiscover, onContinue, onSkip, onRestart }: Props) {
  const [activeDiscovery, setActiveDiscovery] = useState<Discovery | null>(null)
  const [mapOpen, setMapOpen] = useState(false)
  const [highlight, setHighlight] = useState<DiscoveryId | null>(null)
  const [reaction, setReaction] = useState<{ id: DiscoveryId; key: number } | null>(null)
  const [whisper, setWhisper] = useState<string | null>(null)
  const [fireflyDance, setFireflyDance] = useState(false)
  const [showSkip, setShowSkip] = useState(false)
  const timers = useRef(new Map<string, number>())
  const headingRef = useRef<HTMLHeadingElement>(null)
  const complete = isComplete(discovered)
  const next = nextDiscovery(discovered)

  useEffect(() => { headingRef.current?.focus({ preventScroll: true }) }, [])

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((timer) => window.clearTimeout(timer))
  }, [])

  // If the recipient seems stuck, quietly offer the way forward (FR-017).
  useEffect(() => {
    if (complete) return
    const timer = window.setTimeout(() => setShowSkip(true), SKIP_AFTER_MS)
    return () => window.clearTimeout(timer)
  }, [discovered.length, complete])

  const later = (name: string, ms: number, action: () => void) => {
    window.clearTimeout(timers.current.get(name))
    timers.current.set(name, window.setTimeout(action, ms))
  }

  const showHint = () => {
    if (!next) return
    setHighlight(next.id)
    setWhisper(next.hint)
    later('highlight', 4500, () => setHighlight(null))
    later('whisper', 6000, () => setWhisper(null))
  }

  const select = (item: Discovery) => {
    if (!discovered.includes(item.id)) {
      if (!isAvailable(discovered, item.id)) {
        setWhisper(`Not that one yet. ${next?.hint ?? ''}`)
        if (next) { setHighlight(next.id); later('highlight', 4500, () => setHighlight(null)) }
        later('whisper', 6000, () => setWhisper(null))
        return
      }
      onDiscover(item.id)
      setShowSkip(false)
      setReaction((previous) => ({ id: item.id, key: (previous?.key ?? 0) + 1 }))
      later('reaction', 2600, () => setReaction(null))
    }
    setHighlight(null)
    setWhisper(null)
    // A new story moment starts with the map tucked away.
    setMapOpen(false)
    setActiveDiscovery(item)
  }

  const wakeFirefly = () => {
    setWhisper(optionalSecretMessage)
    setFireflyDance(true)
    later('firefly', 3200, () => setFireflyDance(false))
    later('whisper', 6000, () => setWhisper(null))
  }

  const messageStyle = activeDiscovery ? {
    '--message-x': `${Number.parseFloat(activeDiscovery.x) + (Number.parseFloat(activeDiscovery.x) < 50 ? 23 : -23)}%`,
    '--message-y': `${Math.max(28, Number.parseFloat(activeDiscovery.y) - 14)}%`,
  } as CSSProperties : undefined
  const reactingIndex = reaction ? discoveries.findIndex((item) => item.id === reaction.id) : -1
  const reactingAt = reactingIndex >= 0 ? discoveries[reactingIndex] : null
  const promptText = whisper ?? (complete
    ? 'That’s all five. Look at the sky.'
    : discovered.length === 0 ? 'Tap the glowing one to start.' : `${discovered.length} of 5 found. Keep going.`)

  return <section className={`garden ${activeDiscovery ? 'has-message' : ''} ${reaction ? `reacting reacting-${reaction.id}` : ''} ${complete ? 'garden-complete' : ''} ${fireflyDance ? 'fireflies-dance' : ''}`} aria-labelledby="garden-title">
    <div className="garden-stars" aria-hidden="true" /><div className="garden-mist" aria-hidden="true" /><div className="garden-hills" aria-hidden="true" /><div className="garden-flowers flowers-left" aria-hidden="true" /><div className="garden-flowers flowers-right" aria-hidden="true" />
    <ConstellationSymbol found={discovered} className="garden-sky-constellation" showGuides />
    <div className="fireflies" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
    {/* Shares the marker-N class so it follows the same per-breakpoint position overrides. */}
    {reactingAt && <span key={reaction?.key} className={`discovery-burst marker-${reactingIndex + 1}`} style={{ left: reactingAt.x, top: reactingAt.y }} aria-hidden="true" />}
    <header className="garden-intro"><p className="eyebrow">CHAPTER ONE</p><h2 id="garden-title" ref={headingRef} tabIndex={-1}>The Moonlit <em>Garden</em></h2><p>I hid five things in here. Start with the one that’s glowing.</p></header>
    <div className="discovery-field" role="group" aria-label="Celestial discoveries">
      {discoveries.map((item, index) => <DiscoveryMarker key={item.id} discovery={item} index={index} discovered={discovered.includes(item.id)} available={isAvailable(discovered, item.id)} highlighted={highlight === item.id} onSelect={() => select(item)} />)}
      <button className="secret-firefly" onClick={wakeFirefly} aria-label="A sleeping firefly"><span aria-hidden="true" /></button>
    </div>
    <button className="constellation-button" onClick={() => setMapOpen((open) => !open)} aria-expanded={mapOpen} aria-controls="constellation-map"><span aria-hidden="true">✧</span> Map <b>{discovered.length} of 5</b></button>
    {mapOpen && <ConstellationMap discovered={discovered} onSkip={onSkip} onRestart={onRestart} />}
    {activeDiscovery && <DiscoveryMessage key={activeDiscovery.id} discovery={activeDiscovery} style={messageStyle} onClose={() => setActiveDiscovery(null)} />}
    <div className={`garden-prompt ${discovered.length > 0 ? 'discovered-prompt' : ''} ${whisper ? 'whispering' : ''}`}>
      <p className="prompt-text" aria-live="polite">{promptText}</p>
      <div className="prompt-actions">
        {complete
          ? <button className="journey-button compact" onClick={onContinue}>Follow the sunset <span aria-hidden="true">→</span></button>
          : <>
            <button className="link-button" onClick={showHint}>Show me where</button>
            {showSkip && <button className="link-button" onClick={onSkip}>Reveal the final surprise</button>}
          </>}
      </div>
    </div>
  </section>
}
