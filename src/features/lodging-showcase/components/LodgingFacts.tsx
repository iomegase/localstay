import { Bath, BedDouble, BedSingle, Maximize, Users } from 'lucide-react'

export function LodgingFacts(props: {
  maxGuests: number
  bedroomCount: number | null
  bathroomCount: number | null
  bedCount: number | null
  surfaceM2: number | null
}) {
  const facts = [
    { label: 'Voyageurs', value: props.maxGuests, icon: Users },
    { label: 'Chambres', value: props.bedroomCount, icon: BedDouble },
    { label: 'Salles de bain', value: props.bathroomCount, icon: Bath },
    { label: 'Couchages', value: props.bedCount, icon: BedSingle },
    { label: 'Surface', value: props.surfaceM2 != null ? `${props.surfaceM2} m²` : null, icon: Maximize },
  ].filter(fact => fact.value != null)

  if (facts.length === 0) return null

  return (
    <section
      aria-label="Caractéristiques du logement"
      className="flex items-stretch divide-x divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
    >
      {facts.map(fact => (
        <div
          key={fact.label}
          aria-label={`${fact.label} : ${fact.value}`}
          title={`${fact.label} : ${fact.value}`}
          className="flex flex-1 flex-col items-center justify-center gap-2 px-1.5 py-4"
        >
          <fact.icon className="h-[18px] w-[18px] text-gold" strokeWidth={1.75} aria-hidden="true" />
          <span className="text-[15px] font-semibold leading-none text-charcoal">{fact.value}</span>
        </div>
      ))}
    </section>
  )
}
