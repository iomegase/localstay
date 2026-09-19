import Link from 'next/link'
import {
  ArrowRight,
} from 'lucide-react'

import type {
  LocalLandingPageInput,
  PublicLocalLandingDto,
} from '../types/landing-pages'

import {
  MarketingEyebrow,
  MarketingShell,
  marketingContainerClass,
  marketingPrimaryButtonClass,
} from '@/features/marketing/components/MarketingShell'
import { MarketingFaqSection } from '@/features/marketing/components/MarketingFaqSection'
import { MarketingHighlightCards } from '@/features/marketing/components/MarketingHighlightCards'

function PrimaryCta({
  content,
}: {
  content: LocalLandingPageInput
}) {
  if (content.cta_href.startsWith('mailto:')) {
    return (
      <a
        className={marketingPrimaryButtonClass}
        href={content.cta_href}
      >
        {content.cta_label}
      </a>
    )
  }

  return (
    <Link
      className={marketingPrimaryButtonClass}
      href={content.cta_href}
    >
      {content.cta_label}

      <ArrowRight
        aria-hidden="true"
        className="ml-3 h-4 w-4"
      />
    </Link>
  )
}

export function LocalServiceLanding({
  landing,
}: {
  landing: PublicLocalLandingDto
}) {
  const content = landing.page
  const isConcierge = content.intent === 'CONCIERGE'
  const reassuranceItems = content.reassurance
    ?.split('·')
    .map(item => item.trim())
    .filter(Boolean) ?? []

  return (
    <MarketingShell>
      <div className="overflow-hidden font-sans text-slate-800">

        {/* HERO */}
        <section
          className={`${marketingContainerClass} pb-16 pt-10 sm:pb-24 sm:pt-16`}
        >
          <div
            className="
              rounded-[28px]
              px-6
              py-10
              sm:px-10
              sm:py-14
              lg:grid
              lg:min-h-[620px]
              lg:grid-cols-[1.12fr_0.88fr]
              lg:items-stretch
              lg:gap-14
              lg:px-14
              lg:py-16
            "
          >
            {/* LEFT */}
            <div className="flex flex-col justify-center">
              <MarketingEyebrow>
                {content.eyebrow}
              </MarketingEyebrow>

              <h1
                className="
                  max-w-[760px]
                  break-words
                  text-[40px]
                  font-bold
                  leading-[0.98]
                  tracking-[-0.055em]
                  text-slate-900
                  sm:text-[56px]
                  lg:text-[64px]
                "
              >
                {content.h1}
              </h1>
            </div>

            {/* RIGHT */}
            <div className="mt-8 flex flex-col justify-center lg:mt-0">
              {content.hero_title !== content.h1 && (
                <h2
                  className="
                    mb-4
                    text-xl
                    font-bold
                    leading-tight
                    tracking-[-0.03em]
                    text-slate-900
                    sm:text-2xl
                  "
                >
                  {content.hero_title}
                </h2>
              )}

              <p className="text-[14px] leading-7 text-slate-600 sm:text-[15px]">
                {content.hero_copy}
              </p>

              <div className="mt-7">
                <PrimaryCta content={content} />
              </div>

              {reassuranceItems.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {reassuranceItems.map(item => (
                    <span
                      key={item}
                      data-testid="local-service-reassurance-pill"
                      className="inline-flex rounded-full bg-slate-100 px-3 py-2  mt-4 text-[10px] font-semibold leading-none text-slate-600"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* INTRO / HIGHLIGHTS */}
        <section
          className={`${marketingContainerClass} pb-20 sm:pb-28`}
        >
          <div className="max-w-[720px]">
            <MarketingEyebrow>
              {isConcierge
                ? 'Accompagnement MyStay'
                : 'Votre projet'}
            </MarketingEyebrow>

            <h2
              className="
                text-[32px]
                font-bold
                leading-[1.08]
                tracking-[-0.045em]
                text-slate-900
                sm:text-[42px]
              "
            >
              {content.section_title}
            </h2>

            <p className="mt-6 text-justify text-[13px] leading-7 text-slate-500">
              {content.section_copy}
            </p>
          </div>

          <MarketingHighlightCards items={content.highlights} />
        </section>

        {/* PROCESS */}
        <section className="bg-slate-800 py-16 text-white sm:py-24">
  <div
    className={`
      ${marketingContainerClass}
      grid
      grid-cols-1
      gap-12
      lg:grid-cols-[0.82fr_1.18fr]
      lg:items-center
      lg:gap-20
    `}
  >
    <div className="flex flex-col justify-center">
      <MarketingEyebrow light>
        Une organisation claire
      </MarketingEyebrow>

      {content.process_title && (
        <h2
          className="
            text-[32px]
            font-bold
            leading-[1.08]
            tracking-[-0.045em]
            sm:text-[42px]
          "
        >
          {content.process_title}
        </h2>
      )}
    </div>

    <ol className="border-t border-white/15">
      {content.steps.map((step, index) => (
        <li
          key={step.title}
          className="
            grid
            grid-cols-[34px_1fr]
            gap-4
            border-b
            border-white/15
            py-6
          "
        >
          <span className="text-[11px] font-bold text-pink-400">
            {String(index + 1).padStart(2, '0')}
          </span>

          <div>
            <h3 className="text-lg font-bold">
              {step.title}
            </h3>

            <p className="mt-2 text-justify text-[13px] leading-6 text-slate-300">
              {step.copy}
            </p>
          </div>
        </li>
      ))}
    </ol>
  </div>
</section>

        {/* LOCAL */}
        <section
          className={`
            ${marketingContainerClass}
            py-20
            sm:py-28
          `}
        >
          <div className="max-w-[720px]">
            <MarketingEyebrow>
              Sur place
            </MarketingEyebrow>

            <h2
              className="
                text-[32px]
                font-bold
                leading-[1.08]
                tracking-[-0.045em]
                text-slate-900
                sm:text-[42px]
              "
            >
              {content.local_title}
            </h2>

            <p
              className="
                mt-6
                text-justify
                text-[13px]
                leading-7
                text-slate-500
              "
            >
              {content.local_copy}
            </p>
          </div>
        </section>

        <MarketingFaqSection items={content.faq} />

        {/* FINAL CTA */}
        <section
          className={`${marketingContainerClass} pb-20 sm:pb-28`}
        >
          <div
            className="
              rounded-[28px]
              bg-slate-50
              px-6
              py-10
              sm:px-10
              sm:py-12
              lg:flex
              lg:items-end
              lg:justify-between
              lg:gap-12
            "
          >
            <div>
              <MarketingEyebrow>
                Aller plus loin
              </MarketingEyebrow>

              <h2
                className="
                  max-w-[650px]
                  text-[30px]
                  font-bold
                  leading-[1.12]
                  tracking-[-0.04em]
                  text-slate-900
                  sm:text-[38px]
                "
              >
                {isConcierge
                  ? `Parlons de votre logement à ${landing.city.name}.`
                  : `Préparons votre séminaire à ${landing.city.name}.`}
              </h2>

          <div className="mt-7 flex flex-wrap gap-2">
  <Link
    href="/logements"
    className="
      inline-flex
      items-center
      rounded-full
      bg-slate-200
      px-4
      py-2
      text-[10px]
      font-bold
      text-slate-700
      transition-colors
      hover:bg-slate-300
      hover:text-slate-900
    "
  >
    Voir les logements
  </Link>

  <Link
    href="/decouvrir"
    className="
      inline-flex
      items-center
      rounded-full
      bg-slate-200
      px-4
      py-2
      text-[10px]
      font-bold
      text-slate-700
      transition-colors
      hover:bg-slate-300
      hover:text-slate-900
    "
  >
    Découvrir la région
  </Link>

  <Link
    href={isConcierge ? '/concept' : '/seminaires'}
    className="
      inline-flex
      items-center
      rounded-full
      bg-slate-200
      px-4
      py-2
      text-[10px]
      font-bold
      text-slate-700
      transition-colors
      hover:bg-slate-300
      hover:text-slate-900
    "
  >
    {isConcierge ? 'Notre approche' : 'Tous les séminaires'}
  </Link>
</div>
            </div>

            <div className="mt-8 shrink-0 lg:mt-0">
              <PrimaryCta content={content} />
            </div>
          </div>
        </section>
      </div>
    </MarketingShell>
  )
}
