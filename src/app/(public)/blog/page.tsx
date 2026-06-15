import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPublishedBlogArticles } from '@/features/blog/queries/public-blog'
import { blogListMetadata } from '@/features/blog/lib/metadata'
import { blogCategoryLabel } from '@/features/blog/lib/category-label'

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
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-8 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Éditorial</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-sm text-slate-600">
          Aucun article n&apos;est encore publié.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {items.map(article => (
            <article key={article.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {article.cover && (
                <img src={article.cover.url} alt={article.cover.alt} className="h-52 w-full object-cover" />
              )}
              <div className="space-y-3 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {blogCategoryLabel(article.category)}
                </p>
                <Link href={`/blog/${article.slug}`} className="block text-xl font-semibold text-slate-950">
                  {article.title}
                </Link>
                <p className="text-sm leading-6 text-slate-600">{article.excerpt}</p>
                {article.city && <p className="text-xs font-medium text-slate-500">{article.city.name}</p>}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
