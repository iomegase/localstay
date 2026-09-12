import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type {
  MarketingLodgingCard,
} from '@/features/lodging-showcase/queries/public-lodgings'
import { ExternalBookingCta } from '@/features/lodging-showcase/components/ExternalBookingCta'
import { MarketingPropertyCard } from '@/features/marketing/components/MarketingPropertyCard'
import {
  MarketingEyebrow,
  MarketingShell,
  marketingContainerClass,
  marketingDarkButtonClass,
} from '@/features/marketing/components/MarketingShell'
import type { PublicLocalLandingDto } from '../types/landing-pages'

function hasVerifiedAirbnbLink(lodging: MarketingLodgingCard): lodging is MarketingLodgingCard & {
  external_booking_url: string
} {
  return lodging.external_booking_platform === 'airbnb'
    && lodging.external_booking_url?.startsWith('https://') === true
}

export function LocalVacationRentalLanding({
  landing,
  lodgings,
}: {
  landing: PublicLocalLandingDto
  lodgings: MarketingLodgingCard[]
}) {
  const content = landing.page

  return (
    <MarketingShell>
      <div className="overflow-hidden font-sans text-slate-800">
        <section className={`${marketingContainerClass} pb-14 pt-10 sm:pb-20 sm:pt-16`}>
          <MarketingEyebrow>{content.eyebrow}</MarketingEyebrow>
          <h1 className="max-w-[880px] break-words text-[40px] font-bold leading-[0.98] tracking-[-0.055em] text-slate-900 sm:text-[56px] lg:text-[64px]">
            {content.h1}
          </h1>
          {content.hero_title !== content.h1 && (
            <h2 className="mt-7 text-[25px] font-bold leading-tight tracking-[-0.035em] text-slate-900 sm:text-[30px]">
              {content.hero_title}
            </h2>
          )}
          <p className="mt-7 max-w-[700px] text-[14px] leading-7 text-slate-500 sm:text-[15px]">
            {content.hero_copy}
          </p>
          {content.reassurance && (
            <p className="mt-4 text-[10px] font-semibold text-slate-500">{content.reassurance}</p>
          )}
        </section>

        <section className="bg-slate-50 py-14 sm:py-20">
          <div className={marketingContainerClass}>
            {content.section_title !== content.h1 && (
              <h2 className="mb-6 text-[30px] font-bold tracking-[-0.04em] text-slate-900 sm:text-[40px]">
                {content.section_title}
              </h2>
            )}
            {content.section_copy !== content.hero_copy && (
              <p className="mb-7 max-w-[700px] text-[13px] text-justify leading-7 text-slate-500">
                {content.section_copy}
              </p>
            )}
            {lodgings.length > 0 ? (
              <div className="grid grid-cols-1 gap-7 md:grid-cols-2">
                {lodgings.map((lodging, index) => (
                  <div key={lodging.id} className="flex min-w-0 flex-col gap-4">
                    <MarketingPropertyCard lodging={lodging} priority={index === 0} />
                    {hasVerifiedAirbnbLink(lodging) && (
                      <ExternalBookingCta
                        externalBookingUrl={lodging.external_booking_url}
                        platform={lodging.external_booking_platform}
                        citySlug={lodging.city_slug}
                        lodgingId={lodging.id}
                        label="Voir sur Airbnb"
                        className={`${marketingDarkButtonClass} w-full`}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-10 text-center sm:px-10 sm:py-14">
                <h2 className="text-[26px] font-bold leading-[1.15] tracking-[-0.04em] text-slate-900 sm:text-[32px]">
                  {content.section_title}
                </h2>
                <p className="mx-auto mt-5 max-w-[620px] text-[13px] text-justify leading-7 text-slate-500">
                  {content.empty_copy}
                </p>
                <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                  <Link className={marketingDarkButtonClass} href={content.cta_href}>
                    {content.cta_label}
                  </Link>
                  <Link className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 px-5 text-xs font-bold text-slate-700 hover:border-pink-600 hover:text-pink-600" href="/decouvrir">
                    Découvrir la région
                  </Link>
                </div>
              </div>
            )}
            {content.highlights.length > 0 && (
              <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
                {content.highlights.map(highlight => (
                  <article key={highlight.title} className="rounded-[24px] bg-white p-6 sm:p-7">
                    <h3 className="text-lg font-bold tracking-[-0.03em] text-slate-900">{highlight.title}</h3>
                    <p className="mt-3 text-[13px] text-justify leading-6 text-slate-500">{highlight.copy}</p>
                  </article>
                ))}
              </div>
            )}
            {content.steps.length > 0 && (
              <div className="mt-10">
                {content.process_title && (
                  <h2 className="text-[30px] font-bold tracking-[-0.04em] text-slate-900">{content.process_title}</h2>
                )}
                <ol className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
                  {content.steps.map((step, index) => (
                    <li key={step.title} className="grid grid-cols-[32px_1fr] gap-4 py-5">
                      <span className="text-xs font-bold text-pink-600">{String(index + 1).padStart(2, '0')}</span>
                      <div>
                        <h3 className="font-bold">{step.title}</h3>
                        <p className="mt-2 text-[13px] text-justify leading-6 text-slate-500">{step.copy}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {content.faq.length > 0 && (
              <div className="mt-10">
                <MarketingEyebrow>Questions fréquentes</MarketingEyebrow>
                <div className="divide-y divide-slate-200 border-y border-slate-200">
                  {content.faq.map(item => (
                    <details key={item.question} className="group py-5">
                      <summary className="flex cursor-pointer list-none justify-between gap-5 text-sm font-bold text-slate-900">
                        {item.question}
                        <span aria-hidden="true" className="text-xl font-normal group-open:rotate-45">+</span>
                      </summary>
                      <p className="max-w-[760px] pt-4 text-[13px] text-justify leading-7 text-slate-500">{item.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className={`${marketingContainerClass} py-16 sm:py-24`}>
          <div className="rounded-[28px] bg-slate-800 px-6 py-10 text-white sm:px-10 sm:py-12 lg:flex lg:items-end lg:justify-between lg:gap-14">
            <div>
              <MarketingEyebrow light>La destination</MarketingEyebrow>
              <h2 className="max-w-[650px] text-[30px] font-bold leading-[1.1] tracking-[-0.045em] sm:text-[38px]">
                {content.local_title}
              </h2>
              <p className="mt-6 max-w-[680px] text-[13px] text-justify leading-7 text-slate-300">
                {content.local_copy}
              </p>
            </div>
            <Link className="mt-8 inline-flex shrink-0 items-center text-[12px] font-bold text-pink-300 hover:text-white lg:mt-0" href={content.cta_href}>
              {content.cta_label}
              <ArrowRight aria-hidden="true" className="ml-3 h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </MarketingShell>
  )
}
