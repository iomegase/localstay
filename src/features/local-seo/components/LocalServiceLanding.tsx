import Link from 'next/link'
import { ArrowRight, Check, MapPin } from 'lucide-react'
import type { LocalLandingPageInput, PublicLocalLandingDto } from '../types/landing-pages'
import {
  MarketingEyebrow,
  MarketingShell,
  marketingContainerClass,
  marketingPrimaryButtonClass,
} from '@/features/marketing/components/MarketingShell'

function PrimaryCta({ content }: { content: LocalLandingPageInput }) {
  if (content.cta_href.startsWith('mailto:')) {
    return (
      <a className={marketingPrimaryButtonClass} href={content.cta_href}>
        {content.cta_label}
        <ArrowRight aria-hidden="true" className="ml-3 h-4 w-4" />
      </a>
    )
  }

  return (
    <Link className={marketingPrimaryButtonClass} href={content.cta_href}>
      {content.cta_label}
      <ArrowRight aria-hidden="true" className="ml-3 h-4 w-4" />
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

  return (
    <MarketingShell>
      <div className="overflow-hidden font-sans text-slate-800">
        <section className={`${marketingContainerClass} pb-16 pt-10 sm:pb-24 sm:pt-16`}>
          <div className="rounded-[28px] bg-[radial-gradient(circle_at_100%_0%,rgba(219,39,119,0.12),transparent_34%)] bg-slate-50 px-6 py-10 sm:px-10 sm:py-14 lg:grid lg:grid-cols-[1.12fr_0.88fr] lg:items-end lg:gap-14 lg:px-14 lg:py-16">
            <div>
              <MarketingEyebrow>{content.eyebrow}</MarketingEyebrow>
              <h1 className="max-w-[760px] break-words text-[40px] font-bold leading-[0.98] tracking-[-0.055em] text-slate-900 sm:text-[56px] lg:text-[64px]">
                {content.h1}
              </h1>
            </div>
            <div className="mt-8 lg:mt-0">
              {content.hero_title !== content.h1 && (
                <h2 className="mb-4 text-xl font-bold leading-tight tracking-[-0.03em] text-slate-900 sm:text-2xl">
                  {content.hero_title}
                </h2>
              )}
              <p className="text-[14px] leading-7 text-slate-600 sm:text-[15px]">
                {content.hero_copy}
              </p>
              <div className="mt-7">
                <PrimaryCta content={content} />
              </div>
              {content.reassurance && (
                <p className="mt-4 text-[10px] font-semibold text-slate-500">{content.reassurance}</p>
              )}
            </div>
          </div>
        </section>

        <section className={`${marketingContainerClass} pb-20 sm:pb-28`}>
          <div className="max-w-[720px]">
            <MarketingEyebrow>{isConcierge ? 'Accompagnement MyStay' : 'Votre projet'}</MarketingEyebrow>
            <h2 className="text-[32px] font-bold leading-[1.08] tracking-[-0.045em] text-slate-900 sm:text-[42px]">
              {content.section_title}
            </h2>
            <p className="mt-6 text-[13px] text-justify leading-7 text-slate-500">
              {content.section_copy}
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            {content.highlights.map(highlight => (
              <article key={highlight.title} className="rounded-[24px] bg-[#f8f7f5] p-6 sm:p-7">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-pink-600 shadow-sm">
                  <Check aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
                </span>
                <h3 className="mt-6 text-lg font-bold tracking-[-0.03em] text-slate-900">
                  {highlight.title}
                </h3>
                <p className="mt-3 text-[13px] text-justify leading-6 text-slate-500">
                  {highlight.copy}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-slate-800 py-16 text-white sm:py-24">
          <div className={`${marketingContainerClass} grid grid-cols-1 gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20`}>
            <div>
              <MarketingEyebrow light>Une organisation claire</MarketingEyebrow>
              {content.process_title && (
                <h2 className="text-[32px] font-bold leading-[1.08] tracking-[-0.045em] sm:text-[42px]">
                  {content.process_title}
                </h2>
              )}
            </div>
            <ol className="border-t border-white/15">
              {content.steps.map((step, index) => (
                <li key={step.title} className="grid grid-cols-[34px_1fr] gap-4 border-b border-white/15 py-6">
                  <span className="text-[11px] font-bold text-pink-400">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold">{step.title}</h3>
                    <p className="mt-2 text-[13px] text-justify leading-6 text-slate-300">
                      {step.copy}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className={`${marketingContainerClass} grid grid-cols-1 gap-14 py-20 sm:py-28 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20`}>
          <div>
            <MarketingEyebrow>Sur place</MarketingEyebrow>
            <MapPin aria-hidden="true" className="mb-6 h-8 w-8 text-pink-600" strokeWidth={1.6} />
            <h2 className="text-[32px] font-bold leading-[1.08] tracking-[-0.045em] text-slate-900 sm:text-[42px]">
              {content.local_title}
            </h2>
            <p className="mt-6 text-[13px] text-justify leading-7 text-slate-500">
              {content.local_copy}
            </p>
          </div>

          <div>
            <MarketingEyebrow>Questions fréquentes</MarketingEyebrow>
            <div className="divide-y divide-slate-200 border-y border-slate-200">
              {content.faq.map(item => (
                <details key={item.question} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-[14px] font-bold text-slate-900">
                    {item.question}
                    <span aria-hidden="true" className="text-xl font-normal text-slate-400 group-open:rotate-45">+</span>
                  </summary>
                  <p className="pt-4 text-[13px] text-justify leading-7 text-slate-500">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className={`${marketingContainerClass} pb-20 sm:pb-28`}>
          <div className="rounded-[28px] bg-slate-50 px-6 py-10 sm:px-10 sm:py-12 lg:flex lg:items-end lg:justify-between lg:gap-12">
            <div>
              <MarketingEyebrow>Aller plus loin</MarketingEyebrow>
              <h2 className="max-w-[650px] text-[30px] font-bold leading-[1.12] tracking-[-0.04em] text-slate-900 sm:text-[38px]">
                {isConcierge
                  ? `Parlons de votre logement à ${landing.city.name}.`
                  : `Préparons votre séminaire à ${landing.city.name}.`}
              </h2>
              <div className="mt-7 flex flex-wrap gap-3 text-[12px] font-bold">
                <Link className="text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-pink-600" href="/logements">
                  Voir les logements
                </Link>
                <Link className="text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-pink-600" href="/decouvrir">
                  Découvrir la région
                </Link>
                <Link
                  className="text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-pink-600"
                  href={isConcierge ? '/concept' : '/seminaires'}
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
