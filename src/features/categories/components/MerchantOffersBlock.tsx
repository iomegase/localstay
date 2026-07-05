import { BadgePercent } from 'lucide-react'
import type { PoiDetail } from '../types'

interface Props {
  offers: PoiDetail['merchant_offers']
}

export function MerchantOffersBlock({ offers }: Props) {
  const activeOffers = offers.filter(offer => offer.status === 'active')
  if (activeOffers.length === 0) return null

  return (
    <section className="space-y-3" data-testid="merchant-offers">
      <h2 className="font-serif text-2xl italic text-charcoal">Offres spéciales</h2>
      <div className="space-y-3">
        {activeOffers.map(offer => (
          <article key={offer.id} className="rounded-3xl border border-pink-600/25 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-600/10 text-pink-600">
                <BadgePercent className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-pink-600">Offre spéciale</p>
                <h3 className="mt-1 font-semibold text-charcoal">{offer.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-charcoal/65">{offer.description}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
