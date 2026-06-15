import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Newspaper, MapPin } from 'lucide-react'
import { getPublishedBlogArticles } from '@/features/blog/queries/public-blog'
import { blogListMetadata } from '@/features/blog/lib/metadata'
import { blogCategoryLabel } from '@/features/blog/lib/category-label'
import { buildBlogArticlePath } from '@/features/blog/lib/slug'

type PageProps = {
  searchParams: Promise<{ city?: string }>
}

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

  const title = result?.city ? `Blog ${result.city.name}` : 'Blog'
  const items = result?.items ?? []

  return (
    <>
      <div className="p-4">
        {/* <p className="text-[10px] font-bold uppercase tracking-widest text-gold">Le guide</p> */}
        <h1 className="text-2xl font-light uppercase text-charcoal">{title}</h1>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 px-8 py-16 text-center">
          <p className="text-sm leading-relaxed text-gray-500">Aucun article n&apos;est encore publié.</p>
        </div>
      ) : (
        <section className="mt-4 flex flex-col gap-3 px-4 pb-10">
          {items.map(article => (
            <Link
              key={article.id}
              href={buildBlogArticlePath(article.slug)}
              data-testid={`blog-card-${article.slug}`}
              className="group flex gap-4 overflow-hidden rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition active:scale-[0.99]"
            >
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                {article.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={article.cover.url}
                    alt=""
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-300">
                    <Newspaper className="h-7 w-7" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-1">
                  <span className="rounded-full bg-pine/10  py-0.5 text-[9px] font-bold uppercase tracking-widest text-pine">
                    {blogCategoryLabel(article.category)}
                  </span>
                </div>
                <h3 className="mt-1 line-clamp-2 text-sm font-medium text-charcoal">{article.title}</h3>
                {/* <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-400">{article.excerpt}</p> */}
                {article.city && (
                  <p className="mt-4 flex items-center gap-1 uppercase truncate text-[10px] text-gold">
                    <MapPin className="h-3 w-3 shrink-0" /> {article.city.name}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </section>
      )}
    </>
  )
}
