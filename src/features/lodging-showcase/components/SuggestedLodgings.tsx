import Image from 'next/image'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import type { SuggestedLodging } from '../queries/public-lodgings'

export function SuggestedLodgings({ lodgings }: { lodgings: SuggestedLodging[] }) {
  if (!lodgings.length) return null

  return (
    <section aria-labelledby="suggested-lodgings-heading" className="min-w-0">
      <h2 id="suggested-lodgings-heading" className="text-[28px] font-semibold leading-tight tracking-[-0.04em] text-slate-800 md:text-[36px]">
        Vous pourriez aussi apprécier
      </h2>
      <ul className="mt-7 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4">
        {lodgings.map(lodging => (
          <li key={lodging.id} className="w-[80%] shrink-0 snap-start sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-3.75rem)/4)]">
            <Link href={lodging.href} className="group block rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pink-600">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
                {lodging.coverPhotoUrl && (
                  <Image src={lodging.coverPhotoUrl} alt={lodging.title} fill unoptimized sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 80vw" className="object-cover transition-transform duration-300 motion-safe:group-hover:scale-105" />
                )}
              </div>
              <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-800 group-hover:text-pink-600">{lodging.title}</h3>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                {lodging.location}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
