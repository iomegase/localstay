/**
 * Gestes tactiles de la fiche lieu du guide (spec 060).
 * Logique pure : la direction est verrouillée après `axisLockPx`, puis l'issue
 * est décidée au relâcher selon les seuils.
 */
export const TOUCH_GESTURE = {
  axisLockPx: 10,
  photoSwipePx: 40,
  edgeZonePx: 24,
  backPx: 80,
  closePx: 120,
} as const

export type GestureIntent = 'edge-back' | 'pull-close' | 'photo' | 'none'
export type GestureOutcome = 'back' | 'next-photo' | 'previous-photo' | 'none'

type GestureStart = {
  /** Distance entre le point de départ et le bord gauche de la fiche. */
  startOffsetX: number
  /** La fiche est défilée tout en haut au début du geste. */
  atTop: boolean
  /** Le geste commence sur la photo. */
  onHero: boolean
}

export function resolveGestureIntent({
  startOffsetX,
  atTop,
  onHero,
  dx,
  dy,
}: GestureStart & { dx: number; dy: number }): GestureIntent | null {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < TOUCH_GESTURE.axisLockPx) return null

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0 && startOffsetX < TOUCH_GESTURE.edgeZonePx) return 'edge-back'
    return onHero ? 'photo' : 'none'
  }
  return dy > 0 && atTop && onHero ? 'pull-close' : 'none'
}

export function gestureOutcome(intent: GestureIntent | null, dx: number, dy: number): GestureOutcome {
  switch (intent) {
    case 'edge-back':
      return dx >= TOUCH_GESTURE.backPx ? 'back' : 'none'
    case 'pull-close':
      return dy >= TOUCH_GESTURE.closePx ? 'back' : 'none'
    case 'photo':
      if (dx <= -TOUCH_GESTURE.photoSwipePx) return 'next-photo'
      if (dx >= TOUCH_GESTURE.photoSwipePx) return 'previous-photo'
      return 'none'
    default:
      return 'none'
  }
}
