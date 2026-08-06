import {
  BedDouble,
  Droplets,
  Flame,
  MapPin,
  Maximize,
  PlugZap,
  Users,
  Waves,
  WavesLadder,
  type LucideIcon,
} from 'lucide-react'
import { capitalizeFirst } from '@/shared/lib/utils'
import type { GuideLodgingCard } from '@/features/guide-app/types'

/** Équipements « valorisés » affichés en icône s'ils sont présents. */
const AMENITY_BADGES: Array<{ terms: string[]; icon: LucideIcon; label: string }> = [
  { terms: ['piscine'], icon: WavesLadder, label: 'Piscine' },
  { terms: ['borne', 'recharge'], icon: PlugZap, label: 'Borne de recharge' },
  { terms: ['jacuzzi', 'bain à remous', 'remous', 'spa'], icon: Waves, label: 'Jacuzzi' },
  { terms: ['hammam'], icon: Droplets, label: 'Hammam' },
  { terms: ['sauna'], icon: Flame, label: 'Sauna' },
]

function matchedAmenities(amenities: string[]) {
  const normalized = amenities.map(a => a.toLocaleLowerCase('fr'))
  return AMENITY_BADGES.filter(badge =>
    normalized.some(a => badge.terms.some(term => a.includes(term))),
  )
}

/**
 * Carte logement du guide (guest confiné) : image carrée, sans description, pin
 * blanc, métriques et équipements en icônes blanches. Purement présentative —
 * le clic est géré par le bouton parent (aucun lien sortant).
 */
export function GuideLodgingListCard({ lodging }: { lodging: GuideLodgingCard }) {
  const amenityBadges = matchedAmenities(lodging.amenities)

  return (
    <article className="relative w-full rounded-[2rem] bg-white p-2 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
      <div className="relative aspect-square w-full overflow-hidden rounded-[1.6rem] bg-zinc-900">
        {lodging.coverPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- image distante (parité guide)
          <img
            src={lodging.coverPhotoUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-zinc-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />

        <span className="absolute left-4 top-4 rounded-full bg-white/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white backdrop-blur-md">
          {lodging.propertyType}
        </span>

        <div className="absolute inset-x-0 bottom-0 flex flex-col p-5 text-white">
          <h2 className="line-clamp-1 text-2xl font-bold tracking-tight">
            {capitalizeFirst(lodging.title)}
          </h2>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-white/85">
            <MapPin className="h-4 w-4 text-white" />
            {lodging.cityName}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Metric icon={Users} value={lodging.maxGuests} />
            <Metric icon={BedDouble} value={lodging.bedroomCount ?? '—'} />
            {lodging.surfaceM2 != null && (
              <Metric icon={Maximize} value={`${lodging.surfaceM2} m²`} />
            )}
            {amenityBadges.map(badge => (
              <badge.icon
                key={badge.label}
                aria-label={badge.label}
                className="h-[18px] w-[18px] text-white"
                strokeWidth={1.8}
              />
            ))}
          </div>
        </div>
      </div>
    </article>
  )
}

function Metric({ icon: Icon, value }: { icon: LucideIcon; value: string | number }) {
  return (
    <span className="flex items-center gap-1.5 text-base font-bold text-white">
      <Icon className="h-[18px] w-[18px] text-white" strokeWidth={1.8} />
      {value}
    </span>
  )
}
