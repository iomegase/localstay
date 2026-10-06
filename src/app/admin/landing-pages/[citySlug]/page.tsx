import { notFound } from 'next/navigation'
import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { AdminLandingCityEditor } from '@/features/local-seo/components/AdminLandingCityEditor'
import { tabFromParam } from '@/features/local-seo/lib/landing-editor'
import { getAdminLandingDestinationBySlug } from '@/features/local-seo/queries/landing-pages'

// Spec 076 US-02 : page d'édition des landings d'une ville.
export default async function AdminLandingCityPage({
  params,
  searchParams,
}: {
  params: Promise<{ citySlug: string }>
  searchParams: Promise<{ onglet?: string }>
}) {
  await getPageAdmin()
  const [{ citySlug }, { onglet }] = await Promise.all([params, searchParams])
  const destination = await getAdminLandingDestinationBySlug(citySlug)
  if (!destination) notFound()

  return <AdminLandingCityEditor destination={destination} initialTab={tabFromParam(onglet)} />
}
