import { Bath, BedDouble, Expand, Users } from 'lucide-react'

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
    { label: 'Surface', value: props.surfaceM2 ? `${props.surfaceM2} m2` : null, icon: Expand },
  ].filter(fact => fact.value != null)

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {facts.map(fact => (
        <div key={fact.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <fact.icon className="mb-3 h-5 w-5 text-gold" />
          <p className="text-sm text-gray-500">{fact.label}</p>
          <p className="text-lg font-medium text-charcoal">{fact.value}</p>
        </div>
      ))}
      {props.bedCount != null && (
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <BedDouble className="mb-3 h-5 w-5 text-gold" />
          <p className="text-sm text-gray-500">Couchages</p>
          <p className="text-lg font-medium text-charcoal">{props.bedCount}</p>
        </div>
      )}
    </section>
  )
}
