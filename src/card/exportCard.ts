import { recipientName } from '../content'
import { cardSizes, drawCard, type CardFormat } from './drawCard'

const fileStem = `${recipientName.toLowerCase()}-birthday-card`
export const ANIMATION_MS = 4500
const HOLD_MS = 1500

/** Canvas text needs the web fonts loaded first; give up after a moment and use fallbacks. */
export async function ensureCardFonts() {
  if (!('fonts' in document)) return
  const loads = ['italic 400 80px "Cormorant Garamond"', '400 40px "Cormorant Garamond"', '500 20px "DM Sans"', '400 60px Caveat'].map((font) => document.fonts.load(font))
  await Promise.race([Promise.all(loads).catch(() => undefined), new Promise((resolve) => window.setTimeout(resolve, 2500))])
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export async function downloadStaticCard(format: CardFormat) {
  await ensureCardFonts()
  const { width, height } = cardSizes[format]
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  drawCard(ctx, format, width, height, 1)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Could not create image')
  downloadBlob(blob, `${fileStem}-${format}.png`)
}

const videoTypes = [
  { mime: 'video/mp4;codecs=avc1', extension: 'mp4' },
  { mime: 'video/mp4', extension: 'mp4' },
  { mime: 'video/webm;codecs=vp9', extension: 'webm' },
  { mime: 'video/webm', extension: 'webm' },
]

export function animatedCardSupport() {
  if (typeof MediaRecorder === 'undefined' || typeof HTMLCanvasElement.prototype.captureStream !== 'function') return null
  return videoTypes.find((type) => MediaRecorder.isTypeSupported(type.mime)) ?? null
}

/** Records the short constellation animation to a video file (FR-039). */
export async function downloadAnimatedCard() {
  const type = animatedCardSupport()
  if (!type) throw new Error('Animated export unsupported')
  await ensureCardFonts()
  const width = 720
  const height = 900
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  drawCard(ctx, 'portrait', width, height, 0)

  const recorder = new MediaRecorder(canvas.captureStream(30), { mimeType: type.mime, videoBitsPerSecond: 4_000_000 })
  const chunks: Blob[] = []
  recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data) }
  const finished = new Promise<void>((resolve, reject) => {
    recorder.onstop = () => resolve()
    recorder.onerror = () => reject(new Error('Recording failed'))
  })
  recorder.start(250)

  const began = performance.now()
  await new Promise<void>((resolve) => {
    const frame = () => {
      const elapsed = performance.now() - began
      drawCard(ctx, 'portrait', width, height, Math.min(1, elapsed / ANIMATION_MS))
      if (elapsed < ANIMATION_MS + HOLD_MS) window.setTimeout(frame, 1000 / 30)
      else resolve()
    }
    frame()
  })
  recorder.stop()
  await finished
  downloadBlob(new Blob(chunks, { type: type.mime.split(';')[0] }), `${fileStem}-animated.${type.extension}`)
}
