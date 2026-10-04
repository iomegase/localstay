import { faqPageSchema } from '@/features/seo/lib/structured-data'
import { JsonLd } from '@/shared/components/JsonLd'
import Link from 'next/link'
import { ArrowRight, Plus } from 'lucide-react'
import type {
  MarketingLodgingCard,
} from '@/features/lodging-showcase/queries/public-lodgings'
import {
  MarketingEyebrow,
  MarketingShell,
  marketingContainerClass,
  marketingDarkButtonClass,
} from '@/features/marketing/components/MarketingShell'
import { lodgingCountLabel, vacationFacts } from '../lib/vacation-facts'
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
  const anchors = [
    { href: '#logements', label: 'Logements' },
    { href: '#destination', label: 'La destination' },
    ...(content.faq.length > 0 ? [{ href: '#faq', label: 'Questions fréquentes' }] : []),
  ]

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
          <p className="mt-5 max-w-[680px] text-[17px] leading-8 text-slate-600">
            {content.hero_copy}
          </p>
          {content.reassurance && (
            <p className="mt-3 text-[13px] font-semibold text-slate-500">{content.reassurance}</p>
          )}

          <div className="mt-9 flex flex-col gap-5 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            {facts && (
              <p data-testid="vacation-facts" className="text-[14px] font-bold text-slate-900">
                <span aria-hidden="true" className="mr-2 inline-block h-2 w-2 rounded-full bg-pink-600" />
                {facts}
              </p>
            )}
            <nav aria-label="Sur cette page" className="flex flex-wrap gap-2">
              {anchors.map(anchor => (
                <a
                  key={anchor.href}
                  href={anchor.href}
                  className="inline-flex min-h-10 items-center rounded-full border border-slate-200 px-4 text-[13px] font-semibold text-slate-600 transition-colors hover:border-slate-900 hover:text-slate-900"
                >
                  {anchor.label}
                </a>
              ))}
            </nav>
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
                  <p className="shrink-0 text-[13px] font-semibold text-slate-500">{lodgingCountLabel(lodgings.length)}</p>
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

        <section id="destination" className={`${marketingContainerClass} scroll-mt-6 py-16 sm:py-24`}>
          <div className="grid gap-6 lg:grid-cols-[5fr_7fr] lg:gap-16">
            <div>
              <MarketingEyebrow>La destination</MarketingEyebrow>
              <h2 className="text-balance text-[30px] font-bold leading-[1.1] tracking-[-0.045em] text-slate-900 sm:text-[40px]">
                {content.local_title}
              </h2>
            </div>
            <p className="text-[17px] leading-8 text-slate-600 lg:pt-9">
              {content.local_copy}
            </p>
          </div>

          {content.highlights.length > 0 && (
            <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
              {content.highlights.map((highlight, index) => (
                <article key={highlight.title} className="border-t-2 border-slate-900 pt-5">
                  <span className="text-[12px] font-bold text-pink-600">{String(index + 1).padStart(2, '0')}</span>
                  <h3 className="mt-2 text-[19px] font-bold leading-snug tracking-[-0.03em] text-slate-900">{highlight.title}</h3>
                  <p className="mt-3 text-[15px] leading-7 text-slate-500">{highlight.copy}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        {content.steps.length > 0 && (
          <section className="bg-slate-50 py-16 sm:py-20">
            <div className={marketingContainerClass}>
              {content.process_title && (
                <h2 className="max-w-[720px] text-balance text-[28px] font-bold leading-tight tracking-[-0.04em] text-slate-900 sm:text-[36px]">
                  {content.process_title}
                </h2>
              )}
              <ol className="mt-10 grid grid-cols-1 gap-8 md:auto-cols-fr md:grid-flow-col md:gap-6">
                {content.steps.map((step, index) => (
                  <li key={step.title} className="relative border-l border-slate-300 pl-6 md:border-l-0 md:border-t md:pl-0 md:pt-6">
                    <span aria-hidden="true" className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-pink-600 md:-top-[5px] md:left-0" />
                    <span className="text-[12px] font-bold text-pink-600">Étape {index + 1}</span>
                    <h3 className="mt-1 text-[18px] font-bold tracking-[-0.025em] text-slate-900">{step.title}</h3>
                    <p className="mt-2 text-[15px] leading-7 text-slate-500">{step.copy}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}

        {content.faq.length > 0 && (
          <section id="faq" className={`${marketingContainerClass} scroll-mt-6 py-16 sm:py-24`}>
            <div className="grid gap-8 lg:grid-cols-[4fr_8fr] lg:gap-16">
              <div className="lg:sticky lg:top-8 lg:self-start">
                <MarketingEyebrow>Questions fréquentes</MarketingEyebrow>
                <h2 className="text-[28px] font-bold leading-tight tracking-[-0.04em] text-slate-900 sm:text-[34px]">
                  Bon à savoir avant de réserver
                </h2>
              </div>
              <div className="divide-y divide-slate-200 border-y border-slate-200">
                {content.faq.map(item => (
                  <details key={item.question} className="group py-5">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-5 text-[16px] font-bold leading-snug text-slate-900 [&::-webkit-details-marker]:hidden">
                      {item.question}
                      <Plus aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-45" />
                    </summary>
                    <p className="max-w-[720px] pt-4 text-[15px] leading-7 text-slate-600">{item.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className={`${marketingContainerClass} pb-16 sm:pb-24`}>
          <div className="flex flex-col gap-6 rounded-[28px] bg-slate-900 px-6 py-9 text-white sm:flex-row sm:items-center sm:justify-between sm:px-10">
            <p className="max-w-[560px] text-[22px] font-bold leading-snug tracking-[-0.035em]">
              {landing.city.name} vous attend.
            </p>
            <Link
              className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-white px-6 text-[14px] font-bold text-slate-900 transition-colors hover:bg-pink-50"
              href={content.cta_href}
            >
              {content.cta_label}
              <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </MarketingShell>
  )
}
