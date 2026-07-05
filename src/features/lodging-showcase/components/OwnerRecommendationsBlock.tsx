import Link from 'next/link'
import type { PublicOwnerRecommendationDto } from '@/features/lodging-showcase/types'

type Props = {
  citySlug: string
  items: PublicOwnerRecommendationDto[]
}

function RecommendationCard({ item }: { item: PublicOwnerRecommendationDto }) {
  return (
    <Link
      href={`/guide/${item.city_slug}/${item.category_slug}/${item.slug}`}
      className="block rounded-2xl border border-gray-100 p-3 transition hover:bg-stone-50"
    >
      <div className="flex items-center gap-3">
        {item.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.photo_url} alt="" className="h-16 w-16 rounded-2xl object-cover" />
        ) : (
          <div className="h-16 w-16 rounded-2xl bg-stone-100" aria-hidden="true" />
        )}
        <span className="text-sm font-medium text-charcoal">{item.name}</span>
      </div>
      {item.owner_note && (
        <p className="mt-3 whitespace-pre-line text-xs leading-relaxed text-gray-600">
          {item.owner_note}
        </p>
      )}
    </Link>
  )
}

export function OwnerRecommendationsBlock({ citySlug, items }: Props) {
  const localItems = items.filter(item => item.city_slug === citySlug)
  const otherItems = items.filter(item => item.city_slug !== citySlug)
  const otherByCity = otherItems.reduce<Map<string, PublicOwnerRecommendationDto[]>>(
    (groups, item) => {
      const cityItems = groups.get(item.city_slug) ?? []
      groups.set(item.city_slug, [...cityItems, item])
      return groups
    },
    new Map(),
  )

  if (items.length === 0) return null

  return (
    <div className="space-y-6">
      {localItems.length > 0 && (
        <section
          aria-label="Les recommandations de votre hôte"
          className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-pink-600">
            Guide local
          </p>
          <h2 className="mt-1 text-xl font-light text-charcoal">
            Les recommandations de votre hôte
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {localItems.map(item => (
              <RecommendationCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {otherItems.length > 0 && (
        <section
          aria-label="À découvrir ailleurs"
          className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-pink-600">
            Carnet d&apos;adresses
          </p>
          <h2 className="mt-1 text-xl font-light text-charcoal">
            À découvrir ailleurs
          </h2>
          <div className="mt-5 space-y-5">
            {[...otherByCity.values()].map(cityItems => (
              <div key={cityItems[0].city_slug}>
                <h3 className="text-sm font-semibold text-charcoal">
                  {cityItems[0].city_name}
                </h3>
                <div className="mt-2 grid gap-3 md:grid-cols-2">
                  {cityItems.map(item => (
                    <RecommendationCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
