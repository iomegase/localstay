import Image from 'next/image'
import Link from 'next/link'
import type { SeminarLodging } from '../queries/seminar-lodgings'
import { marketingContainerClass } from '@/features/marketing/components/marketing-styles'

export function SeminarLodgings({ lodgings }: { lodgings: SeminarLodging[] }) {
  if (!lodgings.length) return null

  return (
    <section aria-labelledby="seminar-lodgings-heading" className={`${marketingContainerClass} py-12 sm:py-16`}>
      <h2 id="seminar-lodgings-heading" className="text-[28px] font-semibold leading-tight tracking-[-0.04em] text-slate-800 md:text-[36px]">
        Nos logements pour vos séminaires
      </h2>
      <ul className="mt-7 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {lodgings.map(lodging => (
          <li key={lodging.id} className="min-w-0">
            <Link href={lodging.href} className="group block rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pink-600">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
                {lodging.photo && <Image src={lodging.photo.url} alt={lodging.photo.alt} fill unoptimized sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform motion-safe:group-hover:scale-105" />}
              </div>
              <h3 className="mt-4 break-words text-lg font-semibold text-slate-800 group-hover:text-pink-600">{lodging.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{lodging.cityName}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
