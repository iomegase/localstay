import {
  Bath,
  BedDouble,
  Clapperboard,
  Droplets,
  Maximize2,
  Sparkles,
  UsersRound,
  Waves,
} from 'lucide-react'

type Essential = {
  label: string
  value: string
  icon: typeof Maximize2
}

function hasAmenity(amenities: string[], keywords: string[]) {
  return amenities.some(amenity => {
    const normalized = amenity
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
    return keywords.some(keyword => normalized.includes(keyword))
  })
}

export function LodgingEssentials({
  title,
  maxGuests,
  bedroomCount,
  bathroomCount,
  surfaceM2,
  amenities = [],
}: {
  title: string
  maxGuests: number
  bedroomCount: number | null
  bathroomCount: number | null
  surfaceM2: number | null
  amenities?: string[]
}) {
  const essentials: Array<Essential | null> = [
    surfaceM2 == null ? null : { label: 'Surface', value: `${surfaceM2} m²`, icon: Maximize2 },
    { label: 'Voyageurs', value: String(maxGuests), icon: UsersRound },
    bedroomCount == null ? null : { label: 'Chambres', value: String(bedroomCount), icon: BedDouble },
    bathroomCount == null ? null : { label: 'Salles de bain', value: String(bathroomCount), icon: Bath },
    hasAmenity(amenities, ['piscine', 'pool'])
      ? { label: 'Piscine', value: 'Oui', icon: Waves }
      : null,
    hasAmenity(amenities, ['hammam'])
      ? { label: 'Hammam', value: 'Oui', icon: Droplets }
      : null,
    hasAmenity(amenities, ['jacuzzi', 'spa', 'bain a remous', 'bain nordique'])
      ? { label: 'Jacuzzi', value: 'Oui', icon: Sparkles }
      : null,
    hasAmenity(amenities, ['cinema', 'home cinema', 'projecteur'])
      ? { label: 'Cinéma', value: 'Oui', icon: Clapperboard }
      : null,
  ]

  const visibleEssentials = essentials.filter((item): item is Essential => item !== null)

  return (
    <section
      data-testid="lodging-essentials"
      className="bg-[#f8f7f5] px-4 py-7 sm:px-6 md:py-10 xl:py-10 mt-8"
    >
      <div className="mx-auto w-full max-w-[944px]">
        <div className="mb-4 md:mb-6 md:flex md:items-end md:justify-between md:gap-10 xl:mb-7">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-pink-600">
            En détail
          </span>
          <h2 className="mt-2 max-w-[600px] text-[16px] font-semibold leading-[1.05] tracking-[-0.04em] text-slate-800 md:mt-0 md:text-right md:text-[20px] md:leading-[1.08]">
            Les essentiels, en un coup d’œil.
          </h2>
        </div>

        <dl
          aria-label={`Caractéristiques principales de ${title}`}
          className="grid grid-cols-2 overflow-hidden rounded-[20px] border border-slate-200/70 bg-white md:grid-cols-5 md:divide-x md:divide-slate-100"
        >
          {visibleEssentials.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="flex min-h-[64px] flex-col items-center justify-center gap-1 border-b border-r border-slate-100 px-3 py-2 text-center even:border-r-0 last:border-b-0 md:min-h-[82px] md:gap-1.5 md:border-b-0 md:border-r-0 md:px-4 md:py-2.5"
            >
              <div className="flex items-center gap-1.5">
                <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-pink-600" strokeWidth={1.8} />
                <dt className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
                  {label}
                </dt>
              </div>
              <dd className="w-full text-center text-[14px] font-bold tracking-[-0.02em] text-slate-800">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
