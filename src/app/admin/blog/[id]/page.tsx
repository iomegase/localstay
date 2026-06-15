import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { getAdminBlogArticle, listBlogAdminCities } from '@/features/blog/queries/admin-blog'
import { AdminBlogEditor } from '@/features/blog/components/AdminBlogEditor'

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

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <Link href="/admin/blog" className="text-sm font-semibold text-slate-500">Retour au blog</Link>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{article.title}</h1>
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
