import Link from 'next/link'

export function OwnerRecommendationsBlock(props: {
  citySlug: string
  items: Array<{
    id: string
    name: string
    slug: string
    category_slug: string
    photo_url: string | null
  }>
}) {
  if (props.items.length === 0) return null

  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
            Guide local
          </p>
          <h2 className="mt-1 text-xl font-light text-charcoal">Les recommandations de votre hote</h2>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {props.items.map(item => (
          <Link
            key={item.id}
            href={`/guide/${props.citySlug}/${item.category_slug}/${item.slug}`}
            className="flex items-center gap-3 rounded-2xl border border-gray-100 p-3 transition hover:bg-stone-50"
          >
            {item.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.photo_url} alt="" className="h-16 w-16 rounded-2xl object-cover" />
            ) : (
              <div className="h-16 w-16 rounded-2xl bg-stone-100" aria-hidden="true" />
            )}
            <span className="text-sm text-charcoal">{item.name}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
