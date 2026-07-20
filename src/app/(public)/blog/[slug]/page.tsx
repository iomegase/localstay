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
import { estimateBlogReadingMinutes } from '@/features/blog/lib/reading-time'

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
  const publishedDate = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(article.published_at)
  const readingMinutes = estimateBlogReadingMinutes(article.content_markdown)

  return (
    <article className="-mt-6 min-h-screen bg-[#f7f8fb] px-5 pb-16 pt-8 text-slate-800">
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] font-light uppercase tracking-[0.18em] text-slate-500"
      >
        {breadcrumbs.map((item, index) => (
          <span key={`${item.label}-${item.href ?? 'current'}`} className="contents">
            {index > 0 && <span aria-hidden="true" className="text-slate-400">/</span>}
            {item.href ? (
              <Link href={item.href} className="transition-colors hover:text-slate-900">
                {item.label}
              </Link>
            ) : (
              <span className="text-slate-800">{item.label}</span>
            )}
          </span>
        ))}
      </nav>

      <header className="mt-7">
        <p className="text-[11px] font-light uppercase tracking-[0.2em] text-slate-500">
          {blogCategoryLabel(article.category)}
        </p>
        <h1 className="mt-4 text-[40px] font-thin uppercase leading-[1.04] tracking-[-0.045em] text-slate-900">
          {article.title}
        </h1>
        <p className="mt-5 flex items-center gap-3 text-[14px] text-slate-600">
          <time dateTime={article.published_at.toISOString()}>{publishedDate}</time>
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-slate-600" />
          <span>{readingMinutes} min</span>
        </p>
      </header>

      <div
        data-testid="blog-article-cover"
        className="mt-8 overflow-hidden rounded-[28px] shadow-[0_8px_18px_rgba(15,23,42,0.12)]"
      >
        <PoiDetailHeroCarousel
          photos={heroPhotos}
          name={article.title}
          revealControlsOnHover
          variant="blog"
        >
          <div className="absolute left-4 right-4 top-4 z-10 flex items-center justify-between opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
            <Link
              href={backHref}
              aria-label="Retour"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/55 text-slate-800 shadow-sm backdrop-blur transition-transform hover:bg-white/75 active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <HeroShareButton poiName={article.title} poiUrl={`/blog/${article.slug}`} />
          </div>
        </PoiDetailHeroCarousel>
      </div>

      <section className="mt-10">
        <h2 className="text-[30px] font-thin uppercase leading-tight tracking-[-0.035em] text-slate-900">
          Introduction
        </h2>
        <p className="mt-5 text-[15px] leading-7 text-slate-700">{article.excerpt}</p>
      </section>

      <BlogMarkdown source={article.content_markdown} />

      {article.tags.length > 0 && (
        <div className="mt-10 flex flex-wrap gap-2.5" aria-label="Tags de l’article">
          {article.tags.map(tag => (
            <span
              key={tag}
              className="rounded-full border border-slate-300 bg-white/45 px-3.5 py-1.5 text-[10px] font-light uppercase tracking-[0.12em] text-slate-700"
            >
              {tag.toUpperCase()}
            </span>
          ))}
        </div>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </article>
  )
}
