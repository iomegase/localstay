'use client'

import { useEffect, useState } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'

/**
 * Spec 088 BR-03 : carte agrandie à tout l'écran (overlay CSS, compatible iPhone où l'API
 * Fullscreen n'existe pas) ; Échap la referme et la page ne défile pas derrière.
 */
export function useMapFullscreen() {
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!expanded) return
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setExpanded(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [expanded])

  return { expanded, toggle: () => setExpanded(value => !value) }
}

export function mapFrameClass(expanded: boolean, collapsedClass: string): string {
  return expanded ? 'fixed inset-0 z-[100] h-full w-full overflow-hidden bg-white' : collapsedClass
}

export function MapFullscreenButton({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  const Icon = expanded ? Minimize2 : Maximize2
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={expanded ? 'Quitter le plein écran' : 'Afficher la carte en plein écran'}
      aria-pressed={expanded}
      className="absolute left-3 top-3 z-[2] grid size-10 place-items-center rounded-full bg-white text-slate-700 shadow-md transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-pink-600"
    >
      <Icon className="size-[18px]" aria-hidden="true" />
    </button>
  )
}
