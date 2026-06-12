import Link from 'next/link'
import { Users, BedDouble, MapPin } from 'lucide-react'

export function LodgingCard(props: {
  href: string
  title: string
  coverPhotoUrl: string | null
  shortDescription: string
  propertyType: string
  maxGuests: number
  bedroomCount: number | null
  publicAreaLabel: string | null
  amenities: string[]
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <Link href={props.href} className="block">
        {props.coverPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={props.coverPhotoUrl}
            alt=""
            className="aspect-[4/3] w-full object-cover"
          />
        ) : (
          <div className="aspect-[4/3] w-full bg-stone-100" aria-hidden="true" />
        )}
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
              {props.propertyType}
            </p>
            <p className="text-xs text-gray-500">MyStay</p>
          </div>
          <h2 className="text-xl font-light text-charcoal">{props.title}</h2>
          <p className="line-clamp-2 text-sm leading-6 text-gray-500">{props.shortDescription}</p>
          <div className="flex flex-wrap gap-3 text-xs text-gray-600">
            <span className="inline-flex items-center gap-2">
              <Users className="h-4 w-4 text-gold" />
              {props.maxGuests} voyageurs
            </span>
            {props.bedroomCount != null && (
              <span className="inline-flex items-center gap-2">
                <BedDouble className="h-4 w-4 text-gold" />
                {props.bedroomCount} chambres
              </span>
            )}
          </div>
          {props.publicAreaLabel && (
            <p className="inline-flex items-center gap-2 text-sm text-gray-500">
              <MapPin className="h-4 w-4 text-gold" />
              {props.publicAreaLabel}
            </p>
          )}
          {props.amenities.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {props.amenities.slice(0, 4).map(amenity => (
                <span
                  key={amenity}
                  className="rounded-full bg-stone-100 px-3 py-1 text-xs text-charcoal"
                >
                  {amenity}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </article>
  )
}
