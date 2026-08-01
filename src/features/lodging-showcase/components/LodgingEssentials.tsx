import { Bath, BedDouble, Maximize2, UsersRound } from 'lucide-react'

type Essential = {
  label: string
  value: string
  icon: typeof Maximize2
}

function countLabel(value: number, singular: string, plural: string) {
  return `${value} ${value > 1 ? plural : singular}`
}

export function LodgingEssentials({
  title,
  maxGuests,
  bedroomCount,
  bathroomCount,
  surfaceM2,
}: {
  title: string
  maxGuests: number
  bedroomCount: number | null
  bathroomCount: number | null
  surfaceM2: number | null
}) {
  const essentials: Array<Essential | null> = [
    surfaceM2 == null ? null : { label: 'Surface', value: `${surfaceM2} m²`, icon: Maximize2 },
    { label: 'Voyageurs', value: countLabel(maxGuests, 'voyageur', 'voyageurs'), icon: UsersRound },
    bedroomCount == null
      ? null
      : { label: 'Chambres', value: countLabel(bedroomCount, 'chambre', 'chambres'), icon: BedDouble },
    bathroomCount == null
      ? null
      : {
          label: 'Salles de bain',
          value: countLabel(bathroomCount, 'salle de bain', 'salles de bain'),
          icon: Bath,
        },
  ]

  const visibleEssentials = essentials.filter((item): item is Essential => item !== null)

  return (
    <section
      data-testid="lodging-essentials"
      className="bg-[#f8f7f5] px-4 py-7 sm:px-6 md:py-10 xl:py-10"
    >
      <div className="mx-auto w-full max-w-[944px]">
        <div className="mb-4 md:mb-6 md:flex md:items-end md:justify-between md:gap-10 xl:mb-7">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-pink-600">
            En détail
          </span>
          <h2 className="mt-2 max-w-[600px] text-[24px] font-semibold leading-[1.05] tracking-[-0.04em] text-slate-800 md:mt-0 md:text-right md:text-[34px] md:leading-[1.08]">
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
              <dd className="text-[14px] font-bold tracking-[-0.02em] text-slate-800">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
