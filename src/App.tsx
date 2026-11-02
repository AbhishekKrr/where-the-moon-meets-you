import { useEffect, useRef, useState } from 'react'
import { ConfirmDialog } from './components/ConfirmDialog'
import type { DiscoveryId } from './content'
import { addDiscovery } from './lib/progress'
import { emptyJourney, loadJourney, saveJourney, type JourneyState } from './lib/storage'
import { prefersReducedMotion } from './lib/useReducedMotion'
import { BirthdayReveal } from './scenes/BirthdayReveal'
import { FinalReveal } from './scenes/FinalReveal'
import { GiftScene } from './scenes/GiftScene'
import { KeepsakeScene } from './scenes/KeepsakeScene'
import { LetterScene } from './scenes/LetterScene'
import { MoonlitGarden } from './scenes/MoonlitGarden'
import { OpeningScene } from './scenes/OpeningScene'
import { SunsetMemories } from './scenes/SunsetMemories'
import './styles/global.css'
import './styles/scenes.css'
import './styles/story.css'

type Scene = 'opening' | 'revealing' | 'birthday' | 'garden-transition' | 'garden' | 'sunset' | 'letter' | 'finale' | 'gift' | 'keepsake'

const openingScenes: Scene[] = ['opening', 'revealing', 'birthday', 'garden-transition']

type JourneyProps = {
  journey: JourneyState
  update: (change: (state: JourneyState) => JourneyState) => void
}

function Journey({ journey, update }: JourneyProps) {
  const [scene, setScene] = useState<Scene>('opening')
  const [letterFromReturn, setLetterFromReturn] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  // Remember whether this visit began as a return, so the welcome-back links don't vanish mid-visit.
  const [returning] = useState(() => journey.letterOpened || journey.journeyCompleted)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const goTo = (next: Scene) => {
    window.clearTimeout(timer.current)
    setScene(next)
  }

  const after = (ms: number, next: Scene) => {
    timer.current = window.setTimeout(() => setScene(next), prefersReducedMotion() ? Math.min(ms, 300) : ms)
  }

  const enterWorld = () => { goTo('revealing'); after(1500, 'birthday') }

  const beginJourney = () => { goTo('garden-transition'); after(1100, 'garden') }

  const openLetterDirectly = () => { setLetterFromReturn(true); goTo('letter') }

  const reset = () => {
    setConfirmReset(false)
    setLetterFromReturn(false)
    update(() => emptyJourney)
    goTo('opening')
  }

  return <main className={`dream-world scene-${scene}`}>
    {openingScenes.includes(scene) && <>
      <div className="stars" aria-hidden="true" /><div className="moon" aria-hidden="true" /><div className="horizon" aria-hidden="true" />
      <section className="opening">
        {scene === 'opening' && <OpeningScene onEnter={enterWorld} returning={returning} onReadLetter={openLetterDirectly} onKeepsake={() => goTo('keepsake')} onRestart={() => setConfirmReset(true)} />}
        {scene === 'revealing' && <div className="birthday-reveal" aria-live="polite"><p className="eyebrow">ONE SECOND…</p><div className="reveal-star" aria-hidden="true">✧</div></div>}
        {scene === 'birthday' && <BirthdayReveal onBegin={beginJourney} />}
        {scene === 'garden-transition' && <div className="garden-passage" aria-live="polite"><span aria-hidden="true">☾</span><p>This way…</p></div>}
      </section>
      <footer className="scene-footer">MADE BY ABHISHEK</footer>
    </>}
    {scene === 'garden' && <MoonlitGarden
      discovered={journey.discovered}
      onDiscover={(id: DiscoveryId) => update((state) => ({ ...state, discovered: addDiscovery(state.discovered, id) }))}
      onContinue={() => goTo('sunset')}
      onSkip={() => goTo('sunset')}
      onRestart={() => setConfirmReset(true)} />}
    {scene === 'sunset' && <SunsetMemories onContinue={() => goTo('letter')} />}
    {scene === 'letter' && <LetterScene
      onOpened={() => update((state) => ({ ...state, letterOpened: true }))}
      onContinue={() => { setLetterFromReturn(false); update((state) => ({ ...state, journeyCompleted: true })); goTo('finale') }}
      onBack={letterFromReturn ? () => goTo('keepsake') : undefined} />}
    {scene === 'finale' && <FinalReveal onContinue={() => goTo('gift')} />}
    {scene === 'gift' && <GiftScene
      alreadyOpened={journey.giftOpened}
      onOpened={() => update((state) => ({ ...state, giftOpened: true }))}
      onContinue={() => goTo('keepsake')} />}
    {scene === 'keepsake' && <KeepsakeScene
      onDownloaded={() => update((state) => ({ ...state, keepsakeDownloaded: true }))}
      onReadLetter={openLetterDirectly}
      onOpenGift={() => goTo('gift')}
      onReplayEnding={() => goTo('finale')}
      onRestart={() => setConfirmReset(true)} />}
    {confirmReset && <ConfirmDialog
      title="Start the journey again?"
      body="This clears what you’ve found so far on this device. The letter and card will still be there at the end."
      confirmLabel="Start again"
      onConfirm={reset}
      onCancel={() => setConfirmReset(false)} />}
  </main>
}

function App() {
  const [journey, setJourney] = useState<JourneyState>(loadJourney)

  useEffect(() => { saveJourney(journey) }, [journey])

  return <Journey journey={journey} update={setJourney} />
}

export default App
