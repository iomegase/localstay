import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { z } from 'zod'
import { lodgingListMetadata } from '@/features/seo/lib/metadata'
import { getCityForSeo } from '@/features/seo/queries/page-data'
import { JsonLd } from '@/shared/components/JsonLd'
import { breadcrumbSchema, lodgingItemListSchema } from '@/features/seo/lib/structured-data'
import { LodgingCard } from '@/features/lodging-showcase/components/LodgingCard'
import { listPublishedLodgingsForCity } from '@/features/lodging-showcase/queries/public-lodgings'

interface Props {
  params: Promise<{ 'city-slug': string }>
  searchParams?: Promise<{ guests?: string; amenities?: string; page?: string; limit?: string }>
}

const pageQuerySchema = z.object({
  guests: z.coerce.number().int().min(1).max(30).optional(),
  amenities: z.string().optional().transform(value => value ? value.split(',').filter(Boolean) : []),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(30).default(12),
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { 'city-slug': citySlug } = await params
  const city = await getCityForSeo(citySlug)
  if (!city) return { title: 'Ville introuvable', robots: { index: false } }
  return lodgingListMetadata({ cityName: city.name, citySlug: city.slug })
}

export default async function LodgingListPage({ params, searchParams }: Props) {
  const { 'city-slug': citySlug } = await params
  const city = await getCityForSeo(citySlug)
  if (!city) {
    notFound()
    return null
  }

  const parsed = pageQuerySchema.safeParse((await searchParams) ?? {})
  const filters = parsed.success ? parsed.data : { page: 1, limit: 12, amenities: [] as string[] }
  const result = await listPublishedLodgingsForCity(citySlug, filters)

  if (!result) {
    notFound()
    return null
  }

  const breadcrumb = breadcrumbSchema([
    { name: 'Accueil', path: '/' },
    { name: city.name, path: `/guide/${citySlug}` },
    { name: 'Logements', path: `/guide/${citySlug}/logements` },
  ])

  return (
    <>
      <JsonLd
        data={[
          breadcrumb,
          ...(result.items.length > 0 ? [lodgingItemListSchema({ cityName: city.name, citySlug, items: result.items })] : []),
        ]}
      />
      <div className="space-y-8 px-4 pb-24 pt-6">
        <header className="space-y-3">
          <Link href={`/guide/${citySlug}`} className="text-sm text-gray-500 ">
            Retour 
          </Link>
          <div>
            {/* <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Ou dormir</p> */}
            <h1 className="mt-2 text-3xl uppercase font-thin text-charcoal/60">{city.name}</h1>
          </div>
          <p className="text-[11px] text-justify leading-6 tracking-wide italictext-gray-500">
            Découvrez les logements disponibles à {city.name} pour votre prochain voyage. Que vous recherchiez un appartement, une maison ou un hébergement unique, explorez nos biens et trouvez le lieu idéal pour votre voyage.
          </p>
        </header>

        {result.items.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-gold/40 bg-white p-6 text-sm leading-7 text-gray-600 shadow-sm">
            <p className="text-lg font-light text-charcoal">Aucun logement public n'est encore disponible pour cette destination.</p>
            <p className="mt-3">
              Le guide MyStay reste accessible pour preparer votre sejour : adresses locales, sorties, randos et recommandations de ville.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href={`/guide/${citySlug}`} className="rounded-full bg-charcoal px-4 py-2 text-sm text-white">
                Ouvrir le guide
              </Link>
            </div>
          </section>
        ) : (
          <section className="grid grid-cols-1 gap-4">
            {result.items.map(item => (
              <LodgingCard
                key={item.id}
                href={item.href}
                title={item.title}
                coverPhotoUrl={item.cover_photo_url}
                shortDescription={item.short_description}
                propertyType={item.property_type}
                maxGuests={item.max_guests}
                bedroomCount={item.bedroom_count}
                publicAreaLabel={item.public_area_label}
                amenities={item.amenities}
              />
            ))}
          </section>
        )}
      </div>
    </>
  )
}
