import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { AdminLandingPages } from '@/features/local-seo/components/AdminLandingPages'
import { listAdminLandingDestinations, listEligibleLandingCities } from '@/features/local-seo/queries/landing-pages'

export default async function AdminLandingPagesPage() {
  await getPageAdmin()
  const [destinations, eligibleCities] = await Promise.all([
    listAdminLandingDestinations(),
    listEligibleLandingCities(),
  ])
  return <AdminLandingPages initialDestinations={destinations} eligibleCities={eligibleCities} />
}
