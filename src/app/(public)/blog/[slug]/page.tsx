import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { PoiDetailHeroCarousel } from '@/features/categories/components/PoiDetailHeroCarousel'
import { HeroShareButton } from '@/features/categories/components/HeroShareButton'
import { BlogMarkdown } from '@/features/blog/components/BlogMarkdown'
import { buildBlogArticleBreadcrumb } from '@/features/blog/lib/breadcrumbs'
import { blogCategoryLabel } from '@/features/blog/lib/category-label'
import { blogArticleMetadata } from '@/features/blog/lib/metadata'
import { blogPostingSchema } from '@/features/blog/lib/structured-data'
import { getPublishedBlogArticleBySlug } from '@/features/blog/queries/public-blog'

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const article = await getPublishedBlogArticleBySlug(slug)
  if (!article) return { title: 'Article introuvable', robots: { index: false, follow: false } }

  return blogArticleMetadata({
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    seo_title: article.seo_title,
    seo_description: article.seo_description,
    coverUrl: article.cover?.url ?? null,
  })
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params
  const article = await getPublishedBlogArticleBySlug(slug)

  if (!article) {
    notFound()
    return null
  }

  const breadcrumbs = buildBlogArticleBreadcrumb({
    articleTitle: article.title,
    city: article.city,
  })
  const schema = blogPostingSchema({
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    publishedAt: article.published_at,
    coverUrl: article.cover?.url ?? null,
    coverAlt: article.cover?.alt ?? null,
    cityName: article.city?.name ?? null,
  })

  const backHref = [...breadcrumbs].reverse().find(item => item.href)?.href ?? '/blog'

  const heroPhotos = [article.cover?.url, ...article.gallery.map(photo => photo.url)].filter(
    (url): url is string => Boolean(url),
  )

  return (
    <article className="-mt-6">
      {/* Hero — galerie de toutes les photos */}
      <PoiDetailHeroCarousel photos={heroPhotos} name={article.title} revealControlsOnHover>
        <div className="absolute top-4 left-6 right-6 flex items-center justify-between z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
          <Link
            href={backHref}
            aria-label="Retour"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/30 text-charcoal/60 backdrop-blur transition-transform hover:bg-white/40 active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <HeroShareButton poiName={article.title} poiUrl={`/blog/${article.slug}`} />
          </div>
        </div>
      </PoiDetailHeroCarousel>

      {/* Content sheet */}
      <main className="relative z-20 -mt-8 space-y-6 rounded-t-[32px] bg-slate-50 pt-8 pb-16 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
        <nav aria-label="Breadcrumb" className="px-6 flex flex-wrap items-center gap-2 text-[11px] text-charcoal/40">
          {breadcrumbs.map(item =>
            item.href ? (
              <Link key={`${item.label}-${item.href}`} href={item.href} className="hover:text-charcoal">
                {item.label}
              </Link>
            ) : (
              <span key={item.label} className="text-charcoal/70">{item.label}</span>
            ),
          )}
        </nav>

        {/* Header */}
        <header className="px-6">
          <span className="text-[9px] font-bold uppercase tracking-widest text-pink-600">
            {blogCategoryLabel(article.category)}
          </span>
          <h1 className="mt-1 text-xl uppercase leading-tight text-charcoal">{article.title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-charcoal/70">{article.excerpt}</p>
        </header>

        <BlogMarkdown source={article.content_markdown} />
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </article>
  )
}
