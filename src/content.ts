// All words, captions, and asset paths for the experience live here so they can
// be reviewed in one place before release (NFR-011). Items marked PROVISIONAL
// should be read and approved by Abhishek.

export const recipientName = 'Shrishti'
export const signatureName = 'Abhishek'
export const cardDate = '3 November 2026'

export const birthdayGreeting = 'Tonight, even the moon has something special waiting for you.'
export const finalWish = 'May life be as gentle with you as you have been with the world, and may you always find a little light waiting for you.'
export const closingLine = 'Whenever you need a little escape, this little world will be here.'

export type DiscoveryId = 'moonflower' | 'starlit-fountain' | 'wishing-tree' | 'secret-path' | 'little-constellation'

export type Discovery = {
  id: DiscoveryId
  name: string
  hint: string
  message: string
  /** Marker position in the garden; CSS may refine it per breakpoint. */
  x: string
  y: string
  /** Optional hidden photograph revealed with the message (FR-024). */
  photoId?: string
}

// Order matters: each discovery unlocks the next one.
export const discoveries: Discovery[] = [
  {
    id: 'moonflower',
    name: 'Moonflower',
    hint: 'Bottom left. The flower that’s glowing.',
    message: 'Okay, first one found. Four more to go. I hid them myself, so don’t expect them to be that hard.',
    x: '24%',
    y: '68%',
  },
  {
    id: 'starlit-fountain',
    name: 'Starlit Fountain',
    hint: 'Bottom right, near the water.',
    message: 'This is a wishing fountain. Make a wish. Not a sensible one, a big one.',
    x: '71%',
    y: '64%',
  },
  {
    id: 'wishing-tree',
    name: 'Wishing Tree',
    hint: 'Top right. The tree.',
    message: 'Your fake candids, though no less beautiful.',
    x: '84%',
    y: '38%',
    photoId: 'memory-3',
  },
  {
    id: 'secret-path',
    name: 'Secret Path',
    hint: 'Somewhere in the middle. Follow the fireflies.',
    message: 'Your Mischiefs, sweet mischiefs.',
    x: '43%',
    y: '42%',
    photoId: 'memory-5',
  },
  {
    id: 'little-constellation',
    name: 'Little Constellation',
    hint: 'Top left. The little stars.',
    message: 'That’s all five. Look at the sky now. It’s a moon sitting on a sunset. Getting those five dots right took me way longer than it should have.',
    x: '13%',
    y: '31%',
  },
]

export const optionalSecretMessage = 'You found the lazy firefly. It says happy birthday. That’s all it says.'

export type Memory = {
  id: string
  /** Drop the real photo at this path inside /public. Missing files show a styled placeholder. */
  src: string
  alt: string
  caption: string
  /** Where square crops should centre, as a CSS object-position (defaults to the middle). */
  focus?: string
}

// PROVISIONAL captions. Handwritten style only: no dates or locations (FR-027).
export const memories: Memory[] = [
  { id: 'memory-1', src: '/images/memories/memory-1.jpg', alt: 'Shrishti in a floral saree and Abhishek in a vintage brown suit, posing under a tree', caption: 'we fully committed to this one' },
  { id: 'memory-2', src: '/images/memories/memory-2.jpg', alt: 'Shrishti and Abhishek on a balcony, with green hills and a cloudy sky behind them', caption: 'good view. the clouds weren’t invited' },
  { id: 'memory-3', src: '/images/memories/memory-3.jpg', alt: 'Shrishti looking away among purple and white flowers', caption: 'you, ignoring the camera completely' },
  { id: 'memory-4', src: '/images/memories/memory-4.jpg', alt: 'Shrishti laughing beside Abhishek at a hilltop viewpoint', caption: 'no idea what was funny. you probably remember' },
  { id: 'memory-5', src: '/images/memories/memory-5.jpg', alt: 'Shrishti playfully presenting Abhishek beneath a white stone archway', caption: 'presenting: me. apparently very impressive', focus: 'center 82%' },
  { id: 'memory-6', src: '/images/memories/memory-6.jpg', alt: 'Shrishti pointing out the valley view while Abhishek looks on', caption: 'That "kudd jaao" moment' },
]

// PROVISIONAL letter. Gentle appreciation, one light affectionate line, no confession.
export const letter = {
  salutation: `Dear ${recipientName},`,
  paragraphs: [
    'Happy birthday! I can already hear you saying “oh my dog” at all of this.',
    'I didn’t want to just send you a message this year, so I made this instead. It took a lot longer than I’d like to admit.',
    'I don’t say this enough, but you’re one of the kindest people I know. You notice when something’s off before anyone else does, and you never make a big deal of it. You just quietly make it better.',
    'Whenever I needed someone, you were always there. You never let me feel alone, not even once. I don’t think I ever properly thanked you for that. So, thank you. Really.',
    'And thank you for putting up with me in general. The overthinking, the long messages, the random moods. You handle all of it way more calmly than I would. I honestly don’t know how you do it. (Please don’t stop.)',
    'Having a friend like you makes everything a bit easier. That’s the simplest way I can put it.',
    'So my wish for you is simple: I hope life is as kind to you as you are to everyone else. You deserve that, and a lot more.',
  ],
  signOff: 'Happy birthday, again.',
}

// PROVISIONAL gift wording. Set the amount; leave it '' to hide it.
export const gift = {
  eyebrow: 'ONE LAST THING',
  intro: 'Nothing big. Just something from me.',
  cardLabel: 'Amazon Gift Card',
  amount: '',
  message: 'Buy yourself something fun with this. Not groceries.',
  /** The card design from Amazon (no code on it). If it fails to load, a drawn card is shown instead. */
  image: '/images/gift/gift-card.jpg',
  imageAlt: 'Amazon Pay gift card: a golden sunset over a palm-lined beach with the words Happy Birthday, Shrishti',
  redeemUrl: 'https://www.amazon.in/gc/redeem',
  /** Shown instead of a code when Amazon delivers the card to her email directly. */
  deliveryNote: 'The card is in your Whatsapp. Go check.',
}

/**
 * The claim code comes from the build environment, never from source control.
 * Anything shipped to the browser is readable by anyone with the link, so leave
 * this unset if Amazon is emailing the card to her directly.
 */
export const giftCode = ((import.meta.env.VITE_GIFT_CARD_CODE as string | undefined) ?? '').trim()

export const audioPaths = {
  voiceNote: '/audio/voice-note/voice-note.m4a',
} as const

/** The custom constellation: a crescent resting on a curved sunset horizon. Points sit in a 100 × 100 box. */
export const constellationPoints: Record<DiscoveryId, { x: number; y: number }> = {
  moonflower: { x: 34, y: 14 },
  'starlit-fountain': { x: 17, y: 38 },
  'wishing-tree': { x: 26, y: 66 },
  'secret-path': { x: 56, y: 80 },
  'little-constellation': { x: 86, y: 70 },
}
