import Link from 'next/link'
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
              alt={`${poi.name} à ${poi.city.name}`}
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
            <p className="mt-7 text-base leading-8 text-slate-600">{poi.description}</p>

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

          <aside className="rounded-[24px] bg-[#f7f6f4] p-6 sm:p-7">
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
          </aside>
        </div>

        <section className={`${marketingContainerClass} pb-16`} aria-labelledby="poi-map-title">
          <h2 id="poi-map-title" className="mb-6 text-3xl font-semibold tracking-[-0.045em] text-slate-900">Localiser cette adresse</h2>
          <div className="overflow-hidden rounded-[24px] bg-slate-100 [&>img]:aspect-[16/7] [&>img]:min-h-[260px]">
            <MiniMap latitude={poi.latitude} longitude={poi.longitude} poiName={poi.name} width={944} height={420} zoom={15} />
          </div>
        </section>

        <aside className={`${marketingContainerClass} mb-16 flex flex-col items-start gap-8 rounded-[28px] bg-slate-800 px-7 py-10 text-white sm:px-10 sm:py-12 lg:flex-row lg:items-end lg:justify-between`}>
          <div>
            <MarketingEyebrow light>Votre logement</MarketingEyebrow>
            <h2 className="max-w-2xl text-3xl font-semibold leading-tight tracking-[-0.045em] sm:text-4xl">Offrez cette expertise locale à vos voyageurs.</h2>
          </div>
          <Link className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-white px-6 text-xs font-bold text-slate-800 transition-colors hover:bg-pink-600 hover:text-white" href="/confier-mon-logement">Confier mon logement</Link>
        </aside>
      </article>
    </MarketingShell>
  )
}
