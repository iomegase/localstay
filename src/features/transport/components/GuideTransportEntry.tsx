'use client'

import type { GuideLodging } from '@/features/guide-app/types'
import { GuideTransportRow } from './GuideTransportRow'

/** Entrée unique vers les transports depuis la page Séjour. */
export function GuideTransportEntry({
  lodging,
  onOpen,
}: {
  lodging: Pick<GuideLodging, 'facilibus' | 'transportCards'>
  onOpen: () => void
}) {
  if (!lodging.facilibus && lodging.transportCards.length === 0) return null
  return <GuideTransportRow onOpen={onOpen} />
}
