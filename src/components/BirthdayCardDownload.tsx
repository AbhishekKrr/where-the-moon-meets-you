import { useEffect, useRef, useState } from 'react'
import { drawCard, type CardFormat } from '../card/drawCard'
import { animatedCardSupport, ANIMATION_MS, downloadAnimatedCard, downloadStaticCard, ensureCardFonts } from '../card/exportCard'
import { prefersReducedMotion } from '../lib/useReducedMotion'

type Busy = CardFormat | 'animated' | null

/** Card preview plus portrait, landscape, and animated downloads (FR-038–FR-040). */
export function BirthdayCardDownload({ onDownloaded }: { onDownloaded: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [busy, setBusy] = useState<Busy>(null)
  const [error, setError] = useState<string | null>(null)
  const [replays, setReplays] = useState(0)
  const [animatedSupport] = useState(animatedCardSupport)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    let frame = 0
    let cancelled = false
    ensureCardFonts().then(() => {
      if (cancelled) return
      if (prefersReducedMotion()) { drawCard(ctx, 'portrait', canvas.width, canvas.height, 1); return }
      const began = performance.now()
      const tick = () => {
        const progress = Math.min(1, (performance.now() - began) / ANIMATION_MS)
        drawCard(ctx, 'portrait', canvas.width, canvas.height, progress)
        if (progress < 1) frame = requestAnimationFrame(tick)
      }
      tick()
    })
    return () => { cancelled = true; cancelAnimationFrame(frame) }
  }, [replays])

  const download = async (kind: Exclude<Busy, null>) => {
    setBusy(kind)
    setError(null)
    try {
      if (kind === 'animated') await downloadAnimatedCard()
      else await downloadStaticCard(kind)
      onDownloaded()
    } catch {
      setError(kind === 'animated' ? 'The animated card could not be made here. The still cards always work.' : 'The card could not be saved just now. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  return <div className="card-download">
    <div className="card-preview">
      <canvas ref={canvasRef} width={540} height={675} role="img" aria-label="Birthday card: a constellation of a crescent moon resting on a sunset, with a birthday wish and signature" />
      <button className="link-button" onClick={() => setReplays((count) => count + 1)}>↺ Replay the stars</button>
    </div>
    <div className="card-actions">
      <button className="soft-button" onClick={() => download('portrait')} disabled={busy !== null}>{busy === 'portrait' ? 'Preparing…' : 'Download portrait card'}</button>
      <button className="soft-button" onClick={() => download('landscape')} disabled={busy !== null}>{busy === 'landscape' ? 'Preparing…' : 'Download landscape card'}</button>
      {animatedSupport
        ? <button className="ghost-button" onClick={() => download('animated')} disabled={busy !== null}>{busy === 'animated' ? 'Recording the stars… (6s)' : `Download animated card (.${animatedSupport.extension})`}</button>
        : <p className="card-note">This browser cannot save the animated version, but the stars above still move and the still cards are ready.</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  </div>
}
