'use client'

import type { GuideLodging } from '@/features/guide-app/types'
import { FacilibusNextDeparturesCard } from './FacilibusNextDeparturesCard'
import { GuideTransportRow } from './GuideTransportRow'

/**
 * Entrée transports de la page Séjour (spec 055 AC-01-01/02) : prochaines
 * navettes si le logement est localisé et desservi, sinon la ligne « Se déplacer ».
 */
export function GuideTransportEntry({
  lodging,
  onOpen,
}: {
  lodging: Pick<GuideLodging, 'facilibus' | 'transportCards' | 'locationPrecise' | 'latitude' | 'longitude'>
  onOpen: () => void
}) {
  if (!lodging.facilibus && lodging.transportCards.length === 0) return null
  const row = <GuideTransportRow onOpen={onOpen} />
  if (!lodging.facilibus || !lodging.locationPrecise) return row
  return (
    <FacilibusNextDeparturesCard
      latitude={lodging.latitude}
      longitude={lodging.longitude}
      onOpen={onOpen}
      fallback={row}
    />
  )
}
