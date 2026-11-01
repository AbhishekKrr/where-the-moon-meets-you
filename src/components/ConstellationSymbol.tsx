import { constellationPoints, discoveries, type DiscoveryId } from '../content'

type Props = {
  found: DiscoveryId[]
  className?: string
  /** Draw the faint crescent and horizon guides once every star is lit. */
  showGuides?: boolean
}

/** The custom moon-on-a-sunset constellation used in the garden sky, map, and finale. */
export function ConstellationSymbol({ found, className = '', showGuides = false }: Props) {
  const points = discoveries.map((item) => ({ id: item.id, lit: found.includes(item.id), ...constellationPoints[item.id] }))
  const complete = points.every((point) => point.lit)
  return <svg className={`constellation-symbol ${complete ? 'complete' : ''} ${className}`} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
    {showGuides && complete && <g className="constellation-guides">
      <path d="M44 8 A34 34 0 1 0 46 84" />
      <path d="M8 86 Q52 64 96 82" />
    </g>}
    {points.slice(1).map((point, index) => {
      const previous = points[index]
      return previous.lit && point.lit ? <line key={point.id} className="constellation-line" pathLength={1} x1={previous.x} y1={previous.y} x2={point.x} y2={point.y} /> : null
    })}
    {points.map((point) => <g key={point.id} className={point.lit ? 'constellation-star lit' : 'constellation-star'}>
      <circle cx={point.x} cy={point.y} r={point.lit ? 3.2 : 1.6} />
    </g>)}
  </svg>
}
