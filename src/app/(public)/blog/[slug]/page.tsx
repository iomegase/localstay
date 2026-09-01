import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { PoiDetailHeroCarousel } from '@/features/categories/components/PoiDetailHeroCarousel'
import { HeroShareButton } from '@/features/categories/components/HeroShareButton'
import { BlogMarkdown } from '@/features/blog/components/BlogMarkdown'
import { buildBlogArticleBreadcrumb } from '@/features/blog/lib/breadcrumbs'
import { blogCategoryLabel } from '@/features/blog/lib/category-label'
import { blogArticleMetadata } from '@/features/blog/lib/metadata'
import { blogPostingSchema } from '@/features/blog/lib/structured-data'
import {
  getPublishedBlogArticleBySlug,
  getPublishedBlogArticles,
} from '@/features/blog/queries/public-blog'
import { estimateBlogReadingMinutes } from '@/features/blog/lib/reading-time'
import {
  MarketingEyebrow,
  MarketingShell,
  marketingContainerClass,
} from '@/features/marketing/components/MarketingShell'

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
  const [article, publishedArticles] = await Promise.all([
    getPublishedBlogArticleBySlug(slug),
    getPublishedBlogArticles(),
  ])

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
  const relatedArticles = (publishedArticles?.items ?? [])
    .filter(candidate => candidate.slug !== article.slug)
    .slice(0, 3)
  const publishedDate = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(article.published_at)
  const readingMinutes = estimateBlogReadingMinutes(article.content_markdown)

  return (
    <MarketingShell>
      <article className="overflow-hidden bg-[radial-gradient(circle_at_6%_4%,rgba(219,39,119,0.045),transparent_20%)] pb-24 text-slate-800 sm:pb-28">
        <nav aria-label="Breadcrumb" className="sr-only">
          {breadcrumbs.map(item =>
            item.href ? (
              <Link href={item.href} key={`${item.label}-${item.href}`}>
                {item.label}
              </Link>
            ) : (
              <span key={`${item.label}-current`}>{item.label}</span>
            ),
          )}
        </nav>

        <header
          data-testid="blog-article-intro"
          className={`${marketingContainerClass} grid gap-9 pt-[38px] min-[701px]:grid-cols-[0.88fr_1.12fr] min-[701px]:items-stretch min-[701px]:gap-[34px] min-[701px]:pt-[52px] min-[1051px]:gap-14`}
        >
          <div className="flex flex-col items-start justify-center pb-0 pt-3 min-[701px]:pb-[22px]">
            <Link
              className="mb-[54px] inline-flex items-center gap-2 text-[11px] font-bold text-slate-500 transition-colors hover:text-pink-600 min-[701px]:mb-[68px]"
              href={backHref}
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              Tous les articles
            </Link>
            <MarketingEyebrow>{blogCategoryLabel(article.category)}</MarketingEyebrow>
            <h1 className="mb-[22px] max-w-[560px] text-5xl font-semibold leading-[0.96] tracking-[-0.055em] text-slate-900 min-[701px]:mb-[26px] min-[701px]:text-[50px]">
              {article.title}
            </h1>
            <p className="max-w-[520px] text-[15px] leading-[1.72] text-slate-500">
              {article.excerpt}
            </p>
            <div className="mt-8 flex flex-wrap gap-[22px] text-[9px] font-extrabold uppercase tracking-[0.1em] text-slate-400">
              <time dateTime={article.published_at.toISOString()}>{publishedDate}</time>
              <span>{readingMinutes} min de lecture</span>
            </div>
          </div>

          <div
            data-testid="blog-article-cover"
            className="min-h-[430px] overflow-hidden rounded-[26px] shadow-[0_16px_44px_rgba(15,23,42,0.14)] min-[701px]:min-h-[540px] min-[701px]:rounded-[28px] min-[1051px]:min-h-[620px] [&>div]:aspect-auto [&>div]:h-full"
          >
            <PoiDetailHeroCarousel
              photos={heroPhotos}
              name={article.title}
              revealControlsOnHover
              variant="blog"
            >
              <div className="absolute left-4 right-4 top-4 z-10 flex items-center justify-end opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
                <HeroShareButton poiName={article.title} poiUrl={`/blog/${article.slug}`} />
              </div>
              <span className="absolute bottom-[22px] left-6 right-6 z-10 text-[8px] font-extrabold uppercase tracking-[0.14em] text-white/80">
                Journal MyStay · {blogCategoryLabel(article.category)}
              </span>
            </PoiDetailHeroCarousel>
          </div>
        </header>

        <div
          className={`${marketingContainerClass} grid gap-[54px] pt-16 min-[701px]:grid-cols-[180px_minmax(0,680px)] min-[701px]:justify-center min-[701px]:gap-12 min-[701px]:pt-[104px] min-[1051px]:grid-cols-[220px_minmax(0,760px)] min-[1051px]:gap-[90px]`}
        >
          <aside className="rounded-[22px] bg-[#f7f6f4] p-6 min-[701px]:sticky min-[701px]:top-[116px] min-[701px]:self-start min-[701px]:bg-transparent min-[701px]:p-0 min-[701px]:pt-1">
            <span className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-pink-600">
              Dans cet article
            </span>
            <nav
              aria-label="Sommaire de l’article"
              className="mt-[22px] grid border-t border-slate-200"
            >
              <a
                href="#introduction"
                className="border-b border-slate-200 py-3.5 text-[11px] font-semibold text-slate-500 transition-colors hover:text-pink-600"
              >
                Introduction
              </a>
              <a
                href="#article"
                className="border-b border-slate-200 py-3.5 text-[11px] font-semibold text-slate-500 transition-colors hover:text-pink-600"
              >
                Lire l’article
              </a>
            </nav>
            <dl className="mt-6 grid grid-cols-2 gap-[18px] min-[701px]:mt-[34px]">
              <div className="grid gap-1">
                <dt className="text-[7px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                  Publié le
                </dt>
                <dd className="m-0 text-[9px] font-bold leading-[1.4] text-slate-800">
                  {publishedDate}
                </dd>
              </div>
              <div className="grid gap-1">
                <dt className="text-[7px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                  Lecture
                </dt>
                <dd className="m-0 text-[9px] font-bold leading-[1.4] text-slate-800">
                  {readingMinutes} min
                </dd>
              </div>
            </dl>
          </aside>

          <div className="min-w-0">
            <p
              id="introduction"
              className="mb-[62px] max-w-[680px] scroll-mt-28 text-xl font-medium leading-[1.45] tracking-[-0.035em] text-slate-900 sm:text-[26px]"
            >
              {article.excerpt}
            </p>
            <div
              id="article"
              className="scroll-mt-28 [&_a]:text-pink-600 [&_h1]:mb-6 [&_h1]:mt-0 [&_h1]:text-4xl [&_h1]:font-bold [&_h1]:leading-[1.13] [&_h1]:tracking-[-0.045em] [&_h2]:mb-6 [&_h2]:mt-[68px] [&_h2]:text-4xl [&_h2]:font-bold [&_h2]:leading-[1.13] [&_h2]:tracking-[-0.045em] [&_h3]:font-bold [&_p]:leading-[1.85]"
            >
              <BlogMarkdown source={article.content_markdown} />
            </div>

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
          </div>
        </div>

        <aside
          className={`${marketingContainerClass} mt-20 flex flex-col items-start gap-10 rounded-[26px] px-6 bg-slate-800  py-9 text-white sm:px-12 sm:py-12 min-[701px]:mt-28 min-[701px]:flex-row min-[701px]:items-end min-[701px]:justify-between min-[701px]:px-[58px] min-[701px]:py-[52px]`}
        >
          <div>
            <MarketingEyebrow light>Votre logement</MarketingEyebrow>
            <h2 className="m-0 max-w-[590px] text-[28px] font-bold leading-[1.1] tracking-[-0.04em] sm:text-[40px]">
              Envie d’un accueil plus simple et plus attentif ?
            </h2>
          </div>
          <Link
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-white px-5 text-xs font-bold text-slate-800 shadow-[0_12px_28px_rgba(219,39,119,0.22)] transition-colors hover:bg-pink-600 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600"
            href="/confier-mon-logement"
          >
            Parler de mon projet
          </Link>
        </aside>

        {relatedArticles.length > 0 && (
          <section className={`${marketingContainerClass} pt-20 min-[701px]:pt-[110px]`}>
            <div className="flex flex-col items-start gap-5 min-[701px]:flex-row min-[701px]:items-end min-[701px]:justify-between">
              <MarketingEyebrow>À lire ensuite</MarketingEyebrow>
              
            </div>
            <div className="mt-9 grid gap-4 min-[701px]:grid-cols-3">
              {relatedArticles.map(related => (
                <Link
                  className="grid min-h-28 grid-cols-[80px_1fr_auto] items-center gap-3 rounded-[22px] shadow-[0_4px_12px_rgba(0,0,0,0.1)] bg-white p-3 transition-colors hover:border-slate-300 min-[701px]:grid-cols-[74px_1fr_auto] min-[1051px]:grid-cols-[92px_1fr_auto]"
                  href={`/blog/${related.slug}`}
                  key={related.id}
                >
                  {related.cover ? (
                    <span className="relative h-[88px] w-20 overflow-hidden rounded-[15px] min-[701px]:h-[82px] min-[701px]:w-[74px] min-[1051px]:h-[92px] min-[1051px]:w-[92px]">
                      <Image
                        alt={related.cover.alt}
                        className="object-cover"
                        fill
                        sizes="92px"
                        src={related.cover.url}
                        unoptimized
                      />
                    </span>
                  ) : (
                    <span className="h-[88px] w-20 rounded-[15px] bg-slate-100 min-[701px]:h-[82px] min-[701px]:w-[74px] min-[1051px]:h-[92px] min-[1051px]:w-[92px]" />
                  )}
                  <span className="min-w-0">
                    <small className="mb-2 block text-[7px] font-extrabold uppercase tracking-[0.12em] text-pink-600">
                      {blogCategoryLabel(related.category)}
                    </small>
                    <strong className="block text-[13px] font-bold leading-[1.3] tracking-[-0.025em] text-slate-900 min-[701px]:text-[11px] min-[1051px]:text-[13px]">
                      {related.title}
                    </strong>
                  </span>
                  <ArrowUpRight aria-hidden="true" className="h-[19px] w-[19px]" strokeWidth={1.7} />
                </Link>
              ))}
            </div>
          </section>
        )}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      </article>
    </MarketingShell>
  )
}
