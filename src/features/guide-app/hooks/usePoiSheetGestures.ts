'use client'

import { useRef, type TouchEvent } from 'react'
import { gestureOutcome, resolveGestureIntent, type GestureIntent } from '@/shared/lib/touch-gesture'

type Gesture = {
  x: number
  y: number
  startOffsetX: number
  atTop: boolean
  onHero: boolean
  intent: GestureIntent | null
}

function isScrolledToTop(element: HTMLElement): boolean {
  for (let node = element.parentElement; node; node = node.parentElement) {
    if (node.scrollTop > 0) return false
  }
  return true
}

function prefersReducedMotion(): boolean {
  return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
}

/**
 * Spec 060 AC-01-03 / AC-01-04 : glisser depuis le bord gauche ou tirer la
 * photo vers le bas ferme la fiche (même action que le bouton ←). La fiche
 * suit le doigt via `transform`, sans re-rendu React à chaque mouvement.
 */
export function usePoiSheetGestures<T extends HTMLElement>(onBack: () => void) {
  const ref = useRef<T>(null)
  const gestureRef = useRef<Gesture | null>(null)

  function moveSheet(x: number, y: number) {
    const element = ref.current
    if (!element || prefersReducedMotion()) return
    element.style.transition = 'none'
    element.style.transform = `translate3d(${x}px, ${y}px, 0)`
  }

  function resetSheet() {
    const element = ref.current
    if (!element) return
    element.style.transition = ''
    element.style.transform = ''
  }

  function onTouchStart(event: TouchEvent<T>) {
    const touch = event.touches[0]
    const element = ref.current
    if (!touch || !element) return
    const target = event.target instanceof Element ? event.target : null
    gestureRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      startOffsetX: touch.clientX - element.getBoundingClientRect().left,
      atTop: isScrolledToTop(element),
      onHero: Boolean(target?.closest('[data-poi-hero]')),
      intent: null,
    }
  }

  function onTouchMove(event: TouchEvent<T>) {
    const gesture = gestureRef.current
    const touch = event.touches[0]
    if (!gesture || !touch) return
    const dx = touch.clientX - gesture.x
    const dy = touch.clientY - gesture.y
    if (gesture.intent === null) gesture.intent = resolveGestureIntent({ ...gesture, dx, dy })
    if (gesture.intent === 'edge-back') moveSheet(Math.max(0, dx), 0)
    if (gesture.intent === 'pull-close') moveSheet(0, Math.max(0, dy))
  }

  function onTouchEnd(event: TouchEvent<T>) {
    const gesture = gestureRef.current
    const touch = event.changedTouches[0]
    gestureRef.current = null
    resetSheet()
    if (!gesture || !touch) return
    if (gestureOutcome(gesture.intent, touch.clientX - gesture.x, touch.clientY - gesture.y) === 'back') onBack()
  }

  function onTouchCancel() {
    gestureRef.current = null
    resetSheet()
  }

  return { ref, handlers: { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel } }
}
