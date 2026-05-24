import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { getAdminTaxonomy } from '@/features/admin-taxonomy/queries/taxonomy'
import { AdminTaxonomyClient } from '@/features/admin-taxonomy/components/AdminTaxonomyClient'

export default async function AdminTaxonomyPage() {
  await getPageAdmin()
  const categories = await getAdminTaxonomy()

  return <AdminTaxonomyClient initialCategories={categories} />
}
