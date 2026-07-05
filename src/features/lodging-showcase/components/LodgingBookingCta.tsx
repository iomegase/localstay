import Link from 'next/link'
import { ExternalBookingCta } from './ExternalBookingCta'
import { contextualContactPath } from '@/features/city-guide/lib/public-paths'

export function LodgingBookingCta({
  citySlug,
  lodgingId,
  publicContactEnabled,
  externalBookingUrl,
  externalBookingPlatform,
}: {
  citySlug: string
  lodgingId: string
  publicContactEnabled: boolean
  externalBookingUrl: string | null
  externalBookingPlatform: string | null
}) {
  if (!publicContactEnabled && !externalBookingUrl) return null

  return (
    <section className="mx-4 mt-6">
      <div
        className="relative overflow-hidden rounded-2xl px-5 py-6"
        style={{ background: 'linear-gradient(135deg, #003A5D 0%, #002a43 100%)' }}
      >
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-pink-600 opacity-10" />
        <p className="mb-1 text-[18px] font-light leading-snug text-white">Réserver ou contacter</p>
        <p className="mb-4 text-[11px] font-light leading-relaxed text-white/70">
          Vérifiez les disponibilités ou posez vos questions directement depuis la fiche.
        </p>
        <div className="flex flex-col gap-2">
          {publicContactEnabled && (
            <Link
              href={`${contextualContactPath(citySlug)}?lodging=${lodgingId}`}
              data-analytics-event="lodging_contact_click"
              data-analytics-city-slug={citySlug}
              data-analytics-lodging-id={lodgingId}
              className="w-full rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-center text-[14px] font-semibold text-white transition-colors hover:bg-white/20"
            >
              Contacter
            </Link>
          )}
          <ExternalBookingCta
            externalBookingUrl={externalBookingUrl}
            platform={externalBookingPlatform}
            citySlug={citySlug}
            lodgingId={lodgingId}
            className="w-full justify-center rounded-xl bg-pink-600 px-7 py-3 text-center text-[14px] font-semibold text-white shadow-md transition-all hover:opacity-90"
          />
        </div>
      </div>
    </section>
  )
}
