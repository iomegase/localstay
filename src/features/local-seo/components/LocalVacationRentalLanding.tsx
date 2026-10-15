import { faqPageSchema } from '@/features/seo/lib/structured-data'
import { JsonLd } from '@/shared/components/JsonLd'
import Link from 'next/link'
import { HelpContactDialog } from '@/features/contact-messages/components/HelpContactDialog'
import { MarketingFaqSection } from '@/features/marketing/components/MarketingFaqSection'
import { MarketingHighlightCards } from '@/features/marketing/components/MarketingHighlightCards'
import type {
  MarketingLodgingCard,
} from '@/features/lodging-showcase/queries/public-lodgings'
import {
  MarketingEyebrow,
  MarketingShell,
  marketingContainerClass,
  marketingHeroInsetClass,
  marketingDarkButtonClass,
  marketingPrimaryButtonClass,
} from '@/features/marketing/components/MarketingShell'
import { publicDiscoveryCityPath } from '@/features/public-discovery/lib/public-paths'
import { vacationFacts } from '../lib/vacation-facts'
import type { PublicLocalLandingDto } from '../types/landing-pages'
import { CityTitle } from '../lib/city-title'
import { LocalRentalCard } from './LocalRentalCard'

const secondaryButtonClass = 'inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 px-5 text-xs font-bold text-slate-700 transition-colors hover:border-pink-600 hover:text-pink-600'
const lightOutlineButtonClass = 'inline-flex min-h-11 items-center justify-center rounded-full border border-white/40 px-5 text-xs font-bold text-white transition-colors hover:border-pink-300 hover:text-pink-300'

// Ligne de faits affichée à partir de 3 logements publiés (spec 046 AC-03-10).
const FACTS_MIN_LODGINGS = 3

// Landing locations (spec 046 AC-03-06 à AC-03-08, orientée réservation AC-03-09 à AC-03-15).
export function LocalVacationRentalLanding({
  landing,
  lodgings,
}: {
  landing: PublicLocalLandingDto
  lodgings: MarketingLodgingCard[]
}) {
  const content = landing.page
  const facts = lodgings.length >= FACTS_MIN_LODGINGS ? vacationFacts(lodgings) : null
  const lodgingOptions = lodgings.map(lodging => lodging.title)
  const listingTitle = content.section_title !== content.h1
    ? content.section_title
    : `Nos logements à ${landing.city.name}`

  return (
    <MarketingShell localNavigation={{ city: landing.city, publication: landing.publication }}>
      {content.faq.length > 0 && <JsonLd data={faqPageSchema(content.faq)} />}
      <div className="font-sans text-slate-800">
        <section className={`${marketingContainerClass} pb-12 pt-10 sm:pb-16 sm:pt-16`}>
          <div data-testid="vacation-hero" className={marketingHeroInsetClass}>
            <MarketingEyebrow>{content.eyebrow}</MarketingEyebrow>
            <h1 className="max-w-[820px] text-balance text-[38px] font-bold leading-[1.02] tracking-[-0.05em] text-slate-900 sm:text-[52px]">
              {/* Spec 046 AC-03-16 : deux lignes, la commune en serif italique 34 px. */}
              <CityTitle title={content.h1} testId="vacation-title-city" />
            </h1>
            {content.hero_title !== content.h1 && (
              <p className="mt-5 max-w-[720px] text-[20px] font-semibold leading-snug tracking-[-0.025em] text-slate-800 sm:text-[22px]">
                {content.hero_title}
              </p>
            )}
            <p className="mt-5 max-w-[680px] text-[15px] leading-8 text-slate-600">
              {content.hero_copy}
            </p>
            {content.reassurance && (
              <p className="mt-3 text-[13px] font-semibold text-slate-500">{content.reassurance}</p>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <HelpContactDialog
                label="Poser une question"
                profile="traveler"
                lodgingOptions={lodgingOptions}
                className={secondaryButtonClass}
              />
            </div>
            {facts && (
              <p data-testid="vacation-facts" className="mt-6 text-xs font-semibold text-slate-900">
                <span aria-hidden="true" className="mr-2 inline-block h-2 w-2 rounded-full bg-pink-600" />
                {facts}
              </p>
            )}
          </div>
        </section>

        <section
          id="logements"
          aria-labelledby="logements-title"
          className="scroll-mt-6 bg-white pb-14 pt-2 sm:pb-20 sm:pt-4"
        >
          <div className={marketingContainerClass}>
            {lodgings.length > 0 ? (
              <>
                <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 id="logements-title" className="text-[28px] font-bold leading-tight tracking-[-0.04em] text-slate-900 sm:text-[36px]">
                      {listingTitle}
                    </h2>
                    {/* AC-03-15 : pas de texte d'introduction au-dessus des cartes. */}
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
                {content.section_copy !== content.hero_copy && (
                  <p className="mx-auto mt-5 max-w-[620px] text-[15px] leading-7 text-slate-500">{content.section_copy}</p>
                )}
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
              <Link className={`${lightOutlineButtonClass} mt-8 self-start`} href={publicDiscoveryCityPath(landing.city.slug)}>
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
          <section className={`${marketingContainerClass} pt-16 sm:pt-24 ${content.faq.length > 0 ? '' : 'pb-16 sm:pb-24'}`}>
            <MarketingEyebrow>Pourquoi MyStay</MarketingEyebrow>
            <h2 className="max-w-[720px] text-[30px] font-bold leading-tight tracking-[-0.04em] text-slate-900 sm:text-[40px]">
              Séjourner avec MyStay à {landing.city.name}
            </h2>
            <MarketingHighlightCards items={content.highlights} className="mt-8" />
          </section>
        )}

        {content.faq.length > 0 && (
          <div id="faq" className="scroll-mt-6">
            <MarketingFaqSection items={content.faq} title="Bon à savoir avant de réserver" columns={2} />
          </div>
        )}

        {lodgings.length > 0 && (
          <section
            aria-labelledby="question-title"
            className={`${marketingContainerClass} pb-16 sm:pb-24`}
          >
            <div className="rounded-[28px] bg-slate-800 bg-[radial-gradient(circle_at_90%_120%,rgba(219,39,119,0.22),transparent_45%)] px-6 py-10 text-white sm:px-12 sm:py-14 lg:flex lg:items-center lg:justify-between lg:gap-10">
              <div>
                <h2 id="question-title" className="text-[28px] font-bold leading-tight tracking-[-0.04em] sm:text-[34px]">
                  Une question sur le logement ?
                </h2>
                <p className="mt-3 max-w-[520px] text-[14px] leading-7 text-slate-300">
                  Accès, équipements, dates, arrivée : l’équipe MyStay connaît chaque logement et vous répond personnellement.
                </p>
              </div>
              <HelpContactDialog
                label="Nous écrire"
                profile="traveler"
                lodgingOptions={lodgingOptions}
                className={`${marketingPrimaryButtonClass} mt-7 w-full shrink-0 sm:w-auto lg:mt-0`}
              />
            </div>
          </section>
        )}
      </div>
    </MarketingShell>
  )
}
