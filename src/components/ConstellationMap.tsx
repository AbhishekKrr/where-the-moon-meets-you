import { discoveries, type DiscoveryId } from '../content'
import { ConstellationSymbol } from './ConstellationSymbol'

type Props = {
  discovered: DiscoveryId[]
  onSkip: () => void
  onRestart: () => void
}

export function ConstellationMap({ discovered, onSkip, onRestart }: Props) {
  const complete = discovered.length === discoveries.length
  return <aside className="constellation-map" id="constellation-map" aria-label={`Your night sky: ${discovered.length} of ${discoveries.length} found`}>
    <p>Your night sky <span>{discovered.length} of {discoveries.length}</span></p>
    <ConstellationSymbol found={discovered} className="map-symbol" />
    <ol>{discoveries.map((item) => {
      const found = discovered.includes(item.id)
      return <li key={item.id} className={found ? 'found' : ''}><span aria-hidden="true">{found ? '✦' : '·'}</span> {item.name} <small>{found ? 'found' : 'waiting'}</small></li>
    })}</ol>
    <div className="map-actions">
      {!complete && <button className="link-button" onClick={onSkip}>Reveal the final surprise</button>}
      {discovered.length > 0 && <button className="link-button quiet" onClick={onRestart}>Start the Journey Again</button>}
    </div>
  </aside>
}
