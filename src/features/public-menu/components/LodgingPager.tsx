'use client'

import { Children, useRef, useState, type PointerEvent, type ReactNode, type TouchEvent, type WheelEvent } from 'react'

interface LodgingPagerProps {
  titles: string[]
  children: ReactNode
}

export function LodgingPager({ titles, children }: LodgingPagerProps) {
  const panels = Children.toArray(children)
  const [active, setActive] = useState(0)
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)
  const gestureHandledRef = useRef(false)
  const lastWheelNavigationAtRef = useRef(0)
  const activePanel = panels[active] ?? panels[0] ?? null
  const horizontalThreshold = 44

  function goTo(index: number) {
    setActive(index)
  }

  function goToPrevious() {
    setActive(current => Math.max(0, current - 1))
  }

  function goToNext() {
    setActive(current => Math.min(panels.length - 1, current + 1))
  }

  function startGesture(x: number, y: number) {
    pointerStartRef.current = { x, y }
    gestureHandledRef.current = false
  }

  function navigateFromDelta(deltaX: number, deltaY: number) {
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    if (absX < horizontalThreshold || absX <= absY * 1.2) return false
    if (deltaX < 0) goToNext()
    else goToPrevious()
    return true
  }

  function endGesture(x: number, y: number) {
    const start = pointerStartRef.current
    pointerStartRef.current = null
    if (!start || gestureHandledRef.current) return

    navigateFromDelta(x - start.x, y - start.y)
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    startGesture(event.clientX, event.clientY)
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    endGesture(event.clientX, event.clientY)
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const start = pointerStartRef.current
    if (!start || gestureHandledRef.current) return
    if (!navigateFromDelta(event.clientX - start.x, event.clientY - start.y)) return
    gestureHandledRef.current = true
    pointerStartRef.current = null
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0]
    if (!touch) return
    startGesture(touch.clientX, touch.clientY)
  }

  function handleTouchMove(event: TouchEvent<HTMLDivElement>) {
    const start = pointerStartRef.current
    const touch = event.touches[0]
    if (!start || !touch || gestureHandledRef.current) return

    const deltaX = touch.clientX - start.x
    const deltaY = touch.clientY - start.y
    if (!navigateFromDelta(deltaX, deltaY)) return

    gestureHandledRef.current = true
    pointerStartRef.current = null
    event.preventDefault()
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const touch = event.changedTouches[0]
    if (!touch) return
    endGesture(touch.clientX, touch.clientY)
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    const absX = Math.abs(event.deltaX)
    const absY = Math.abs(event.deltaY)
    if (absX < 36 || absX <= absY * 1.2) return

    const now = Date.now()
    if (now - lastWheelNavigationAtRef.current < 420) return

    event.preventDefault()
    lastWheelNavigationAtRef.current = now
    if (event.deltaX > 0) goToNext()
    else goToPrevious()
  }

  function handlePointerCancel() {
    pointerStartRef.current = null
    gestureHandledRef.current = false
  }

  return (
    <div className="rounded-[32px] bg-white pt-4 pb-6">
      <div className="mb-3 flex items-center justify-between px-5">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">{titles[active]}</h2>
        <div className="flex items-center gap-2">
          {titles.map((title, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Aller à ${title}`}
              aria-current={index === active}
              onClick={() => goTo(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === active ? 'w-5 bg-charcoal' : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      <div
        role="group"
        aria-label="Navigation du guide logement"
        aria-roledescription="carrousel"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handlePointerCancel}
        onWheel={handleWheel}
        className="touch-pan-y overscroll-x-contain px-4"
      >
        <div key={active} data-testid="lodging-pager-panel" className="w-full">
          {activePanel}
        </div>
      </div>
    </div>
  )
}
