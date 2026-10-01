import type { SuggestedLodging } from '../queries/public-lodgings'
import { CompactLodgingCard } from './CompactLodgingCard'
import { MarketingEyebrow } from '@/features/marketing/components/MarketingShell'

export function SuggestedLodgings({ lodgings }: { lodgings: SuggestedLodging[] }) {
  if (!lodgings.length) return null

  return (
    <section aria-labelledby="suggested-lodgings-heading" className="min-w-0">
      <div className="mb-[34px] max-w-[760px] sm:mb-12">
        <MarketingEyebrow>À découvrir aussi</MarketingEyebrow>
        <h2 id="suggested-lodgings-heading" className="m-0 max-w-[720px] text-[clamp(34px,4vw,40px)] font-bold leading-[1.02] tracking-[-0.05em] text-slate-800">
          D’autres adresses pour votre prochain séjour.
        </h2>
        <p className="mt-5 max-w-[660px] text-sm leading-[1.72] text-slate-500">
          Découvrez d’autres logements de la collection MyStay et trouvez le cadre qui vous correspond.
        </p>
      </div>
      <ul className="no-scrollbar -mx-4 -mt-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-8 pt-6">
        {lodgings.map(lodging => (
          <li key={lodging.id} className="w-[85%] shrink-0 snap-start sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)]">
            <CompactLodgingCard lodging={{
              title: lodging.title,
              href: lodging.href,
              cityName: lodging.location,
              surfaceM2: lodging.surfaceM2,
              maxGuests: lodging.maxGuests,
              photo: lodging.coverPhotoUrl ? { url: lodging.coverPhotoUrl, alt: lodging.title } : null,
            }} />
          </li>
        ))}
      </ul>
    </section>
  )
}
