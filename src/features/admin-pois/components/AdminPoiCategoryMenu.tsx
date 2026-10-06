import Link from 'next/link'
import { adminPoiTaxonomyFilterHref, firstParam, type SearchParamsRecord } from '../lib/list-filters'
import type { AdminPoiTaxonomyCounts } from '../queries/admin-pois'

const UNCATEGORIZED = 'none'

function Chip({ href, label, count, active }: { href: string; label: string; count: number; active: boolean }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? 'page' : undefined}
      className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[12px] font-bold transition-colors ${
        active
          ? 'border-[#0B1437] bg-[#0B1437] text-white'
          : 'border-gray-100 bg-white text-neutral-700 hover:border-gray-200 hover:bg-gray-50'
      }`}
    >
      {label}
      <span className={`text-[10px] font-bold ${active ? 'text-white/70' : 'text-gray-400'}`}>{count}</span>
    </Link>
  )
}

/** Spec 069 : filtres catégorie puis sous-catégorie en pastilles, appliqués au clic. */
export function AdminPoiCategoryMenu({ params, counts }: { params: SearchParamsRecord; counts: AdminPoiTaxonomyCounts }) {
  const categoryId = firstParam(params.category_id) ?? null
  const subcategoryId = firstParam(params.subcategory_id) ?? null
  const selected = counts.categories.find(category => category.id === categoryId) ?? null

  return (
    <div className="space-y-3 rounded-[25px] border border-gray-50 bg-white p-4 shadow-sm">
      <nav aria-label="Filtrer par catégorie" className="flex gap-2 overflow-x-auto pb-1">
        <Chip href={adminPoiTaxonomyFilterHref(params, { category_id: null })} label="Toutes" count={counts.total} active={!categoryId} />
        {counts.categories.map(category => (
          <Chip
            key={category.id}
            href={adminPoiTaxonomyFilterHref(params, { category_id: category.id })}
            label={category.name}
            count={category.count}
            active={category.id === categoryId}
          />
        ))}
      </nav>

      {selected && (
        <nav aria-label="Filtrer par sous-catégorie" className="flex gap-2 overflow-x-auto border-t border-gray-50 pb-1 pt-3">
          <Chip
            href={adminPoiTaxonomyFilterHref(params, { category_id: selected.id })}
            label="Toutes"
            count={selected.count}
            active={!subcategoryId}
          />
          {selected.subcategories.map(subcategory => (
            <Chip
              key={subcategory.id}
              href={adminPoiTaxonomyFilterHref(params, { category_id: selected.id, subcategory_id: subcategory.id })}
              label={subcategory.name}
              count={subcategory.count}
              active={subcategory.id === subcategoryId}
            />
          ))}
          {selected.uncategorized_count > 0 && (
            <Chip
              href={adminPoiTaxonomyFilterHref(params, { category_id: selected.id, subcategory_id: UNCATEGORIZED })}
              label="Sans sous-catégorie"
              count={selected.uncategorized_count}
              active={subcategoryId === UNCATEGORIZED}
            />
          )}
        </nav>
      )}
    </div>
  )
}
