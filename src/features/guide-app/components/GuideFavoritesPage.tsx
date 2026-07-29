import Image from 'next/image'
import {
  Clock3,
  Heart,
  Map as MapIcon,
  MapPin,
  Sparkles,
  Users,
} from 'lucide-react'
import type { GuidePoi } from '@/features/guide-app/types'

const categoryTextClasses: Record<string, string> = {
  diner: 'text-rose-600',
  alimentation: 'text-amber-700',
  culture: 'text-violet-600',
  activite: 'text-blue-600',
  famille: 'text-emerald-700',
  soin: 'text-pink-700',
  rando: 'text-lime-700',
}

export function GuideFavoritesPage({
  pois,
  selectedCategorySlug,
  onFilter,
  onSelectPoi,
  onShowOnMap,
}: {
  pois: GuidePoi[]
  selectedCategorySlug: string | null
  onFilter: (categorySlug: string | null) => void
  onSelectPoi: (poi: GuidePoi) => void
  onShowOnMap: (poi: GuidePoi) => void
}) {
  const categories = Array.from(
    new globalThis.Map(
      pois.map(poi => [poi.category.slug, poi.category]),
    ).values(),
  )
  const visiblePois = selectedCategorySlug
    ? pois.filter(poi => poi.category.slug === selectedCategorySlug)
    : pois

  return (
    <div className="px-3 pb-24 pt-5">
      <div className="px-2">
        <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-pink-600">
          Sélection MyStay
        </p>
        <h1 className="mt-2 text-[30px] font-semibold leading-none tracking-[-0.045em] text-slate-900">
          Nos coups de cœur
        </h1>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          Des adresses et activités réellement situées à Saint-Gervais et dans
          ses environs.
        </p>
      </div>

      <div
        className="sticky top-0 z-20 -mx-3 mt-5 flex gap-2 overflow-x-auto border-b border-slate-100/80 bg-white/95 px-4 py-3 backdrop-blur-xl [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Filtrer les catégories"
      >
        <FilterButton
          label="Tous"
          active={selectedCategorySlug === null}
          onClick={() => onFilter(null)}
        />
        {categories.map(category => (
          <FilterButton
            key={category.slug}
            label={category.name}
            active={selectedCategorySlug === category.slug}
            onClick={() => onFilter(category.slug)}
          />
        ))}
      </div>

      <div className="mt-3 space-y-3">
        {visiblePois.map(poi => (
          <article
            key={poi.id}
            className="overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.07)]"
          >
            <button
              type="button"
              aria-label={`Ouvrir ${poi.name}`}
              onClick={() => onSelectPoi(poi)}
              className="grid w-full grid-cols-[108px_minmax(0,1fr)] text-left"
            >
              <span className="relative min-h-[128px]">
                <Image
                  src={poi.photos[0]}
                  alt=""
                  fill
                  sizes="108px"
                  className="object-cover"
                />
              </span>
              <span className="flex min-w-0 flex-col p-4">
                <span
                  className={`text-[8px] font-extrabold uppercase tracking-[0.16em] ${
                    categoryTextClasses[poi.category.slug] ?? 'text-pink-600'
                  }`}
                >
                  {poi.category.name}
                </span>
                <strong className="mt-1 line-clamp-2 text-sm leading-[1.15] text-slate-900">
                  {poi.name}
                </strong>
                <span className="mt-2 line-clamp-2 text-[10px] leading-4 text-slate-500">
                  {poi.shortDescription}
                </span>
                <span className="mt-auto flex items-center gap-3 pt-2 text-[9px] text-slate-500">
                  {poi.distanceLabel && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-pink-600" />
                      {poi.distanceLabel}
                    </span>
                  )}
                  {poi.durationLabel && (
                    <span className="flex items-center gap-1">
                      <Clock3 className="h-3 w-3" />
                      {poi.durationLabel}
                    </span>
                  )}
                </span>
              </span>
            </button>
            <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2">
              <div className="flex gap-1.5">
                {poi.recommended && <Badge icon={Heart} label="Notre préféré" />}
                {poi.familyFriendly && <Badge icon={Users} label="En famille" />}
                {poi.nearby && <Badge icon={Sparkles} label="À proximité" />}
              </div>
              <button
                type="button"
                onClick={() => onShowOnMap(poi)}
                className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.1em] text-white"
              >
                <MapIcon className="h-3 w-3" />
                Carte
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-[9px] font-bold ${
        active
          ? 'bg-slate-900 text-white'
          : 'border border-slate-200 bg-white text-slate-600'
      }`}
    >
      {label}
    </button>
  )
}

function Badge({
  icon: Icon,
  label,
}: {
  icon: typeof Heart
  label: string
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-2 py-1 text-[7px] font-bold text-pink-700">
      <Icon className="h-2.5 w-2.5" />
      {label}
    </span>
  )
}
