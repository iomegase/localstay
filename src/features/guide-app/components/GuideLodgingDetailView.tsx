import { ArrowLeft, BedDouble, Bath, Maximize, Users } from 'lucide-react'
import { capitalizeFirst } from '@/shared/lib/utils'
import type { GuideLodgingDetail } from '@/features/guide-app/types'

/**
 * Vue détail d'un logement, DANS l'app (guest confiné). Chargée à la demande via
 * l'API interne ; `detail` à null = chargement. Bouton retour vers la liste —
 * aucune sortie vers le site public.
 */
export function GuideLodgingDetailView({
  detail,
  onBack,
}: {
  detail: GuideLodgingDetail | null
  onBack: () => void
}) {
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
          {detail.photos.length > 0 && (
            <div className="space-y-3">
              {detail.photos.map((photo, index) => (
                // eslint-disable-next-line @next/next/no-img-element -- image distante (parité guide)
                <img
                  key={index}
                  src={photo.url}
                  alt={photo.alt}
                  loading={index === 0 ? undefined : 'lazy'}
                  className="aspect-[4/3] w-full rounded-[22px] object-cover"
                />
              ))}
            </div>
          )}

          <header>
            <span className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-pink-600">
              {detail.propertyType}
            </span>
            <h1 className="mt-1 text-2xl font-bold leading-tight tracking-[-0.035em] text-slate-900">
              {capitalizeFirst(detail.title)}
            </h1>
            <p className="mt-1 text-sm text-slate-400">{detail.cityName}</p>
          </header>

          <div className="grid grid-cols-4 gap-2 rounded-[20px] bg-slate-50 p-4 text-center">
            <Fact icon={Users} value={detail.maxGuests} label="Voyageurs" />
            <Fact icon={BedDouble} value={detail.bedroomCount ?? '—'} label="Chambres" />
            <Fact icon={Bath} value={detail.bathroomCount ?? '—'} label="SdB" />
            <Fact icon={Maximize} value={detail.surfaceM2 ? `${detail.surfaceM2}` : '—'} label="m²" />
          </div>

          {detail.description && (
            <p className="whitespace-pre-line text-sm leading-6 text-slate-600">
              {detail.description}
            </p>
          )}

          {detail.amenitiesIncluded.length > 0 && (
            <AmenityList title="Équipements inclus" items={detail.amenitiesIncluded} />
          )}
          {detail.amenitiesOnRequest.length > 0 && (
            <AmenityList title="Sur demande" items={detail.amenitiesOnRequest} />
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

function AmenityList({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{title}</h2>
      <ul className="mt-3 grid grid-cols-2 gap-2">
        {items.map(item => (
          <li key={item} className="flex items-center gap-2 text-xs text-slate-600">
            <span className="h-1 w-1 shrink-0 rounded-full bg-pink-500" />
            {item}
          </li>
        ))}
      </ul>
    </section>
  )
}
