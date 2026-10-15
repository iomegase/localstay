import type { ReactNode } from 'react'

/**
 * Eyebrow des sections de la fiche logement, identique à celui des cases
 * « Équipements » (trait rose puis libellé) — spec 028 AC-02-15. Rendu en h2
 * pour conserver la structure des titres de la page.
 */
export function LodgingSectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <h2 className="relative mb-4 pt-7 text-[10px] font-extrabold uppercase tracking-[0.18em] text-pink-600 before:absolute before:left-0 before:top-0 before:h-[3px] before:w-12 before:bg-pink-600">
      {children}
    </h2>
  )
}
