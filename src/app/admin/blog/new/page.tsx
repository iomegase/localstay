import Link from 'next/link'
import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { listBlogAdminCities } from '@/features/blog/queries/admin-blog'
import { AdminBlogEditor } from '@/features/blog/components/AdminBlogEditor'

export default async function AdminNewBlogPage() {
  await getPageAdmin()
  const cities = await listBlogAdminCities()

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <Link href="/admin/blog" className="text-sm font-semibold text-slate-500">Retour au blog</Link>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Nouvel article</h1>
      </header>
      <AdminBlogEditor cities={cities} />
    </div>
  )
}
