import { Check } from 'lucide-react'

export function AmenitiesGrid(props: { amenities: string[] }) {
  if (props.amenities.length === 0) return null

  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-light text-charcoal">Equipements</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {props.amenities.map(amenity => (
          <li key={amenity} className="inline-flex items-center gap-3 text-sm text-gray-600">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-gold">
              <Check className="h-4 w-4" />
            </span>
            {amenity}
          </li>
        ))}
      </ul>
    </section>
  )
}
