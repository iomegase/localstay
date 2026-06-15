import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
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

  return (
    <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">
        {breadcrumbs.map(item =>
          item.href ? (
            <Link key={`${item.label}-${item.href}`} href={item.href} className="hover:text-slate-900">
              {item.label}
            </Link>
          ) : (
            <span key={item.label} className="text-slate-900">{item.label}</span>
          ),
        )}
      </nav>

      {article.cover && (
        <img
          src={article.cover.url}
          alt={article.cover.alt}
          className="mb-8 h-[320px] w-full rounded-3xl object-cover"
        />
      )}

      <header className="mb-8 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
          {blogCategoryLabel(article.category)}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950">{article.title}</h1>
        <p className="text-base leading-7 text-slate-600">{article.excerpt}</p>
      </header>

      <BlogMarkdown source={article.content_markdown} />

      {article.gallery.length > 0 && (
        <section className="mt-10 grid gap-4 sm:grid-cols-2">
          {article.gallery.map(photo => (
            <img key={photo.id} src={photo.url} alt={photo.alt} className="h-64 w-full rounded-2xl object-cover" />
          ))}
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </article>
  )
}
