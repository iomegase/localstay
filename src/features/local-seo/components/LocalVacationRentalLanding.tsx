import { faqPageSchema } from '@/features/seo/lib/structured-data'
import { JsonLd } from '@/shared/components/JsonLd'
import Link from 'next/link'
import { MarketingFaqSection } from '@/features/marketing/components/MarketingFaqSection'
import type {
  MarketingLodgingCard,
} from '@/features/lodging-showcase/queries/public-lodgings'
import {
  MarketingEyebrow,
  MarketingShell,
  marketingContainerClass,
  marketingDarkButtonClass,
} from '@/features/marketing/components/MarketingShell'
import { publicDiscoveryCityPath } from '@/features/public-discovery/lib/public-paths'
import { vacationFacts } from '../lib/vacation-facts'
import type { PublicLocalLandingDto } from '../types/landing-pages'
import { LocalRentalCard } from './LocalRentalCard'

// Refonte éditoriale de la landing locations (spec 046 AC-03-06 à AC-03-08).
export function LocalVacationRentalLanding({
  landing,
  lodgings,
}: {
  landing: PublicLocalLandingDto
  lodgings: MarketingLodgingCard[]
}) {
  const content = landing.page
  const facts = vacationFacts(lodgings)
  const listingTitle = content.section_title !== content.h1
    ? content.section_title
    : `Nos logements à ${landing.city.name}`

  return (
    <MarketingShell localNavigation={{ city: landing.city, publication: landing.publication }}>
      {content.faq.length > 0 && <JsonLd data={faqPageSchema(content.faq)} />}
      <div className="font-sans text-slate-800">
        <section className={`${marketingContainerClass} pb-12 pt-10 sm:pb-16 sm:pt-16`}>
          <MarketingEyebrow>{content.eyebrow}</MarketingEyebrow>
          <h1 className="max-w-[820px] text-balance text-[38px] font-bold leading-[1.02] tracking-[-0.05em] text-slate-900 sm:text-[52px]">
            {content.h1}
          </h1>
          {content.hero_title !== content.h1 && (
            <p className="mt-5 max-w-[720px] text-[20px] font-semibold leading-snug tracking-[-0.025em] text-slate-800 sm:text-[22px]">
              {content.hero_title}
            </p>
          )}
          <p className="mt-5 max-w-[680px] text-[14px] leading-8 text-slate-600">
            {content.hero_copy}
          </p>
          {content.reassurance && (
            <p className="mt-3 text-[13px] font-semibold text-slate-500">{content.reassurance}</p>
          )}

          <div className="mt-9 flex flex-col gap-5  pt-6 sm:flex-row sm:items-center sm:justify-between">
            {facts && (
              <p data-testid="vacation-facts" className="text-xs font-semibold text-slate-900">
                <span aria-hidden="true" className="mr-2 inline-block h-2 w-2 rounded-full bg-pink-600" />
                {facts}
              </p>
            )}

          </div>
        </section>

        <section
          id="logements"
          aria-labelledby="logements-title"
          className="scroll-mt-6 bg-slate-50 py-14 sm:py-20"
        >
          <div className={marketingContainerClass}>
            {lodgings.length > 0 ? (
              <>
                <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 id="logements-title" className="text-[28px] font-bold leading-tight tracking-[-0.04em] text-slate-900 sm:text-[36px]">
                      {listingTitle}
                    </h2>
                    {content.section_copy !== content.hero_copy && (
                      <p className="mt-3 max-w-[640px] text-[15px] leading-7 text-slate-500">{content.section_copy}</p>
                    )}
                  </div>

                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-5">
                  {lodgings.map((lodging, index) => (
                    <LocalRentalCard key={lodging.id} lodging={lodging} priority={index === 0} />
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-10 text-center sm:px-10 sm:py-14">
                <h2 id="logements-title" className="text-[26px] font-bold leading-[1.15] tracking-[-0.04em] text-slate-900 sm:text-[32px]">
                  {content.section_title}
                </h2>
                <p className="mx-auto mt-5 max-w-[620px] text-[15px] leading-7 text-slate-500">
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
          </div>
        </section>

        <section
          id="destination"
          className="scroll-mt-6 bg-[radial-gradient(circle_at_10%_105%,rgba(219,39,119,0.14),transparent_31%)] bg-slate-800 py-16 text-white sm:py-24"
        >
          <div className={`${marketingContainerClass} grid gap-12 lg:grid-cols-2 lg:items-center`}>
            <div className="flex flex-col justify-center">
              <MarketingEyebrow light>Sur place</MarketingEyebrow>
              <h2 className="text-[32px] font-bold tracking-[-0.04em] text-white sm:text-[40px]">
                {content.local_title}
              </h2>
              <p className="mt-6 text-[13px] text-justify leading-7 text-slate-300">{content.local_copy}</p>
              <Link className="mt-6 inline-flex text-xs font-bold text-pink-300 hover:text-white" href={publicDiscoveryCityPath(landing.city.slug)}>
                Découvrir {landing.city.name}
              </Link>
            </div>
            {content.steps.length > 0 && (
              <div className="flex flex-col justify-center">
                <MarketingEyebrow light>Notre fonctionnement</MarketingEyebrow>
                {content.process_title && (
                  <h2 className="text-[30px] font-bold tracking-[-0.04em] text-white">
                    {content.process_title}
                  </h2>
                )}
                <ol className="mt-6 divide-y divide-white/15">
                  {content.steps.map(({ title, copy }, index) => (
                    <li key={title} className="grid grid-cols-[32px_1fr] items-center gap-4 py-5">
                      <span className="text-xs font-bold text-pink-400">{String(index + 1).padStart(2, '0')}</span>
                      <div>
                        <h3 className="font-bold text-white">{title}</h3>
                        <p className="mt-2 text-[13px] text-justify leading-6 text-slate-400">{copy}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </section>

        {content.highlights.length > 0 && (
          <section className={`${marketingContainerClass} py-16 sm:py-24`}>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-6">
              {content.highlights.map((highlight, index) => (
                <article key={highlight.title} className="border-t-2 border-slate-900 pt-5">
                  <span className="text-[12px] font-bold text-pink-600">{String(index + 1).padStart(2, '0')}</span>
                  <h3 className="mt-2 text-[19px] font-bold leading-snug tracking-[-0.03em] text-slate-900">{highlight.title}</h3>
                  <p className="mt-3 text-[15px] leading-7 text-slate-500">{highlight.copy}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {content.faq.length > 0 && (
          <div id="faq" className="scroll-mt-6">
            <MarketingFaqSection items={content.faq} title="Bon à savoir avant de réserver" columns={2} />
          </div>
        )}

        <section className={`${marketingContainerClass} pb-16 sm:pb-24`}>
          <div className="flex flex-col gap-6 rounded-[28px] bg-slate-900 px-6 py-9 text-white sm:flex-row sm:items-center sm:justify-between sm:px-10">
            <p className="max-w-[560px] text-[22px] font-bold leading-snug ">
              {landing.city.name} vous attend.
            </p>
            <Link
              className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-white px-6 text-[14px] font-bold text-slate-900 transition-colors hover:bg-pink-50"
              href={content.cta_href}
            >
              {content.cta_label}
            </Link>
          </div>
        </section>
      </div>
    </MarketingShell>
  )
}
