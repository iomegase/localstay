import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { AdminLandingPages } from '@/features/local-seo/components/AdminLandingPages'
import { listAdminLandingPages } from '@/features/local-seo/queries/landing-reviews'

export default async function AdminLandingPagesPage() {
  await getPageAdmin()
  return <AdminLandingPages initialPages={await listAdminLandingPages()} />
}
