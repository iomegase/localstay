import { notFound } from 'next/navigation'
import MesFavorisPage from '@/app/(public)/mes-favoris/page'
import { getCityForSeo } from '@/features/seo/queries/page-data'

interface Props {
  params: Promise<{ 'city-slug': string }>
}

export default async function ContextualMesFavorisPage({ params }: Props) {
  const { 'city-slug': citySlug } = await params
  const city = await getCityForSeo(citySlug)

  if (!city) {
    notFound()
    return null
  }

  return MesFavorisPage()
}
