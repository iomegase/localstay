import { ArrowLeft, BedDouble, Bath, Maximize, Users } from 'lucide-react'
import { capitalizeFirst } from '@/shared/lib/utils'
import { SwipeCarousel } from '@/features/guide-app/components/SwipeCarousel'
import { featureIconFor } from '@/features/lodging-showcase/lib/feature-icon'
import type { GuideLodgingDetail } from '@/features/guide-app/types'

type DetailPhoto = GuideLodgingDetail['photos'][number]

/** Regroupe les photos par pièce (ordre d'apparition). Ignore celles sans pièce. */
function groupByRoom(photos: DetailPhoto[]): Array<{ label: string; photos: DetailPhoto[] }> {
  const groups = new Map<string, { label: string; photos: DetailPhoto[] }>()
  for (const photo of photos) {
    const key = photo.roomLabel ?? photo.roomType
    if (!key) continue
    if (!groups.has(key)) {
      groups.set(key, {
        label: photo.roomLabel ?? capitalizeFirst(photo.roomType ?? ''),
        photos: [],
      })
    }
    groups.get(key)!.photos.push(photo)
  }
  return [...groups.values()]
}

/**
 * Vue détail d'un logement, DANS l'app (guest confiné). Chargée à la demande via
 * l'API interne ; `detail` à null = chargement. Aucune sortie vers le site public.
 */
export function GuideLodgingDetailView({
  detail,
  onBack,
}: {
  detail: GuideLodgingDetail | null
  onBack: () => void
}) {
  const rooms = detail ? groupByRoom(detail.photos) : []

  return (
    <div className="px-4 pb-24 pt-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500"
      >
        <ArrowLeft className="h-4 w-4" />
        Nos logements
      </button>

      {!detail ? (
        <p className="mt-10 text-center text-sm text-slate-400">Chargement…</p>
      ) : (
        <article className="mt-4 space-y-5">
          {/* Header : une seule zone photo swipeable regroupant toute la galerie */}
          {detail.photos.length > 0 && (
            <SwipeCarousel photos={detail.photos} aspectClass="aspect-[4/3]" />
          )}

          <header>
            {/* <span className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-pink-600">
              {detail.propertyType}
            </span> */}
            <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-wide text-slate-900">
              {capitalizeFirst(detail.title)}
            </h1>
            <p className="mt-1 text-[10px] text-slate-600">{detail.cityName}</p>
          </header>

          <div className="grid grid-cols-4 gap-2 rounded-[20px] bg-slate-50 p-4 text-center">
            <Fact icon={Users} value={detail.maxGuests} label="Voyageurs" />
            <Fact icon={BedDouble} value={detail.bedroomCount ?? '—'} label="Chambres" />
            <Fact icon={Bath} value={detail.bathroomCount ?? '—'} label="SdB" />
            <Fact icon={Maximize} value={detail.surfaceM2 ? `${detail.surfaceM2}` : '—'} label="m²" />
          </div>

          {detail.description && (
            <p className="whitespace-pre-line p-4 text-justify text-[12px] leading-6 text-slate-600">
              {detail.description}
            </p>
          )}

          {(detail.amenitiesIncluded.length > 0 || detail.amenitiesOnRequest.length > 0) && (
            <div className="grid grid-cols-2 items-stretch gap-3">
              <AmenityCard title="Équipements inclus" items={detail.amenitiesIncluded} />
              <AmenityCard title="Sur demande" items={detail.amenitiesOnRequest} />
            </div>
          )}

          {/* Bas de page : vignettes par pièce, chacune swipeable sur ses photos */}
          {rooms.length > 0 && (
            <section>
              {/* <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Les pièces
              </h2> */}
              <div className="mt-8 grid grid-cols-2 gap-3">
                {rooms.map(room => (
                  <div key={room.label}>
                    <SwipeCarousel
                      photos={room.photos}
                      aspectClass="aspect-square"
                      roundedClass="rounded-[16px]"
                    />
                    <p className="mt-2 text-xs font-semibold text-slate-700">{room.label}</p>
                    <p className="text-[11px] text-slate-400">
                      {room.photos.length} photo{room.photos.length > 1 ? 's' : ''}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </article>
      )}
    </div>
  )
}

function Fact({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Users
  value: string | number
  label: string
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <Icon className="h-4 w-4 text-slate-400" />
      <span className="text-sm font-bold text-slate-900">{value}</span>
      <span className="text-[9px] font-medium uppercase tracking-wider text-slate-400">{label}</span>
    </div>
  )
}

function AmenityCard({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null

  return (
    <article className="relative overflow-hidden rounded-[22px] bg-[#f8f7f5] px-5 pb-5 pt-6 ">
      <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-pink-600">
        {title}
      </span>
      <ul className="mt-3">
        {items.map(item => {
          const Icon = featureIconFor(item)
          return (
            <li
              key={item}
              className="flex items-center gap-3 border-b border-slate-200/70 py-2.5 text-xs leading-snug text-slate-600 last:border-b-0"
            >
              <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-pink-600" strokeWidth={1.7} />
              <span>{item}</span>
            </li>
          )
        })}
      </ul>
    </article>
  )
}
