import { notFound } from 'next/navigation'
import { getCityGuide } from '@/features/city-guide/queries/cities'
import { CategoryRow } from '@/features/city-guide/components/CategoryRow'
import { t } from '@/shared/lib/i18n'
import Link from 'next/link'
import { recordQrScanIfPresent } from '@/features/analytics/lib/record-qr-scan'
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

interface Props {
  params: Promise<{ 'city-slug': string }>
  searchParams?: Promise<{ lodging?: string }>
}

export default async function GuidePage({ params, searchParams }: Props) {
  const { 'city-slug': slug } = await params
  const { lodging: lodgingFromQuery } = (await searchParams) ?? {}
  const lodgingFromCookie = await getActiveLodgingContext()
  const lodging = lodgingFromQuery ?? lodgingFromCookie?.lodgingId
  void recordQrScanIfPresent(lodgingFromQuery ?? null)
  const guide = await getCityGuide(slug, { lodgingId: lodging })

  // BR-01: slug not in DB → 404. notFound() throws in Next.js; guard keeps TS + tests safe.
  if (!guide) {
    notFound()
    return null
  }

  const { city, categories } = guide

  return (
    <>
      <div className="flex justify-between items-end mb-4 p-4">
        <div>
          <h2 className="text-3xl font-light italic font-serif text-charcoal">
            {city.name}
          </h2>
          <p className="text-gray-400 text-xs tracking-wide mt-0.5">
            {t('guide.subtitle')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-gold uppercase tracking-widest">
            Météo
          </p>
          <p className="text-[10px] text-blue-500 font-medium">--°C</p>
        </div>
      </div>

      {guide.welcome_message && (
        <div className="mx-4 mb-5 rounded-3xl bg-white/80 border border-gray-100 px-5 py-4 text-sm leading-relaxed text-charcoal shadow-sm">
          {guide.welcome_message}
        </div>
      )}

      <section className="mt-4 mb-8 px-4">
        <div className="flex items-center gap-4 bg-white border border-gray-100 rounded-full px-6 py-4 shadow-sm">
          <Search className="w-4 h-4 text-gray-300" />
          <input
            type="text"
            placeholder="Une envie particulière ?"
            className="bg-transparent text-sm outline-none w-full placeholder:text-gray-300"
            aria-label="Rechercher une envie"
          />
        </div>
      </section>

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

          <section>
            <h2 className="text-xl p-4 font-light italic font-serif text-charcoal">
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
          </section>
        </>
      )}
    </>
  )
}
