import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check, MapPin } from 'lucide-react'
import type { MarketingLodgingCard } from '@/features/lodging-showcase/queries/public-lodgings'
import { MarketingPropertyCard } from '@/features/marketing/components/MarketingPropertyCard'
import {
  MarketingEyebrow,
  MarketingShell,
  marketingContainerClass,
  marketingDarkButtonClass,
  marketingPrimaryButtonClass,
} from '@/features/marketing/components/MarketingShell'
import { publicDiscoveryCityPath } from '@/features/public-discovery/lib/public-paths'
import type { PublicLocalLandingDto } from '../types/landing-pages'
import type { GuestReview } from '../content/guest-reviews'
import { GuestReviews } from './GuestReviews'

type LocalConciergeLandingProps = {
  landing: PublicLocalLandingDto
  lodgings: MarketingLodgingCard[]
  reviews: GuestReview[]
}

export function LocalConciergeLanding({
  landing,
  lodgings,
  reviews,
}: LocalConciergeLandingProps) {
  const { city, page: content } = landing
  const guidePath = publicDiscoveryCityPath(city.slug)

  return (
    <MarketingShell>
      <div className="overflow-hidden font-sans text-slate-800">
        <section className={`${marketingContainerClass} pb-14 pt-8 sm:pb-20 sm:pt-14`}>
          <div className="rounded-[28px] bg-slate-50 px-6 py-10 sm:px-10 sm:py-14 lg:grid lg:grid-cols-[1.05fr_.95fr] lg:gap-16 lg:px-14">
            <div>
              <MarketingEyebrow>{content.eyebrow}</MarketingEyebrow>
              <h1 className="break-words text-[39px] font-bold leading-[1] tracking-[-0.055em] text-slate-900 sm:text-[56px] lg:text-[62px]">
                {content.h1}
              </h1>
            </div>
            <div className="mt-8 lg:mt-0 lg:self-end">
              <h2 className="text-[25px] font-bold leading-tight tracking-[-0.035em] text-slate-900 sm:text-[30px]">
                {content.hero_title}
              </h2>
              <p className="mt-5 text-[13px] text-justify leading-7 text-slate-600">
                {content.hero_copy}
              </p>
              <Link className={`${marketingPrimaryButtonClass} mt-7`} href={content.cta_href}>
                {content.cta_label}
                <ArrowRight className="ml-3 h-4 w-4" aria-hidden="true" />
              </Link>
              {content.reassurance && (
                <p className="mt-4 text-[10px] font-semibold text-slate-500">{content.reassurance}</p>
              )}
            </div>
          </div>
        </section>

        {lodgings.length > 0 && (
          <section className={`${marketingContainerClass} pb-20 sm:pb-28`}>
            <MarketingEyebrow>Logements accompagnés</MarketingEyebrow>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-[30px] font-bold tracking-[-0.04em] text-slate-900 sm:text-[40px]">
                  Des logements déjà confiés à MyStay
                </h2>
                <p className="mt-4 max-w-[620px] text-[13px] text-justify leading-7 text-slate-500">
                  Chalets, appartements et résidences secondaires : nous accompagnons des propriétaires dans le Pays du Mont-Blanc.
                </p>
              </div>
              <Link className="shrink-0 text-xs font-bold text-pink-600" href="/logements">
                Voir les logements <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="mt-9 grid gap-6 md:grid-cols-3">
              {lodgings.slice(0, 3).map((lodging, index) => (
                <MarketingPropertyCard key={lodging.id} lodging={lodging} priority={index === 0} compact />
              ))}
            </div>
          </section>
        )}

        <section className="bg-slate-800 py-16 text-white sm:py-24">
          <div className={`${marketingContainerClass} grid gap-12 lg:grid-cols-[.8fr_1.2fr]`}>
            <div>
              <MarketingEyebrow light>Pour le propriétaire</MarketingEyebrow>
              <h2 className="text-[32px] font-bold leading-tight tracking-[-0.04em] sm:text-[42px]">
                {content.section_title}
              </h2>
              <p className="mt-6 text-[13px] text-justify leading-7 text-slate-300">{content.section_copy}</p>
            </div>
            <div>
              <h2 className="text-[28px] font-bold">Nous prenons soin de votre location</h2>
              <div className="mt-7 grid gap-px overflow-hidden rounded-[24px] bg-white/10 sm:grid-cols-2">
                {content.highlights.map(({ title, copy }) => (
                  <article key={title} className="bg-slate-800 p-6">
                    <Check className="h-5 w-5 text-pink-400" aria-hidden="true" />
                    <h3 className="mt-4 font-bold">{title}</h3>
                    <p className="mt-2 text-[13px] text-justify leading-6 text-slate-300">{copy}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={`${marketingContainerClass} grid gap-12 py-20 sm:py-28 lg:grid-cols-[1fr_.8fr] lg:items-center`}>
          <div>
            <MarketingEyebrow>Le guide MyStay</MarketingEyebrow>
            <h2 className="text-[32px] font-bold leading-tight tracking-[-0.04em] text-slate-900 sm:text-[42px]">
              Une conciergerie locale, prolongée par le digital
            </h2>
            <p className="mt-6 text-[13px] text-justify leading-7 text-slate-500">
              Chaque logement dispose de son guide personnalisé. Les voyageurs retrouvent les informations d’arrivée, le Wi-Fi, les équipements, les consignes et nos recommandations autour de {city.name}.
            </p>
            <ul className="mt-7 space-y-3 text-sm font-bold text-slate-800">
              <li>Moins de questions répétitives.</li>
              <li>Une arrivée plus fluide.</li>
              <li>Une information toujours accessible.</li>
            </ul>
            <Link className={`${marketingDarkButtonClass} mt-8`} href="/concept">
              Découvrir le concept MyStay
            </Link>
          </div>
          <div className="relative mx-auto aspect-[3/4] w-full max-w-[330px]">
            <Image
              src="/marketing/telephone-demo-trim.png"
              alt="Aperçu du guide voyageur MyStay sur téléphone"
              fill
              className="object-contain"
              sizes="(max-width: 1023px) 330px, 300px"
            />
          </div>
        </section>

        <section className="bg-[#f8f7f5] py-16 sm:py-24">
          <div className={`${marketingContainerClass} grid gap-12 lg:grid-cols-2`}>
            <div>
              <MarketingEyebrow>Sur place</MarketingEyebrow>
              <MapPin className="mb-5 h-7 w-7 text-pink-600" aria-hidden="true" />
              <h2 className="text-[32px] font-bold tracking-[-0.04em] text-slate-900 sm:text-[40px]">
                {content.local_title}
              </h2>
              <p className="mt-6 text-[13px] text-justify leading-7 text-slate-600">{content.local_copy}</p>
              <Link className="mt-6 inline-flex text-xs font-bold text-pink-600" href={guidePath}>
                Découvrir {city.name} <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div>
              <MarketingEyebrow>Notre fonctionnement</MarketingEyebrow>
              {content.process_title && (
                <h2 className="text-[30px] font-bold tracking-[-0.04em] text-slate-900">
                  {content.process_title}
                </h2>
              )}
              <ol className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
                {content.steps.map(({ title, copy }, index) => (
                  <li key={title} className="grid grid-cols-[32px_1fr] gap-4 py-5">
                    <span className="text-xs font-bold text-pink-600">0{index + 1}</span>
                    <div>
                      <h3 className="font-bold">{title}</h3>
                      <p className="mt-2 text-[13px] text-justify leading-6 text-slate-500">{copy}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className={`${marketingContainerClass} py-20 sm:py-28`}>
          <GuestReviews reviews={reviews} />
          <div className={reviews.length > 0 ? 'mt-20' : ''}>
            <MarketingEyebrow>Questions fréquentes</MarketingEyebrow>
            <div className="divide-y divide-slate-200 border-y border-slate-200">
              {content.faq.map(item => (
                <details key={item.question} className="group py-5">
                  <summary className="flex cursor-pointer list-none justify-between gap-5 text-sm font-bold text-slate-900">
                    {item.question}
                    <span aria-hidden="true" className="text-xl font-normal group-open:rotate-45">+</span>
                  </summary>
                  <p className="max-w-[760px] pt-4 text-[13px] text-justify leading-7 text-slate-500">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className={`${marketingContainerClass} pb-20 sm:pb-28`}>
          <div className="rounded-[28px] bg-slate-50 px-6 py-10 sm:px-10 sm:py-14 lg:flex lg:items-end lg:justify-between">
            <div>
              <MarketingEyebrow>Votre logement</MarketingEyebrow>
              <h2 className="text-[30px] font-bold tracking-[-0.04em] text-slate-900 sm:text-[38px]">
                Vous avez un logement à {city.name} ?
              </h2>
              <p className="mt-4 max-w-[620px] text-[13px] text-justify leading-7 text-slate-500">
                Parlons de votre logement, de son fonctionnement et du niveau de délégation dont vous avez besoin.
              </p>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-slate-700">
                <Link href="/concept">Découvrir notre approche</Link>
                <Link href="/logements">Voir les logements</Link>
              </div>
            </div>
            <div className="mt-8 lg:mt-0">
              <Link className={marketingPrimaryButtonClass} href={content.cta_href}>
                {content.cta_label}
              </Link>
              <p className="mt-3 text-center text-[10px] text-slate-500">Premier échange personnalisé</p>
            </div>
          </div>
        </section>
      </div>
    </MarketingShell>
  )
}
