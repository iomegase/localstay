import { notFound } from 'next/navigation'
import { getCityGuide } from '@/features/city-guide/queries/cities'
import { CategoryRow } from '@/features/city-guide/components/CategoryRow'
import { t } from '@/shared/lib/i18n'
import Link from 'next/link'
import { recordQrScanIfPresent } from '@/features/analytics/lib/record-qr-scan'
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'
import { MarkdownText } from '@/shared/components/MarkdownText'
// import { GuideSearchInput } from '@/features/city-guide/components/GuideSearchInput' // réactiver lors de l'optimisation de la recherche
import { SortControl } from '@/features/categories/components/SortControl'
import { AllPoisList } from '@/features/categories/components/AllPoisList'
import { getAllPoiCards } from '@/features/categories/queries/all-poi-cards'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import type { Metadata } from 'next'
import { cityMetadata } from '@/features/seo/lib/metadata'
import { getCityForSeo } from '@/features/seo/queries/page-data'
import { JsonLd } from '@/shared/components/JsonLd'
import { breadcrumbSchema } from '@/features/seo/lib/structured-data'
import { getWeatherCity } from '@/features/weather/queries/weather-city'
import { getOpenMeteoForecast } from '@/features/weather/queries/open-meteo'
import { GuideWeatherBadge } from '@/features/weather/components/GuideWeatherBadge'
import { GeolocationPrompt } from '@/features/geolocation/components/GeolocationPrompt'
import { cityHasUpcomingEventsBySlug } from '@/features/events-public/queries/agenda'

interface Props {
  params: Promise<{ 'city-slug': string }>
  searchParams?: Promise<{ lodging?: string; sort?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { 'city-slug': slug } = await params
  const city = await getCityForSeo(slug)
  if (!city) return { title: 'Ville introuvable', robots: { index: false } }
  return cityMetadata({ name: city.name, region: city.region, slug: city.slug })
}

export default async function GuidePage({ params, searchParams }: Props) {
  const { 'city-slug': slug } = await params
  const sp = (await searchParams) ?? {}
  const lodgingFromQuery = sp.lodging
  const sort = sp.sort === 'rating' ? 'rating' : 'distance'
  const lodgingFromCookie = await getActiveLodgingContext()
  const lodging = lodgingFromQuery ?? lodgingFromCookie?.lodgingId
  void recordQrScanIfPresent(lodgingFromQuery ?? null)
  const [guide, allPois, weatherCity] = await Promise.all([
    getCityGuide(slug, { lodgingId: lodging }),
    getAllPoiCards(slug, { sort, page: 1, limit: 10, lodgingId: lodging }),
    getWeatherCity(slug),
  ])

  // BR-01: slug not in DB → 404. notFound() throws in Next.js; guard keeps TS + tests safe.
  if (!guide) {
    notFound()
    return null
  }

  const { city, categories } = guide
  const forecast = weatherCity
    ? await getForecastOrNull(weatherCity.latitude, weatherCity.longitude)
    : null
  const hasEvents = await cityHasUpcomingEventsBySlug(slug)
  const agendaHref = lodging ? `/guide/${slug}/agenda?lodging=${encodeURIComponent(lodging)}` : `/guide/${slug}/agenda`

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Accueil', path: '/' },
          { name: city.name, path: `/guide/${slug}` },
        ])}
      />

      <GeolocationPrompt />

      <div className="flex justify-between items-start mb-4 p-4">
        <div>
          <p className="text-[10px] font-bold text-gold uppercase tracking-widest">Le guide</p>
          <h1 className="text-2xl font-light uppercase text-charcoal">
            {city.name}
          </h1>
          <p className="text-gray-400 text-xs tracking-wide mt-4 leading-6">
            {/* {t('guide.subtitle')} */}Découvrez nos recommandations pour profiter de votre séjour au mieux
          </p>
        </div>

        {forecast && (
          <GuideWeatherBadge
            citySlug={slug}
            icon={forecast.current.icon}
            temperature={forecast.current.temperature}
          />
        )}
      </div>

      {/* Recherche désactivée temporairement — à réoptimiser ultérieurement.
      <section className="mt-4 mb-8 px-4">
        <GuideSearchInput citySlug={slug} lodgingId={lodging} />
      </section>
      */}
      {/* BR-01 + AC-03-04: valid city with no POIs → 200 + empty state */}
      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-8 py-16 text-center gap-4">
          <p className="text-gray-500 text-sm leading-relaxed">
            {t('guide.empty_state')}
          </p>
          <Link
            href="/"
            className="text-xs font-bold uppercase tracking-widest text-gold underline underline-offset-4"
          >
            {t('guide.back_home')}
          </Link>
        </div>
      ) : (
        <>
          <section className="mb-10">
            <CategoryRow categories={categories} citySlug={slug} lodgingId={lodging} />
          </section>

          {hasEvents && (
            <section className="mb-8 px-4">
              <Link
                href={agendaHref}
                data-testid="agenda-tile"
                className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition active:scale-[0.99]"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/10 text-gold">
                    <CalendarDays className="h-6 w-6" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-charcoal">Sorties &amp; manifestations</span>
                    <span className="block text-xs text-gray-400">L&apos;agenda des événements à venir</span>
                  </span>
                </span>
                <ChevronRight className="h-5 w-5 text-gray-300" />
              </Link>
            </section>
          )}

          {/* Vue « Tous » par défaut : tous les POI de la ville, scroll infini (10 par 10) */}
          <section className="mb-10">
            <SortControl currentSort={sort} />
            <AllPoisList
              citySlug={slug}
              initialItems={allPois?.items ?? []}
              initialMeta={allPois?.meta ?? { page: 1, limit: 10, total: 0, total_pages: 0 }}
              sort={sort}
              lodgingId={lodging}
            />
          </section>

      {/* {guide.welcome_message && (
        <div className="mx-4 mb-5  py-4 text-sm leading-relaxed text-charcoal shadow-sm">
          <MarkdownText source={guide.welcome_message} breaks className="text-sm leading-relaxed text-charcoal" />
        </div>
      )} */}

    
 

          {/* <section>
            <h2 className="text-xl p-4 font-light uppercase text-charcoal">
              Nos coups de coeur
            </h2>
            <Link
              href={lodging ? `/guide/${slug}/${categories[0].slug}?lodging=${encodeURIComponent(lodging)}` : `/guide/${slug}/${categories[0].slug}`}
              className="relative block h-[400px] overflow-hidden group shadow-2xl bg-charcoal"
            >
              <img
                src="https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1200&auto=format&fit=crop"
                className="absolute inset-0 w-full h-full object-cover transition duration-700 group-hover:scale-105"
                alt=""
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
              <span className="absolute left-4 top-1/2 z-20 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 backdrop-blur-md flex items-center justify-center text-charcoal shadow-lg">
                <ChevronLeft className="w-5 h-5" />
              </span>
              <span className="absolute right-4 top-1/2 z-20 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 backdrop-blur-md flex items-center justify-center text-charcoal shadow-lg">
                <ChevronRight className="w-5 h-5" />
              </span>
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <h3 className="text-3xl font-light italic font-serif">
                  {categories[0].name}
                </h3>
                <div className="flex items-center gap-4 mt-4">
                  <span className="text-xs border-r border-white/50 pr-4 italic font-serif tracking-wider">
                    {categories[0].poi_count} recommandations
                  </span>
                  <span className="text-xs font-light uppercase tracking-widest text-[#D4AF37]">
                    Sélection locale
                  </span>
                </div>
              </div>
            </Link>
          </section> */}
        </>
      )}
    </>
  )
}

async function getForecastOrNull(latitude: number, longitude: number) {
  try {
    return await getOpenMeteoForecast({ latitude, longitude })
  } catch {
    return null
  }
}
