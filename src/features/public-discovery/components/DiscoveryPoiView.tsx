import Link from 'next/link'
import { MarkdownText } from '@/shared/components/MarkdownText'
import { ArrowLeft, ChevronRight, Clock3, ExternalLink, MapPin, Navigation, Phone, Star } from 'lucide-react'
import { MiniMap } from '@/features/categories/components/MiniMap'
import {
  MarketingEyebrow,
  MarketingShell,
  marketingContainerClass,
  marketingPrimaryButtonClass,
} from '@/features/marketing/components/MarketingShell'
import type { DiscoveryPoiDetail } from '../types'
import { buildDiscoveryDirectionsHref } from '../lib/directions'
import { RemotePoiImage } from './RemotePoiImage'

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'] as const
const decimalFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })

export function DiscoveryPoiView({ poi }: { poi: DiscoveryPoiDetail }) {
  const categoryPath = `/decouvrir/${poi.city.slug}/${poi.category.slug}`
  const hourEntries = poi.hours ? Object.entries(poi.hours) : []

  return (
    <MarketingShell>
      <article className="overflow-hidden text-slate-800">
        <nav aria-label="Fil d’Ariane" className={`${marketingContainerClass} flex flex-wrap items-center gap-2 pt-9 text-[11px] font-semibold text-slate-500`}>
          <Link className="hover:text-pink-600" href="/">Accueil</Link>
          <ChevronRight aria-hidden="true" className="h-3 w-3" />
          <Link className="hover:text-pink-600" href={`/decouvrir/${poi.city.slug}`}>{poi.city.name}</Link>
          <ChevronRight aria-hidden="true" className="h-3 w-3" />
          <Link className="hover:text-pink-600" href={categoryPath}>{poi.category.name}</Link>
          <ChevronRight aria-hidden="true" className="h-3 w-3" />
          <span aria-current="page" className="text-slate-800">{poi.name}</span>
        </nav>

        <div className={`${marketingContainerClass} pt-9`}>
          <Link className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-500 hover:text-pink-600" href={categoryPath}>
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Retour à la sélection
          </Link>
          <div className="relative mt-7 aspect-[4/3] overflow-hidden rounded-[26px] bg-slate-100 shadow-[0_18px_50px_rgba(15,23,42,0.14)] sm:aspect-[16/9] lg:max-h-[570px]">
            <RemotePoiImage
              src={poi.hero_photo_url}
              alt={poi.photo_is_fallback
                ? `Illustration : ${poi.subcategory?.name ?? poi.category.name}`
                : `${poi.name} à ${poi.city.name}`}
              width={1200}
              height={900}
              loading="eager"
              fetchPriority="high"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>

        <div className={`${marketingContainerClass} grid gap-12 py-14 sm:py-16 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)] lg:gap-16`}>
          <div className="min-w-0">
            <MarketingEyebrow>{poi.subcategory?.name ?? poi.category.name}</MarketingEyebrow>
            <h1 className="text-[42px] font-semibold leading-[0.98] tracking-[-0.055em] text-slate-900 sm:text-6xl">{poi.name}</h1>
            <MarkdownText
              source={poi.description}
              breaks
              headingLevel={2}
              className="mt-7 text-base leading-8 text-slate-600 [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:normal-case [&_h2]:tracking-[-0.02em] [&_h2]:text-slate-900 [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:normal-case [&_h3]:text-slate-900 [&_p]:mb-4 [&_p]:text-base [&_p]:leading-8 [&_p]:text-slate-600"
            />
            {/* Spec 094 AC-04 : d'où viennent les informations de la description. */}
            {poi.description_sources?.length ? (
              <p data-testid="poi-description-sources" className="mt-3 text-xs leading-6 text-slate-500">
                Sources :{' '}
                {poi.description_sources.map((source, index) => (
                  <span key={source.url}>
                    {index > 0 ? ' · ' : null}
                    <a href={source.url} target="_blank" rel="nofollow noopener noreferrer" className="underline decoration-slate-300 underline-offset-2 hover:text-slate-700">
                      {source.title}
                    </a>
                  </span>
                ))}
              </p>
            ) : null}
            {/* PO 2026-10-08 : randonnée → un crédit par auteur, lien vers la page source. */}
            {poi.trail_photo_credits?.length ? (
              <p data-testid="poi-trail-photo-credits" className="mt-3 text-xs leading-6 text-slate-500">
                Crédits photos :{' '}
                {poi.trail_photo_credits.map((credit, index) => (
                  <span key={credit.attribution}>
                    {index > 0 ? ' · ' : null}
                    {credit.url ? (
                      <a href={credit.url} target="_blank" rel="nofollow noopener noreferrer" className="underline decoration-slate-300 underline-offset-2 hover:text-pink-600">{credit.attribution}</a>
                    ) : credit.attribution}
                  </span>
                ))}
              </p>
            ) : poi.photo_credit ? (
              <p data-testid="poi-photo-credit" className="mt-3 text-xs leading-6 text-slate-500">
                Photos :{' '}
                {poi.photo_credit.website ? (
                  <a
                    href={poi.photo_credit.website}
                    target="_blank"
                    rel="nofollow noopener"
                    className="underline decoration-slate-300 underline-offset-2 hover:text-pink-600"
                  >
                    {poi.photo_credit.name}
                  </a>
                ) : poi.photo_credit.name}
              </p>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-3">
              {poi.phone ? (
                <a className={marketingPrimaryButtonClass} href={`tel:${poi.phone}`}>
                  <Phone aria-hidden="true" className="mr-2 h-4 w-4" /> Appeler
                </a>
              ) : null}
              <a className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 px-5 text-xs font-bold text-slate-800 transition-colors hover:border-pink-600 hover:text-pink-600" href={buildDiscoveryDirectionsHref(poi)} target="_blank" rel="noreferrer">
                <Navigation aria-hidden="true" className="mr-2 h-4 w-4" /> Itinéraire
              </a>
              {poi.website ? (
                <a className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 px-5 text-xs font-bold text-slate-800 transition-colors hover:border-pink-600 hover:text-pink-600" href={poi.website} target="_blank" rel="noreferrer">
                  <ExternalLink aria-hidden="true" className="mr-2 h-4 w-4" /> Site officiel
                </a>
              ) : null}
            </div>
          </div>

          <aside className="self-start rounded-[24px] bg-[#f7f6f4] p-6 sm:p-7">
            <dl className="grid gap-6">
              <div>
                <dt className="flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.16em] text-pink-600"><MapPin aria-hidden="true" className="h-4 w-4" />Adresse</dt>
                <dd className="mt-2 text-sm leading-6 text-slate-700">{poi.address}</dd>
              </div>
              {poi.rating !== null ? (
                <div>
                  <dt className="flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.16em] text-pink-600"><Star aria-hidden="true" className="h-4 w-4" />Note</dt>
                  <dd className="mt-2 text-sm text-slate-700">{decimalFormatter.format(poi.rating)} / 5{poi.rating_count !== null ? ` · ${poi.rating_count} avis` : ''}</dd>
                </div>
              ) : null}
              {hourEntries.length > 0 ? (
                <div>
                  <dt className="flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.16em] text-pink-600"><Clock3 aria-hidden="true" className="h-4 w-4" />Horaires</dt>
                  <dd className="mt-3">
                    <ul className="grid gap-2 text-xs text-slate-600">
                      {hourEntries.map(([day, hours]) => (
                        <li className="flex justify-between gap-4" key={day}>
                          <span>{DAY_NAMES[Number(day)]}</span>
                          <span className="font-semibold text-slate-800">{hours ? `${hours.open}–${hours.close}` : 'Fermé'}</span>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              ) : null}
            </dl>
            {/* PO 2026-10-08 : carte dans la colonne d'infos, sous les horaires. */}
            <section aria-label="Localiser cette adresse" className="mt-6 overflow-hidden rounded-[18px] bg-slate-100 [&>img]:aspect-square [&>img]:w-full">
              <MiniMap latitude={poi.latitude} longitude={poi.longitude} poiName={poi.name} width={640} height={640} zoom={17} />
            </section>
          </aside>
        </div>

        {/* Bloc final de la fiche : bouton rose centré verticalement (spec 041, PO 2026-10-02). */}
        <aside className={`${marketingContainerClass} mb-16 flex flex-col items-start gap-8 rounded-[28px] bg-slate-800 px-7 py-10 text-white sm:px-10 sm:py-12 lg:flex-row lg:items-center lg:justify-between`}>
          <div>
            <MarketingEyebrow light>Votre logement</MarketingEyebrow>
            <h2 className="max-w-2xl font-semibold leading-tight tracking-[-0.045em] text-2xl">Offrez ces recommandations à vos voyageurs.</h2>
          </div>
          <Link className={`${marketingPrimaryButtonClass} shrink-0 px-6`} href="/confier-mon-logement">Rejoindre MyStay</Link>
        </aside>
      </article>
    </MarketingShell>
  )
}
