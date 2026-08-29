import { notFound } from 'next/navigation'
import MesFavorisPage from '@/app/(public)/mes-favoris/page'
import { getCityForSeo } from '@/features/seo/queries/page-data'
import { requireActiveLodgingContext } from '@/features/public-menu/lib/private-stay-guard'

interface Props {
  params: Promise<{ 'city-slug': string }>
}

export default async function ContextualMesFavorisPage({ params }: Props) {
  const { 'city-slug': citySlug } = await params
  await requireActiveLodgingContext(citySlug)
  const city = await getCityForSeo(citySlug)

  if (!city) {
    notFound()
    return null
  }

  return MesFavorisPage()
}
