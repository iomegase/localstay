import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { prisma } from '@/shared/lib/prisma'
import { MarkdownText } from '@/shared/components/MarkdownText'
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'

export default async function ServicesPrivesPage() {
  const lodgingContext = await getActiveLodgingContext()
  if (!lodgingContext) redirect('/')

  const featuredPois = await prisma.lodgingFeaturedPoi.findMany({
    where: { lodging_id: lodgingContext.lodgingId, deleted_at: null },
    orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
    select: {
      poi_id: true,
      owner_note: true,
      poi: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          photos: true,
          category: { select: { name: true, slug: true } },
        },
      },
    },
  })

  const grouped = groupByCategory(featuredPois)

  return (
    <div className="px-5 pt-4">
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Services privés</p>
        <h1 className="mt-1 font-serif italic text-3xl text-charcoal">Les sélections de votre hôte</h1>
        <p className="mt-1 text-sm text-gray-500">{lodgingContext.lodgingName} · {lodgingContext.cityName}</p>
      </div>

      {grouped.length === 0 ? (
        <EmptyState citySlug={lodgingContext.citySlug} />
      ) : (
        <div className="space-y-6 pb-8">
          {grouped.map(group => (
            <CategoryGroup
              key={group.categorySlug}
              categoryName={group.categoryName}
              citySlug={lodgingContext.citySlug}
              items={group.items}
            />
          ))}
        </div>
      )}
    </div>
  )
}

type FeaturedRow = {
  poi_id: string
  owner_note: string | null
  poi: {
    id: string
    name: string
    slug: string
    description: string | null
    photos: string[]
    category: { name: string; slug: string }
  }
}

type Group = {
  categorySlug: string
  categoryName: string
  items: FeaturedRow[]
}

function groupByCategory(rows: FeaturedRow[]): Group[] {
  const map = new Map<string, Group>()
  for (const row of rows) {
    const slug = row.poi.category.slug
    const existing = map.get(slug)
    if (existing) {
      existing.items.push(row)
    } else {
      map.set(slug, {
        categorySlug: slug,
        categoryName: row.poi.category.name,
        items: [row],
      })
    }
  }
  return [...map.values()]
}

function EmptyState({ citySlug }: { citySlug: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
      <Sparkles className="mx-auto h-8 w-8 text-gray-300" />
      <p className="mt-3 text-sm text-gray-500">
        Votre hôte n&apos;a pas encore sélectionné de lieux à vous recommander.
      </p>
      <Link
        href={`/guide/${citySlug}`}
        className="mt-5 inline-flex items-center justify-center rounded-full bg-charcoal px-5 py-2 text-[11px] font-bold uppercase tracking-widest text-white"
      >
        Explorer le guide complet
      </Link>
    </div>
  )
}

function CategoryGroup({
  categoryName,
  citySlug,
  items,
}: {
  categoryName: string
  citySlug: string
  items: FeaturedRow[]
}) {
  return (
    <section>
      <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">
        {categoryName}
      </h2>
      <div className="space-y-3">
        {items.map(item => (
          <FeaturedCard key={item.poi.id} item={item} citySlug={citySlug} />
        ))}
      </div>
    </section>
  )
}

function FeaturedCard({ item, citySlug }: { item: FeaturedRow; citySlug: string }) {
  const heroPhoto = item.poi.photos?.[0] ?? null
  const href = `/guide/${citySlug}/${item.poi.category.slug}/${item.poi.slug}`

  return (
    <Link
      href={href}
      className="group flex gap-4 overflow-hidden rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-md"
    >
      {heroPhoto ? (
        <img
          src={heroPhoto}
          alt={item.poi.name}
          className="h-20 w-20 shrink-0 rounded-xl object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-300">
          <Sparkles className="h-6 w-6" />
        </div>
      )}
      <div className="flex flex-1 flex-col justify-center">
        <h3 className="font-serif italic text-base text-charcoal">{item.poi.name}</h3>
        {item.owner_note && (
          <p className="mt-1 text-xs italic leading-relaxed text-gold">
            « <MarkdownInline source={item.owner_note} /> »
          </p>
        )}
        {!item.owner_note && item.poi.description && (
          <p className="mt-1 text-xs text-gray-500 line-clamp-2">{item.poi.description}</p>
        )}
      </div>
      <ArrowRight className="my-auto h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-charcoal" />
    </Link>
  )
}

function MarkdownInline({ source }: { source: string }) {
  // L'owner_note est volontairement court (limite 150) — pas besoin d'un rendu markdown complet,
  // mais on rend la chaîne brute en respectant les sauts de ligne.
  const cleaned = source.trim()
  if (cleaned.length <= 80) return <span>{cleaned}</span>
  return <MarkdownText source={cleaned} className="inline" />
}
