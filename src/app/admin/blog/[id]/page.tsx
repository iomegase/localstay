import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { getAdminBlogArticle, listBlogAdminCities } from '@/features/blog/queries/admin-blog'
import { AdminBlogEditor } from '@/features/blog/components/AdminBlogEditor'
import { buildBlogArticlePath } from '@/features/blog/lib/slug'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function AdminBlogDetailPage({ params }: PageProps) {
  await getPageAdmin()
  const { id } = await params
  const [article, cities] = await Promise.all([
    getAdminBlogArticle(id),
    listBlogAdminCities(),
  ])

  if (!article) notFound()

  const publicPath = buildBlogArticlePath(article.slug)

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <Link href="/admin/blog" className="text-sm font-semibold text-slate-500">Retour au blog</Link>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{article.title}</h1>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">URL publique</p>
          {article.status === 'published' ? (
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <code className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                {publicPath}
              </code>
              <Link
                href={publicPath}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-[#0B1437]"
              >
                Ouvrir l’article public
              </Link>
            </div>
          ) : (
            <p className="mt-2">URL publique disponible après publication.</p>
          )}
        </div>
      </header>
      <AdminBlogEditor
        cities={cities}
        initialArticle={{
          id: article.id,
          status: article.status,
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          content_markdown: article.content_markdown,
          category: article.category,
          tags: article.tags,
          city_id: article.city_id,
          seo_title: article.seo_title,
          seo_description: article.seo_description,
          photos: article.photos,
        }}
      />
    </div>
  )
}
