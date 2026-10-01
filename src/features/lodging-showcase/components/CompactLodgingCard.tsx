import Image from 'next/image'
import Link from 'next/link'
import { Scan, Users } from 'lucide-react'

type CompactLodgingCardData = {
  title: string
  href: string
  cityName: string
  surfaceM2: number | null
  maxGuests: number
  photo: { url: string; alt: string } | null
}

export function CompactLodgingCard({ lodging }: { lodging: CompactLodgingCardData }) {
  return (
    <article className="h-full overflow-hidden rounded-[26px] bg-white shadow-[0_10px_24px_-10px_rgba(15,23,42,0.12)]">
      <Link href={lodging.href} aria-label={`Découvrir ${lodging.title}`} className="group flex h-full flex-col rounded-[26px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pink-600">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          {lodging.photo && (
            <Image src={lodging.photo.url} alt={lodging.photo.alt} fill unoptimized sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-opacity group-hover:opacity-90" />
          )}
        </div>
        <div className="flex flex-1 flex-col px-5 pb-4 pt-5">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-pink-600">{lodging.cityName}</p>
          <h3 className="mb-4 mt-2 break-words text-xl font-bold leading-[1.3] tracking-[-0.035em] text-slate-800">{lodging.title}</h3>
          <dl className="mt-auto grid grid-cols-2 border-t border-slate-200 text-slate-800">
            <div className="flex min-w-0 items-center gap-2 py-3 pr-2">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-50">
                <Scan aria-hidden="true" className="h-4 w-4" strokeWidth={1.6} />
              </span>
              <div>
                <dt className="text-[10px] text-slate-500">Surface</dt>
                <dd className="text-sm font-bold">{lodging.surfaceM2 == null ? '—' : `${lodging.surfaceM2} m²`}</dd>
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-2 border-l border-slate-200 py-3 pl-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-50">
                <Users aria-hidden="true" className="h-4 w-4" strokeWidth={1.6} />
              </span>
              <div>
                <dt className="text-[10px] text-slate-500">Voyageurs</dt>
                <dd className="text-sm font-bold">{lodging.maxGuests}</dd>
              </div>
            </div>
          </dl>
        </div>
      </Link>
    </article>
  )
}
