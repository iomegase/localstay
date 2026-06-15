'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Barre d'actions (retour / partager / favori) épinglée en haut.
 * Elle s'auto-masque quand l'utilisateur scrolle vers le bas et réapparaît au scroll vers le haut.
 * Le conteneur de scroll est détecté dynamiquement : la fenêtre sur une page classique,
 * ou le panneau `overflow-y-auto` lorsque le corps est rendu dans le modal favori.
 */
export function PoiDetailTopBar({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const scroller = findScrollParent(ref.current)
    let lastY = scroller ? scroller.scrollTop : window.scrollY

    const onScroll = () => {
      const y = scroller ? scroller.scrollTop : window.scrollY
      if (Math.abs(y - lastY) < 6) return
      setHidden(y > lastY && y > 48)
      lastY = y
    }

    if (scroller) {
      scroller.addEventListener('scroll', onScroll, { passive: true })
      return () => scroller.removeEventListener('scroll', onScroll)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      ref={ref}
      className={`fixed left-1/2 top-0 z-[60] w-full max-w-[430px] -translate-x-1/2 px-6 py-3 transition-transform duration-300 ${
        hidden ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      <div className="flex items-center justify-between">{children}</div>
    </div>
  )
}

function findScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null
  while (node) {
    const overflowY = getComputedStyle(node).overflowY
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
      return node
    }
    node = node.parentElement
  }
  return null
}
