import Link from 'next/link'
import { LodgingCard } from './LodgingCard'

export function LodgingCitySection(props: {
  citySlug: string
  cityName: string
  lodgings: Array<{
    id: string
    href: string
    title: string
    cover_photo_url: string | null
    short_description: string
    property_type: string
    max_guests: number
    bedroom_count: number | null
    public_area_label: string | null
    amenities: string[]
  }>
}) {
  if (props.lodgings.length === 0) return null

  return (
    <section className="mb-10 px-4">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
            Sejour
          </p>
          <h2 className="mt-1 text-2xl font-light text-charcoal">Sejourner a {props.cityName}</h2>
        </div>
        <Link
          href={`/guide/${props.citySlug}/logements`}
          className="text-sm font-medium text-charcoal underline underline-offset-4"
        >
          Voir tous les logements
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {props.lodgings.map(lodging => (
          <LodgingCard
            key={lodging.id}
            href={lodging.href}
            title={lodging.title}
            coverPhotoUrl={lodging.cover_photo_url}
            shortDescription={lodging.short_description}
            propertyType={lodging.property_type}
            maxGuests={lodging.max_guests}
            bedroomCount={lodging.bedroom_count}
            publicAreaLabel={lodging.public_area_label}
            amenities={lodging.amenities}
          />
        ))}
      </div>
    </section>
  )
}
