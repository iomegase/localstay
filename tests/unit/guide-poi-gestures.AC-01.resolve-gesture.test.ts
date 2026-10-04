import { TOUCH_GESTURE, gestureOutcome, resolveGestureIntent } from '@/shared/lib/touch-gesture'

const base = { startOffsetX: 200, atTop: true, onHero: true }

describe('060 — classification des gestes de la fiche lieu', () => {
  it('fixe les seuils de la spec', () => {
    expect(TOUCH_GESTURE).toEqual({ axisLockPx: 10, photoSwipePx: 40, edgeZonePx: 24, backPx: 80, closePx: 120 })
  })

  it('reste indécis sous 10 px de mouvement', () => {
    expect(resolveGestureIntent({ ...base, dx: 6, dy: 8 })).toBeNull()
  })

  it('AC-01-03: un glisser vers la droite depuis le bord gauche est un retour, prioritaire sur la photo', () => {
    expect(resolveGestureIntent({ ...base, startOffsetX: 12, dx: 30, dy: 4 })).toBe('edge-back')
    expect(resolveGestureIntent({ ...base, startOffsetX: 12, dx: -30, dy: 4 })).toBe('photo')
    expect(resolveGestureIntent({ ...base, startOffsetX: 30, dx: 30, dy: 4 })).toBe('photo')
  })

  it('AC-01-01: un glisser horizontal sur la photo change de photo ; ailleurs, rien', () => {
    expect(resolveGestureIntent({ ...base, dx: -30, dy: 5 })).toBe('photo')
    expect(resolveGestureIntent({ ...base, onHero: false, dx: -30, dy: 5 })).toBe('none')
  })

  it('AC-01-04: tirer vers le bas depuis la photo, fiche tout en haut, ferme', () => {
    expect(resolveGestureIntent({ ...base, dx: 3, dy: 30 })).toBe('pull-close')
    expect(resolveGestureIntent({ ...base, atTop: false, dx: 3, dy: 30 })).toBe('none')
    expect(resolveGestureIntent({ ...base, onHero: false, dx: 3, dy: 30 })).toBe('none')
    expect(resolveGestureIntent({ ...base, dx: 3, dy: -30 })).toBe('none')
  })

  it('AC-01-01 / AC-01-03 / AC-01-04: issue selon les seuils au relâcher', () => {
    expect(gestureOutcome('photo', -40, 0)).toBe('next-photo')
    expect(gestureOutcome('photo', 40, 0)).toBe('previous-photo')
    expect(gestureOutcome('photo', -39, 0)).toBe('none')
    expect(gestureOutcome('edge-back', 80, 0)).toBe('back')
    expect(gestureOutcome('edge-back', 79, 0)).toBe('none')
    expect(gestureOutcome('pull-close', 0, 120)).toBe('back')
    expect(gestureOutcome('pull-close', 0, 119)).toBe('none')
  })

  it('AC-01-05: un geste sans intention ne déclenche rien', () => {
    expect(gestureOutcome('none', 300, 300)).toBe('none')
    expect(gestureOutcome(null, 300, 300)).toBe('none')
  })
})
