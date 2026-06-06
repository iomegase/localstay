import { renderOgCardImage } from '@/features/seo/components/og-card-image'
import { OG_SIZE, OG_CONTENT_TYPE } from '@/features/seo/lib/og-image'
import { getCityForSeo } from '@/features/seo/queries/page-data'

export const alt = 'Guide local StayLocal'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

// Carte OG dédiée à la ville : « Le guide de {ville} ».
export default async function Image({ params }: { params: Promise<{ 'city-slug': string }> }) {
  const { 'city-slug': slug } = await params
  const city = await getCityForSeo(slug)
  const cityName = city?.name ?? null
  return renderOgCardImage({
    title: cityName ? `Le guide de ${cityName}` : null,
    subtitle: cityName
      ? `Restaurants, randonnées et activités à ${cityName} — la sélection locale StayLocal.`
      : null,
  })
}
