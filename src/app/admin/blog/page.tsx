import Link from 'next/link'
import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { listAdminBlogArticles, listBlogAdminCities } from '@/features/blog/queries/admin-blog'
import { blogCategoryLabel } from '@/features/blog/lib/category-label'
import { BlogDeleteButton } from '@/features/blog/components/BlogDeleteButton'
import { BLOG_ARTICLE_CATEGORIES, BLOG_ARTICLE_STATUSES } from '@/features/blog/types'

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export default async function AdminBlogPage({ searchParams }: PageProps) {
  await getPageAdmin()
  const params = await searchParams
  const filters = {
    status: firstParam(params.status) as typeof BLOG_ARTICLE_STATUSES[number] | undefined,
    category: firstParam(params.category) as typeof BLOG_ARTICLE_CATEGORIES[number] | undefined,
    city: firstParam(params.city),
  }

  const [articles, cities] = await Promise.all([
    listAdminBlogArticles(filters),
    listBlogAdminCities(),
  ])

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Éditorial</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Blog admin</h1>
        </div>
        <Link href="/admin/blog/new" className="rounded-xl bg-[#0B1437] px-5 py-3 text-sm font-semibold text-white">
          Nouvel article
        </Link>
      </header>

      <form action="/admin/blog" className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 md:grid-cols-4">
        <select name="status" defaultValue={filters.status ?? ''} className="rounded-xl border border-slate-200 px-4 py-3 text-sm">
          <option value="">Tous statuts</option>
          {BLOG_ARTICLE_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
        </select>
        <select name="category" defaultValue={filters.category ?? ''} className="rounded-xl border border-slate-200 px-4 py-3 text-sm">
          <option value="">Toutes catégories</option>
          {BLOG_ARTICLE_CATEGORIES.map(category => <option key={category} value={category}>{blogCategoryLabel(category)}</option>)}
        </select>
        <select name="city" defaultValue={filters.city ?? ''} className="rounded-xl border border-slate-200 px-4 py-3 text-sm">
          <option value="">Toutes villes</option>
          {cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
        </select>
        <button type="submit" className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">
          Filtrer
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {articles.length === 0 ? (
          <div className="px-6 py-12 text-sm text-slate-600">Aucun article</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">Titre</th>
                <th className="px-6 py-3 font-medium">Statut</th>
                <th className="px-6 py-3 font-medium">Catégorie</th>
                <th className="px-6 py-3 font-medium">Ville</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map(article => (
                <tr key={article.id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-6 py-4">
                    <Link href={`/admin/blog/${article.id}`} className="font-semibold text-slate-950">
                      {article.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4">{article.status}</td>
                  <td className="px-6 py-4">{blogCategoryLabel(article.category as typeof BLOG_ARTICLE_CATEGORIES[number])}</td>
                  <td className="px-6 py-4">{article.city_name ?? 'Global'}</td>
                  <td className="px-6 py-4 text-right">
                    <BlogDeleteButton id={article.id} title={article.title} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
