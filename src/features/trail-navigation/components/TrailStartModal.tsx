'use client'

import { useRouter } from 'next/navigation'
import { TrailNavigationMap } from './TrailNavigationMap'
import type { TrailNavigationData } from '../types'

/**
 * Coque client de la navigation rando en overlay (route interceptée @modal).
 * La fermeture passe par `router.back()` : on revient à la liste d'où on a ouvert le
 * modal et le slot @modal repasse en `default` (null). Un simple `<Link>` vers la liste
 * ne suffit pas à réinitialiser le slot parallèle.
 */
export function TrailStartModal({
  trail,
  backHref,
}: {
  trail: TrailNavigationData
  backHref: string
}) {
  const router = useRouter()
  return (
    <div className="fixed inset-0 z-[100]" data-testid="trail-start-modal">
      <TrailNavigationMap trail={trail} backHref={backHref} onClose={() => router.back()} />
    </div>
  )
}
