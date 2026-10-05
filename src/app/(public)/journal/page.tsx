import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { z } from 'zod'
import { Newspaper, MapPin } from 'lucide-react'
import { getPublishedBlogArticles } from '@/features/blog/queries/public-blog'
import { blogListMetadata } from '@/features/blog/lib/metadata'
import { blogCategoryLabel } from '@/features/blog/lib/category-label'
import { buildBlogArticlePath } from '@/features/blog/lib/slug'
import { BLOG_ARTICLE_CATEGORIES, type BlogArticleCategory } from '@/features/blog/types'
import {
  MarketingEyebrow,
  MarketingShell,
  marketingContainerClass,
} from '@/features/marketing/components/MarketingShell'

type PageProps = {
  searchParams: Promise<{ city?: string; category?: string }>
}

const categoryParamSchema = z.enum(BLOG_ARTICLE_CATEGORIES)

function buildJournalListPath(city: string | undefined, category: BlogArticleCategory | null): string {
  const query = new URLSearchParams()
  if (city) query.set('city', city)
  if (category) query.set('category', category)
  const search = query.toString()
  return search ? `/journal?${search}` : '/journal'
}

const activePillClass =
  'inline-flex items-center rounded-full bg-slate-800 px-5 py-2.5 text-[10px] font-bold uppercase tracking-wide text-white'
const inactivePillClass =
  'inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-800'

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams
  const result = await getPublishedBlogArticles(params.city)
  return blogListMetadata({ city: result?.city ?? null })
}

export default async function BlogListPage({ searchParams }: PageProps) {
  const params = await searchParams
  const result = await getPublishedBlogArticles(params.city)

  if (params.city && !result) {
    notFound()
    return null
  }

  const title = result?.city ? `Journal ${result.city.name}` : 'Inspirations... et conseils pour vos séjours'
  const allItems = result?.items ?? []
  const parsedCategory = categoryParamSchema.safeParse(params.category)
  const activeCategory = parsedCategory.success ? parsedCategory.data : null
  const categories = [...new Set(allItems.map(article => article.category))]
  const items = activeCategory ? allItems.filter(article => article.category === activeCategory) : allItems

  return (
    <MarketingShell>
      <section className=" py-16 sm:py-24">
        <div className={marketingContainerClass}>
          <MarketingEyebrow>Journal &amp; Guides</MarketingEyebrow>
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.04] tracking-[-0.055em] text-slate-900 sm:text-6xl">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
            Sélectionnez une catégorie ou parcourez nos articles pour optimiser vos séjours et votre expérience.
          </p>
          <nav
            aria-label="Breadcrumb"
            className="mt-7 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500"
          >
            <Link href="/" className="hover:text-pink-600">Accueil</Link>
            <span aria-hidden="true">/</span>
            <Link href="/journal" className="hover:text-pink-600">Journal</Link>
          </nav>
        </div>
      </section>

      <section className={`${marketingContainerClass} py-16 sm:py-24`}>
        <nav className="flex flex-wrap gap-2.5" aria-label="Catégories du journal">
          <Link
            href={buildJournalListPath(params.city, null)}
            aria-current={activeCategory === null ? 'page' : undefined}
            className={activeCategory === null ? activePillClass : inactivePillClass}
          >
            Toutes
          </Link>
          {categories.map(category => (
            <Link
              key={category}
              href={buildJournalListPath(params.city, category)}
              aria-current={activeCategory === category ? 'page' : undefined}
              className={activeCategory === category ? activePillClass : inactivePillClass}
            >
              {blogCategoryLabel(category)}
            </Link>
          ))}
        </nav>

        {items.length === 0 ? (
          <div className="mt-10 flex flex-col items-center justify-center gap-4 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-8 py-20 text-center">
            <Newspaper className="h-8 w-8 text-slate-300" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-gray-500">Aucun article n&apos;est encore publié.</p>
          </div>
        ) : (
          <section data-testid="blog-grid" className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(article => (
              <Link
                key={article.id}
                href={buildBlogArticlePath(article.slug)}
                aria-label={`Lire l’article : ${article.title}`}
                className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pink-600"
              >
                <article
                  data-testid={`blog-card-${article.slug}`}
                  className="group h-full overflow-hidden rounded-[24px] bg-white shadow-[0_18px_48px_rgba(15,23,42,0.10)]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-200">
                    {article.cover ? (
                      <Image
                        src={article.cover.url}
                        alt={article.cover.alt}
                        fill
                        unoptimized
                        sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                        className="object-cover transition-opacity group-hover:opacity-90"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 text-white/70">
                        <Newspaper className="h-8 w-8" />
                      </div>
                    )}
                    {article.city && (
                      <span className="absolute left-4 top-4 flex max-w-[calc(100%-2rem)] items-center gap-1 rounded-full bg-slate-950/55 px-3 py-1.5 text-[8px] font-semibold uppercase tracking-wider text-white backdrop-blur">
                        <MapPin className="h-2.5 w-2.5 shrink-0" />
                        <span className="truncate">{article.city.name}</span>
                      </span>
                    )}
                  </div>
                  <div className="p-6">
                    <span className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-pink-600">
                      {blogCategoryLabel(article.category)}
                    </span>
                    <h2 className="mt-3 text-xl font-bold leading-tight tracking-[-0.035em] text-slate-800">
                      {article.title}
                    </h2>
                    <p className="mt-4 line-clamp-3 text-xs leading-6 text-slate-500">{article.excerpt}</p>
                  </div>
                </article>
              </Link>
            ))}
          </section>
        )}
      </section>
    </MarketingShell>
  )
}
