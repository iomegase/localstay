import type { GuidePoi } from '@/features/guide-app/types'
import { getFavoriteBentoVariant } from '@/features/guide-app/lib/favorite-bento'
import { GuideFavoriteBentoCard } from './GuideFavoriteBentoCard'

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

      <div data-testid="favorites-bento-grid" className="mt-3 grid grid-cols-2 gap-3">
        {visiblePois.map((poi, index) => (
          <GuideFavoriteBentoCard
            key={poi.id}
            poi={poi}
            variant={getFavoriteBentoVariant(index)}
            onSelectPoi={onSelectPoi}
            onShowOnMap={onShowOnMap}
          />
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
