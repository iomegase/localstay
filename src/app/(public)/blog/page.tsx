import Link from 'next/link'
import Image from 'next/image'
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

  const title = result?.city ? `Blog ${result.city.name}` : 'Inspirations, conciergerie'
  const items = result?.items ?? []
  const categories = [...new Set(items.map(article => blogCategoryLabel(article.category)))]

  return (
    <div className="-mt-6 min-h-screen bg-[#f7f8fb] px-5 pb-12 pt-10 text-slate-800">
      <header>
        <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          Blog &amp; Guides
        </p>
        <h1 className="mt-4 text-[32px] font-thin uppercase leading-[1.12] tracking-[-0.035em] text-slate-900">
          {title}
        </h1>
        <p className="mt-4 text-[14px] italic leading-7 text-slate-600">
          Sélectionnez une catégorie ou parcourez nos articles pour optimiser vos séjours et votre expérience.
        </p>
      </header>

      <nav
        aria-label="Breadcrumb"
        className="mt-5 flex items-center gap-3 text-[11px] font-light uppercase tracking-[0.2em] text-slate-500"
      >
        <Link href="/" className="transition-colors hover:text-slate-900">Accueil</Link>
        <span aria-hidden="true" className="text-slate-400">/</span>
        <Link href="/blog" className="transition-colors hover:text-slate-900">Blog</Link>
      </nav>

      <div className="mt-7 flex flex-wrap gap-2.5" aria-label="Catégories du blog">
        <span className="inline-flex items-center rounded-full bg-slate-900 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)]">
          Toutes
        </span>
        {categories.map(category => (
          <span
            key={category}
            className="inline-flex items-center rounded-full border border-white/80 bg-white px-4 py-2.5 text-[10px] font-light uppercase tracking-wide text-slate-500 shadow-[0_10px_22px_rgba(15,23,42,0.10)]"
          >
            {category}
          </span>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 px-8 py-20 text-center">
          <Newspaper className="h-8 w-8 text-slate-300" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-gray-500">Aucun article n&apos;est encore publié.</p>
        </div>
      ) : (
        <section data-testid="blog-grid" className="mt-10 grid grid-cols-2 gap-5">
          {items.map(article => (
            <Link
              key={article.id}
              href={buildBlogArticlePath(article.slug)}
              aria-label={`Lire l’article : ${article.title}`}
              className="block"
            >
              <article
                data-testid={`blog-card-${article.slug}`}
                className="group relative aspect-square overflow-hidden rounded-[28px] bg-slate-200 shadow-[0_8px_18px_rgba(15,23,42,0.15)] transition-transform active:scale-[0.99]"
              >
                {article.cover ? (
                  <Image
                    src={article.cover.url}
                    alt={article.cover.alt}
                    fill
                    unoptimized
                    sizes="(max-width: 430px) 50vw, 215px"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 text-white/70">
                    <Newspaper className="h-8 w-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 transition-colors duration-300 group-hover:bg-black/40" />
                {article.city && (
                  <span className="absolute left-3 top-3 flex max-w-[calc(100%-1.5rem)] items-center gap-1 rounded-full bg-slate-950/30 px-2.5 py-1 text-[8px] font-light uppercase tracking-wider text-white backdrop-blur-md">
                    <MapPin className="h-2.5 w-2.5 shrink-0" />
                    <span className="truncate">{article.city.name}</span>
                  </span>
                )}
                <div className="absolute inset-0 flex items-center px-4">
                  <h2 className="line-clamp-3 text-pretty text-[17px] font-thin uppercase leading-tight text-white drop-shadow-md">
                    {article.title}
                  </h2>
                </div>
                <span className="absolute bottom-3 right-3 max-w-[calc(100%-1.5rem)] truncate rounded-full bg-slate-950/40 px-3 py-1.5 text-[8px] font-light uppercase tracking-[0.14em] text-white shadow-lg backdrop-blur-lg">
                  {blogCategoryLabel(article.category)}
                </span>
              </article>
            </Link>
          ))}
        </section>
      )}
    </div>
  )
}
