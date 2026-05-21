import { notFound } from 'next/navigation'
import { getCityGuide } from '@/features/city-guide/queries/cities'
import { CategoryGrid } from '@/features/categories/components/CategoryGrid'
import { t } from '@/shared/lib/i18n'
import Link from 'next/link'

interface Props {
  params: { 'city-slug': string }
}

export default async function GuidePage({ params }: Props) {
  const slug = params['city-slug']
  const guide = await getCityGuide(slug)

  // BR-01: slug not in DB → 404. notFound() throws in Next.js; guard keeps TS + tests safe.
  if (!guide) {
    notFound()
    return null
  }

  const { city, categories } = guide

  return (
    <>
      {/* City header */}
      <div className="flex justify-between items-end mb-6 px-4">
        <div>
          <h2 className="text-3xl font-light italic font-serif text-charcoal">
            {city.name}
          </h2>
          <p className="text-gray-400 text-xs tracking-wide mt-0.5">
            {t('guide.subtitle')}
          </p>
        </div>
      </div>

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
        // BR-02: CategoryGrid returns null when empty — never renders hidden DOM nodes
        <section className="mb-10">
          <CategoryGrid categories={categories} citySlug={slug} />
        </section>
      )}
    </>
  )
}
