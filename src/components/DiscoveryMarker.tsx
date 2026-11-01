import type { Discovery } from '../content'

type Props = {
  discovery: Discovery
  index: number
  discovered: boolean
  available: boolean
  highlighted: boolean
  onSelect: () => void
}

export function DiscoveryMarker({ discovery, index, discovered, available, highlighted, onSelect }: Props) {
  const state = discovered ? 'discovered' : available ? 'available' : 'hinted'
  const label = discovered
    ? `${discovery.name}, found. Open its message again.`
    : available ? `Discover the ${discovery.name}. Ready to explore.` : `${discovery.name}, still waiting. ${discovery.hint}`
  // Status is spelled out in the label text so it never relies on colour alone.
  return <button id={`marker-${discovery.id}`} className={`discovery-marker marker-${index + 1} ${state} ${highlighted ? 'highlighted' : ''}`} style={{ left: discovery.x, top: discovery.y }} onClick={onSelect} aria-label={label} aria-disabled={!available && !discovered}>
    <span className="marker-orb" aria-hidden="true">{discovered ? '✦' : available ? '✧' : '·'}</span>
    <span className="marker-label" aria-hidden="true">{discovered ? discovery.name : available ? 'Explore' : 'Not yet'}</span>
  </button>
}
