import { Car, Footprints } from 'lucide-react'
import { primaryTravel } from '@/features/guide-app/components/stay/poi-search'
import type { NearbyResult } from '../types'

/**
 * Accès à l'arrêt depuis le logement : temps réel MapBox (à pied si ≤ 25 min,
 * sinon en voiture — même règle que les cartes photo, spec 057), à défaut la
 * distance à vol d'oiseau.
 */
export function StationDistance({ station }: { station: NearbyResult['stations'][number] }) {
  const travel = primaryTravel(station.travel ?? undefined)
  if (!travel) {
    return <p className="text-[13px] text-[#697386]">{station.distanceMeters} m à vol d&apos;oiseau</p>
  }
  const walking = travel.mode === 'walking'
  const Icon = walking ? Footprints : Car
  return (
    <p className="flex mb-4 items-center gap-1.5 text-[12px] text-[#697386]">
      <span role="img" aria-label={walking ? 'À pied' : 'En voiture'}>
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <span>{travel.label}</span>
      <span>{walking ? 'à pied' : 'en voiture'} depuis le logement</span>
    </p>
  )
}
