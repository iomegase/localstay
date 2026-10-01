import Link from 'next/link'
import type { MarketingLodgingCard } from '@/features/lodging-showcase/queries/public-lodgings'
import { MarketingFaqSection } from '@/features/marketing/components/MarketingFaqSection'
import { MarketingHighlightCards } from '@/features/marketing/components/MarketingHighlightCards'
import { CompactLodgingCard } from '@/features/lodging-showcase/components/CompactLodgingCard'
import { GuidePhoneShowcase } from '@/features/marketing/components/GuidePhoneShowcase'
import {
  MarketingEyebrow,
  MarketingShell,
  marketingContainerClass,
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

/** H1 « Conciergerie à [Commune] » : la partie « à [Commune] » en serif italique, comme le hero de la home. */
function SerifCityHeading({ text }: { text: string }) {
  const index = text.indexOf(' à ')
  if (index === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, index)}{' '}
      {/* Trois lignes : « à » en retrait, puis la commune sans coupure sur ses tirets.
          Les espaces sont conservés : le texte lu reste « Conciergerie à [Commune] ». */}
      <span className="mt-1 block font-serif text-[0.64em] font-normal italic leading-[1.1] tracking-[-0.02em]">
        <span className="block pl-[0.9em]">à</span>{' '}
        <span className="block whitespace-nowrap">{text.slice(index + 3)}</span>
      </span>
    </>
  )
}

export function LocalConciergeLanding({
  landing,
  lodgings,
  reviews,
}: LocalConciergeLandingProps) {
  const { city, page: content } = landing
  const guidePath = publicDiscoveryCityPath(city.slug)
  const reassuranceItems = content.reassurance
    ?.split('·')
    .map(item => item.trim())
    .filter(Boolean) ?? []

  return (
    <MarketingShell>
      <div className="overflow-hidden font-sans text-slate-800">
        <section className={`${marketingContainerClass} pb-14 pt-8 sm:pb-20 sm:pt-14`}>
          <div
            data-testid="local-concierge-hero"
            className="rounded-[28px] px-6 py-10 sm:px-10 sm:py-14 lg:grid lg:min-h-[620px] lg:grid-cols-[1.05fr_.95fr] lg:items-stretch lg:gap-16 lg:px-14"
          >
            <div className="flex flex-col justify-center">
              <MarketingEyebrow>{content.eyebrow}</MarketingEyebrow>
              <h1 className="break-words text-[39px] font-bold leading-[1] tracking-[-0.055em] text-slate-900 sm:text-[56px] lg:text-[62px]">
                <SerifCityHeading text={content.h1} />
              </h1>
            </div>
            <div className="mt-8 flex flex-col justify-center lg:mt-0">
              <h2 className="text-[25px] font-bold leading-tight tracking-[-0.035em] text-slate-900 sm:text-[30px]">
                {content.hero_title}
              </h2>
              <p className="mt-5 text-[14px] leading-7 text-slate-600">
                {content.hero_copy}
              </p>
              <Link className={`${marketingPrimaryButtonClass} mt-7 self-start`} href={content.cta_href}>
                {content.cta_label}
              </Link>
              {reassuranceItems.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {reassuranceItems.map(item => (
                    <span
                      key={item}
                      className="inline-flex rounded-full bg-white px-3 py-2 text-[10px] font-semibold leading-none text-slate-600 shadow-sm"
                    >
                      {item}
                    </span>
                  ))}
                </div>
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
                Voir les logements
              </Link>
            </div>
            {/* Cartes compactes de la page séminaires (spec 046 AC-01-04 / spec 051). */}
            <ul className="mt-9 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {lodgings.slice(0, 3).map(lodging => (
                <li key={lodging.id} className="min-w-0">
                  <CompactLodgingCard
                    lodging={{
                      title: lodging.title,
                      href: lodging.href,
                      cityName: lodging.city_name,
                      surfaceM2: lodging.surface_m2,
                      maxGuests: lodging.max_guests,
                      photo: lodging.cover_photo_url ? { url: lodging.cover_photo_url, alt: lodging.title } : null,
                    }}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className={`${marketingContainerClass} pb-20 sm:pb-28`}>
          <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
            <div className="flex flex-col justify-center">
              <MarketingEyebrow>Pour le propriétaire</MarketingEyebrow>
              <h2 className="text-[32px] font-bold leading-tight tracking-[-0.04em] text-slate-900 sm:text-[42px]">
                {content.section_title}
              </h2>
              <p className="mt-6 text-[13px] text-justify leading-7 text-slate-500">{content.section_copy}</p>
            </div>
            <div className="flex flex-col justify-center">
              <h2 className="text-[28px] font-bold text-slate-900">Nous prenons soin de votre location</h2>
              <MarketingHighlightCards items={content.highlights} className="mt-7" />
            </div>
          </div>
        </section>

        <section className={`${marketingContainerClass} grid gap-12 py-20 sm:py-28 lg:grid-cols-[1fr_.8fr] lg:items-center`}>
          <div>
            <MarketingEyebrow>Le guide MyStay</MarketingEyebrow>
            <h2 className="text-[32px] font-bold leading-tight tracking-[-0.04em] text-slate-900 sm:text-[42px]">
              Moins de questions, plus de bons avis.
            </h2>
            <p className="mt-6 text-[13px] text-justify leading-7 text-slate-500">
              Chaque logement a son guide personnalisé : vos voyageurs y trouvent l’arrivée, le Wi-Fi, les équipements, les consignes et nos recommandations autour de {city.name}. Ils sont autonomes, et votre logement est mieux respecté.
            </p>
            <ul className="mt-7 flex flex-wrap gap-2">
              {['Arrivée plus fluide', 'Informations toujours accessibles'].map(benefit => (
                <li
                  key={benefit}
                  data-testid="guide-benefit-pill"
                  className="inline-flex rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[11px] font-semibold leading-none text-slate-700"
                >
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
          <GuidePhoneShowcase className="flex" alt="Aperçu du guide voyageur MyStay sur téléphone" />
        </section>

        <section
          data-testid="local-concierge-place"
          className="bg-[radial-gradient(circle_at_10%_105%,rgba(219,39,119,0.14),transparent_31%)] bg-slate-800 py-16 text-white sm:py-24"
        >
          <div className={`${marketingContainerClass} grid gap-12 lg:grid-cols-2 lg:items-center`}>
            <div className="flex flex-col justify-center">
              <MarketingEyebrow light>Sur place</MarketingEyebrow>
              {/* <MapPin className="mb-5 h-7 w-7 text-pink-600" aria-hidden="true" /> */}
              <h2 className="text-[32px] font-bold tracking-[-0.04em] text-white sm:text-[40px]">
                {content.local_title}
              </h2>
              <p className="mt-6 text-[13px] text-justify leading-7 text-slate-300">{content.local_copy}</p>
              <Link className="mt-6 inline-flex text-xs font-bold text-pink-300 hover:text-white" href={guidePath}>
                Découvrir {city.name} 
              </Link>
            </div>
            <div className="flex flex-col justify-center">
              <MarketingEyebrow light>Notre fonctionnement</MarketingEyebrow>
              {content.process_title && (
                <h2 className="text-[30px] font-bold tracking-[-0.04em] text-white">
                  {content.process_title}
                </h2>
              )}
              <ol className="mt-6 divide-y divide-white/15 border-y border-white/15">
                {content.steps.map(({ title, copy }, index) => (
                  <li key={title} className="grid grid-cols-[32px_1fr] gap-4 py-5">
                    <span className="text-xs font-bold text-pink-400">0{index + 1}</span>
                    <div>
                      <h3 className="font-bold text-white">{title}</h3>
                      <p className="mt-2 text-[13px] text-justify leading-6 text-slate-400">{copy}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {reviews.length > 0 && (
          <section className={`${marketingContainerClass} pt-20 sm:pt-28`}>
            <GuestReviews reviews={reviews} />
          </section>
        )}

        <MarketingFaqSection items={content.faq} columns={2} />

        <section className={`${marketingContainerClass} pb-20 sm:pb-28`}>
          <div className="rounded-[28px] bg-slate-50 px-6 py-10 sm:px-10 sm:py-14 lg:flex lg:items-center lg:justify-between lg:gap-12">
            <div>
              <MarketingEyebrow>Votre logement</MarketingEyebrow>
              <h2 className="text-[30px] font-bold tracking-[-0.04em] text-slate-900 sm:text-[38px]">
                Vous avez un logement à {city.name} ?
              </h2>
              <p className="mt-4 max-w-[620px] text-[13px] text-justify leading-7 text-slate-500">
                Parlons de votre logement et de ce que vous souhaitez déléguer. Premier échange sans engagement.
              </p>
            </div>
            <div className="mt-8 shrink-0 lg:mt-0">
              <Link className={`${marketingPrimaryButtonClass} whitespace-nowrap`} href={content.cta_href}>
                {content.cta_label}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </MarketingShell>
  )
}
