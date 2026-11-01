import { cardDate, constellationPoints, discoveries, finalWish, recipientName, signatureName } from '../content'

export type CardFormat = 'portrait' | 'landscape'

export const cardSizes: Record<CardFormat, { width: number; height: number }> = {
  portrait: { width: 1080, height: 1350 },
  landscape: { width: 1600, height: 900 },
}

const serif = '"Cormorant Garamond", Georgia, serif'
const sans = '"DM Sans", system-ui, sans-serif'
const hand = 'Caveat, "Segoe Script", cursive'

const clamp = (value: number) => Math.min(1, Math.max(0, value))

function seededRandom(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    const attempt = line ? `${line} ${word}` : word
    if (ctx.measureText(attempt).width > maxWidth && line) { lines.push(line); line = word }
    else line = attempt
  }
  if (line) lines.push(line)
  return lines
}

function spaced(ctx: CanvasRenderingContext2D, spacing: string) {
  // letterSpacing is not in every canvas implementation; it is purely decorative.
  if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = spacing
}

/**
 * Draws the purely celestial birthday card (FR-038/FR-040). `progress` runs from
 * 0 to 1 for the animated version: stars connect, then the symbol glows (FR-039).
 */
export function drawCard(ctx: CanvasRenderingContext2D, format: CardFormat, width: number, height: number, progress = 1) {
  const portrait = format === 'portrait'
  const s = portrait ? width / 1080 : height / 900
  ctx.save()
  ctx.clearRect(0, 0, width, height)

  const sky = ctx.createLinearGradient(0, 0, 0, height)
  sky.addColorStop(0, '#0a0d26')
  sky.addColorStop(0.45, '#221f4a')
  sky.addColorStop(0.7, '#5b4a7e')
  sky.addColorStop(0.86, '#d98f8a')
  sky.addColorStop(1, '#f3c0a0')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, width, height)

  const random = seededRandom(1103)
  const starAlpha = clamp(progress * 2.5)
  for (let i = 0; i < 160; i += 1) {
    const x = random() * width
    const y = random() * height * 0.78
    const size = (random() * 1.6 + 0.5) * s
    const twinkle = 0.45 + 0.55 * Math.abs(Math.sin(i * 1.7 + progress * 6))
    ctx.globalAlpha = starAlpha * twinkle * (1 - y / height)
    ctx.fillStyle = random() > 0.85 ? '#f6d9a1' : '#fff6ec'
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  const horizonY = portrait ? height * 1.2 : height * 1.5
  const horizon = ctx.createLinearGradient(0, horizonY - height * 0.32, 0, height)
  horizon.addColorStop(0, '#2b2142')
  horizon.addColorStop(1, '#120f24')
  ctx.fillStyle = horizon
  ctx.beginPath()
  ctx.ellipse(width / 2, horizonY, width * (portrait ? 0.92 : 0.8), portrait ? height * 0.3 : height * 0.62, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(246, 199, 154, 0.55)'
  ctx.lineWidth = 3 * s
  ctx.stroke()

  // The constellation: a crescent resting on a curved horizon.
  const box = portrait ? { cx: width / 2, cy: height * 0.27, size: 430 * s } : { cx: width * 0.26, cy: height * 0.44, size: 470 * s }
  const point = (p: { x: number; y: number }) => ({ x: box.cx + (p.x / 100 - 0.5) * box.size, y: box.cy + (p.y / 100 - 0.5) * box.size })
  const points = discoveries.map((item) => point(constellationPoints[item.id]))
  const glow = clamp((progress - 0.75) / 0.25)

  const moon = point({ x: 40, y: 44 })
  const moonR = box.size * 0.36
  ctx.save()
  const halo = ctx.createRadialGradient(moon.x, moon.y, 0, moon.x, moon.y, moonR * 1.6)
  halo.addColorStop(0, `rgba(246, 217, 161, ${0.1 + 0.16 * glow})`)
  halo.addColorStop(1, 'rgba(246, 217, 161, 0)')
  ctx.fillStyle = halo
  ctx.fillRect(moon.x - moonR * 1.6, moon.y - moonR * 1.6, moonR * 3.2, moonR * 3.2)
  // Crescent = moon disc minus an offset disc.
  ctx.beginPath()
  ctx.arc(moon.x, moon.y, moonR, 0, Math.PI * 2)
  ctx.clip()
  ctx.beginPath()
  ctx.rect(moon.x - moonR, moon.y - moonR, moonR * 2, moonR * 2)
  ctx.arc(moon.x + moonR * 0.42, moon.y - moonR * 0.16, moonR * 0.9, 0, Math.PI * 2)
  ctx.globalAlpha = 0.16 + 0.22 * glow
  ctx.fillStyle = '#f6dcae'
  ctx.fill('evenodd')
  ctx.restore()

  ctx.strokeStyle = 'rgba(246, 217, 161, 0.85)'
  ctx.lineWidth = 2.4 * s
  ctx.lineCap = 'round'
  ctx.shadowColor = '#f6d9a1'
  ctx.shadowBlur = 12 * s
  const lineProgress = clamp(progress / 0.75) * (points.length - 1)
  for (let i = 0; i < points.length - 1; i += 1) {
    const amount = clamp(lineProgress - i)
    if (amount <= 0) break
    const from = points[i]
    const to = points[i + 1]
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(from.x + (to.x - from.x) * amount, from.y + (to.y - from.y) * amount)
    ctx.stroke()
  }
  points.forEach((p, i) => {
    const lit = clamp(lineProgress - i + 1)
    ctx.globalAlpha = 0.35 + 0.65 * lit
    ctx.shadowBlur = (16 + 26 * glow) * s
    ctx.fillStyle = '#fff1cf'
    ctx.beginPath()
    ctx.arc(p.x, p.y, (5 + 3 * glow) * s, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.globalAlpha = 1
  ctx.shadowBlur = 0

  // Words fade in once the stars begin to connect.
  ctx.globalAlpha = clamp((progress - 0.35) / 0.35)
  ctx.textBaseline = 'alphabetic'
  const textX = portrait ? width / 2 : width * 0.52
  ctx.textAlign = portrait ? 'center' : 'left'
  const maxText = portrait ? width * 0.78 : width * 0.42

  ctx.fillStyle = '#e8c99a'
  ctx.font = `500 ${24 * s}px ${sans}`
  spaced(ctx, `${8 * s}px`)
  ctx.fillText('HAPPY BIRTHDAY', textX, portrait ? height * 0.535 : height * 0.25)
  spaced(ctx, '0px')

  ctx.fillStyle = '#f6d3ab'
  ctx.font = `italic 400 ${(portrait ? 150 : 130) * s}px ${serif}`
  ctx.fillText(recipientName, textX, portrait ? height * 0.64 : height * 0.41)

  ctx.fillStyle = '#fff3e6'
  ctx.font = `400 ${(portrait ? 42 : 36) * s}px ${serif}`
  const lineHeight = (portrait ? 56 : 48) * s
  wrapText(ctx, finalWish, maxText).forEach((line, i) => ctx.fillText(line, textX, (portrait ? height * 0.71 : height * 0.53) + i * lineHeight))

  ctx.fillStyle = '#efdcc8'
  ctx.font = `500 ${22 * s}px ${sans}`
  spaced(ctx, `${4 * s}px`)
  ctx.fillText(cardDate.toUpperCase(), textX, portrait ? height * 0.865 : height * 0.84)
  spaced(ctx, '0px')

  ctx.textAlign = 'right'
  ctx.fillStyle = '#f6d39a'
  ctx.font = `400 ${(portrait ? 62 : 56) * s}px ${hand}`
  ctx.fillText(signatureName, width - 60 * s, height - 46 * s)
  ctx.restore()
}
