import Image from 'next/image'
import Link from 'next/link'
import {
  BedDouble,
  CarFront,
  ClipboardCheck,
  Flower2,
  Heart,
  MessagesSquare,
  Smartphone,
  Sparkles,
} from 'lucide-react'
import type { MarketingLodgingCard } from '@/features/lodging-showcase/queries/public-lodgings'
import { GuideDemoLauncher } from '@/features/guide-demo/components/GuideDemoLauncher'
import { MarketingPropertyCard } from './MarketingPropertyCard'
import {
  MarketingEyebrow,
  MarketingShell,
  marketingContainerClass,
  marketingDarkButtonClass,
  marketingPrimaryButtonClass,
} from './MarketingShell'

const serviceHighlights = [
  {
    icon: Sparkles,
    label: 'Mise en valeur',
    copy: 'Une présentation soignée pour mieux révéler votre bien.',
  },
  {
    icon: MessagesSquare,
    label: 'Gestion voyageurs',
    copy: 'Des échanges suivis, de la réservation au départ.',
  },
  {
    icon: BedDouble,
    label: 'Ménage & linge',
    copy: 'Un logement impeccable avant chaque arrivée.',
  },
  {
    icon: ClipboardCheck,
    label: 'Suivi du logement',
    copy: 'Contrôles et interventions coordonnés localement.',
  },
  {
    icon: Smartphone,
    label: 'Guide MyStay',
    copy: 'Les bonnes informations accessibles au bon moment.',
  },
] as const

const conciergeServices = [
  {
    number: '01',
    title: 'Valorisation & diffusion',
    copy: 'Présentation du logement, annonce soignée, calendrier et suivi des réservations : chaque détail contribue à mieux louer.',
  },
  {
    number: '02',
    title: 'Accueil des voyageurs',
    copy: 'Nous répondons aux voyageurs, préparons leur arrivée et restons leur interlocuteur tout au long du séjour.',
  },
  {
    number: '03',
    title: 'Intendance du logement',
    copy: 'Ménage, linge, contrôle et coordination des interventions : votre bien est suivi entre chaque séjour.',
  },
] as const

const guideSteps = [
  {
    icon: CarFront,
    label: 'Accès & arrivée',
    title: 'Une arrivée déjà préparée',
    copy: 'Le voyageur retrouve en un seul lien les accès, les horaires et toutes les informations utiles avant même de prendre la route.',
  },
  {
    icon: Heart,
    label: 'Séjour & découvertes',
    title: 'Le bon conseil, au bon moment',
    copy: 'Équipements, bonnes adresses et recommandations locales restent accessibles à tout moment, sans application à télécharger.',
  },
  {
    icon: Flower2,
    label: 'Sérénité propriétaire',
    title: 'Moins de questions, plus de sérénité',
    copy: 'Les demandes répétitives diminuent, l’accueil gagne en cohérence et nous restons disponibles pour les besoins qui comptent vraiment.',
  },
] as const

export function MarketingHome({ lodgings }: { lodgings: MarketingLodgingCard[] }) {
  return (
    <MarketingShell>
      <section
        data-testid="editorial-hero-shell"
        className={`${marketingContainerClass} relative mt-0 overflow-hidden sm:mt-8 sm:rounded-[30px] xl:mt-0 xl:max-w-[944px]`}
      >
        <div
          data-testid="editorial-hero"
          className="relative min-h-[720px] overflow-hidden rounded-[26px] bg-slate-800 min-[431px]:min-h-[690px] min-[761px]:min-h-[590px] min-[761px]:rounded-[32px] min-[1051px]:min-h-[700px] xl:min-h-[560px] xl:rounded-[26px]"
        >
          <Image
            src="/marketing/hero-chalet.png"
            alt="Chalet MyStay face aux montagnes"
            fill
            priority
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 1180px"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/72 to-slate-900/15 sm:via-slate-900/60" />
          <div
            data-testid="editorial-hero-content"
            className="relative z-10 flex min-h-[720px] flex-col px-9 pb-14 pt-16 text-white min-[431px]:min-h-[690px] min-[761px]:min-h-[590px] min-[761px]:px-[46px] min-[761px]:pb-[54px] min-[761px]:pt-[76px] min-[1051px]:min-h-[700px] min-[1051px]:px-16 xl:min-h-[560px] xl:px-[52px] xl:pb-[43px] xl:pt-[60px]"
          >
            <div className="max-w-[745px] xl:max-w-[600px] xl:[&>span:first-child]:mb-[19px]">
              <MarketingEyebrow light>Conciergerie en Haute-Savoie</MarketingEyebrow>
              <h1 className="max-w-[690px] text-[43px] font-bold leading-[0.99] tracking-[-0.055em] sm:text-5xl lg:text-[50px] xl:max-w-[600px] xl:text-[50px]">
                Votre logement, géré avec soin.
                <span className="mt-1 block font-medium">Vos voyageurs, accueillis autrement.</span>
              </h1>
              <p className="mt-6 max-w-[560px] text-[15px] leading-[1.65] text-slate-200 xl:max-w-[450px] xl:text-[14px] xl:leading-[1.6]">
                MyStay accompagne les propriétaires dans la gestion de leur location saisonnière,
                de la mise en valeur du bien jusqu’au départ des voyageurs.
              </p>
              <div className="mt-7 flex flex-col items-start gap-4 sm:flex-row sm:items-center xl:mt-[30px] xl:gap-[22px]">
                <Link
                  href="/confier-mon-logement"
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 text-xs font-bold text-slate-800 transition-colors hover:bg-pink-600 hover:text-white xl:min-h-[42px]"
                >
                  Confier mon logement
                </Link>
                <a
                  href="#services"
                  className="inline-flex items-center gap-[14px] border-b border-white/60 pb-[5px] text-[13px] font-bold text-white hover:border-pink-500 hover:text-pink-200 xl:gap-[11px] xl:pb-1 xl:text-[11px]"
                >
                  Découvrir nos services <span aria-hidden="true">↓</span>
                </a>
              </div>
            </div>
            <div className="mt-auto flex flex-col items-start gap-3 pt-[30px] text-[11px] font-bold uppercase tracking-[0.04em] text-slate-200 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-[34px] xl:gap-x-[27px] xl:pt-8 xl:text-[9px]">
              {['Gestion complète', 'Présence locale', 'Guide digital inclus'].map(item => (
                <span key={item} className="flex items-center gap-2 xl:gap-1.5">
                  <b className="grid h-5 w-5 place-items-center rounded-full border border-white/50 text-[9px] xl:h-[17px] xl:w-[17px] xl:text-[8px]">
                    ✓
                  </b>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        className={`${marketingContainerClass} pb-16 pt-24 sm:pb-24 sm:pt-28 xl:pb-0 xl:pt-[88px]`}
      >
        <div
          data-testid="editorial-intro-copy"
          className="max-w-2xl xl:max-w-[744px] xl:px-6"
        >
          <MarketingEyebrow>La conciergerie MyStay</MarketingEyebrow>
          <h2 className="text-3xl font-bold leading-[1.08] tracking-[-0.05em] sm:text-[44px] xl:max-w-[660px] xl:text-[40px] xl:leading-[1.02]">
            Votre bien mérite plus qu’une simple remise de clés.
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-slate-500 xl:max-w-[560px] xl:text-[13px] xl:leading-[1.7]">
            Nous prenons soin du logement, de son image et de chaque voyageur. Notre accompagnement
            associe une présence humaine locale à des outils simples, pensés pour fluidifier le
            séjour.
          </p>
        </div>

        <div
          data-testid="editorial-highlight-grid"
          className="mt-12 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:mt-[88px] xl:grid-cols-[1.05fr_repeat(2,minmax(0,0.78fr))] xl:grid-rows-[repeat(2,minmax(205px,auto))] xl:gap-[14px]"
        >
          {serviceHighlights.map(({ icon: Icon, label, copy }, index) => (
            <article
              key={label}
              data-testid={`editorial-highlight-${index}`}
              className={`relative flex min-h-[205px] flex-col overflow-hidden rounded-[24px] bg-gradient-to-br from-slate-50 to-pink-50/40 p-6 xl:min-h-[205px] xl:rounded-[22px] xl:px-6 xl:py-[22px] ${
                index === 0
                  ? 'row-span-2 xl:col-start-1 xl:row-start-1 xl:row-span-1'
                  : ''
              }`}
            >
              <span
                aria-hidden="true"
                className="absolute left-6 top-0 h-[3px] w-[50px] rounded-b-full bg-pink-600"
              />
              <span className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white xl:h-11 xl:w-11 xl:rounded-[14px]">
                <Icon
                  aria-hidden="true"
                  className="h-[18px] w-[18px] xl:h-[22px] xl:w-[22px]"
                  strokeWidth={1.7}
                />
              </span>
              <h3
                className={`mt-7 font-bold tracking-[-0.035em] xl:mt-5 xl:leading-[1.18] ${
                  index === 0 ? 'text-lg xl:text-[26px]' : 'text-lg xl:text-[17px]'
                }`}
              >
                {label}
              </h3>
              <p
                className={`mt-3 text-xs leading-5 text-slate-500 xl:mt-[13px] xl:text-[12px] ${
                  index === 0 ? 'xl:max-w-[220px]' : 'xl:max-w-[265px]'
                }`}
              >
                {copy}
              </p>
            </article>
          ))}
          <div className="col-span-2 mt-5 flex items-center justify-center lg:col-span-3 xl:col-span-1 xl:col-start-1 xl:row-start-2 xl:mt-0">
            <Link href="/concept" className={marketingDarkButtonClass}>
              Comprendre notre approche <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section
        id="services"
        data-testid="editorial-services"
        className={`${marketingContainerClass} pb-20 pt-10 sm:pb-28 sm:pt-16 xl:pb-[42px] xl:pt-[82px]`}
      >
        <div className="max-w-2xl xl:mb-[42px] xl:max-w-[656px]">
          <MarketingEyebrow>Nos services</MarketingEyebrow>
          <h2 className="text-3xl font-bold leading-[1.05] tracking-[-0.05em] sm:text-[44px] xl:text-[40px] xl:leading-[1.02]">
            Une gestion attentive, avant, pendant et après chaque séjour.
          </h2>
          <p className="mt-5 text-sm leading-7 text-slate-500 xl:max-w-[560px] xl:text-[13px] xl:leading-[1.7]">
            Nous adaptons notre accompagnement à votre logement, à vos priorités et au niveau de
            délégation que vous recherchez.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:mt-0 xl:gap-[14px]">
          {conciergeServices.map((service, index) => (
            <article
              key={service.number}
              data-testid={`editorial-service-${service.number}`}
              className={`relative flex min-h-[210px] flex-col overflow-hidden rounded-[24px] bg-gradient-to-br from-slate-50 to-pink-50/40 p-6 xl:min-h-[198px] xl:rounded-[20px] xl:px-6 xl:pb-6 xl:pt-[27px] ${
                index === 2 ? 'col-span-2 lg:col-span-1' : ''
              }`}
            >
              <span
                aria-hidden="true"
                className="absolute left-6 top-0 h-[3px] w-11 rounded-b-full bg-pink-600"
              />
              <div className="grid grid-cols-[45px_minmax(0,1fr)] items-end gap-3">
                <span className="text-[44px] font-bold leading-[0.9] tracking-[-0.07em] text-slate-400">
                  {service.number}
                </span>
                <h3 className="text-base font-medium xl:text-[18px] xl:leading-[1.08]">
                  {service.title}
                </h3>
              </div>
              <p className="mt-auto pt-10 text-xs leading-5 text-slate-500 xl:pt-6 xl:text-[12px] xl:leading-[1.62]">
                {service.copy}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        className={`${marketingContainerClass} grid gap-10 pb-20 pt-10 sm:pb-28 lg:grid-cols-[0.8fr_1.7fr] lg:items-start xl:grid-cols-[0.7fr_1.8fr] xl:gap-[50px] xl:py-[88px]`}
      >
        <div className="xl:sticky xl:top-7">
          <MarketingEyebrow>Les logements confiés à MyStay</MarketingEyebrow>
          <h2 className="text-3xl font-bold leading-[1.04] tracking-[-0.05em] sm:text-[44px] xl:text-[40px] xl:leading-[1.02]">
            Des lieux que nous gérons comme s’ils étaient les nôtres.
          </h2>
          <p className="mt-5 text-sm leading-7 text-slate-500 xl:max-w-[560px] xl:text-[13px] xl:leading-[1.7]">
            Découvrez une sélection de biens accompagnés par notre conciergerie. Chacun bénéficie
            d’un suivi dédié et de son propre guide d’arrivée MyStay.
          </p>
          <Link href="/logements" className={`${marketingDarkButtonClass} mt-7`}>
            Découvrir les logements <span aria-hidden="true">→</span>
          </Link>
        </div>
        {lodgings.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:gap-x-[18px] xl:gap-y-[22px] xl:pt-[26px]">
            {lodgings.slice(0, 2).map(lodging => (
              <MarketingPropertyCard
                key={lodging.id}
                lodging={lodging}
                priority
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[26px] border border-dashed border-slate-300 bg-slate-50 p-8 text-sm leading-7 text-slate-500">
            Aucun logement public n’est encore disponible. Revenez bientôt pour découvrir les
            nouvelles adresses MyStay.
          </div>
        )}
      </section>

      <section
        data-testid="editorial-process"
        className={`${marketingContainerClass} pb-20 pt-10 sm:pb-28 xl:pb-[88px] xl:pt-8`}
      >
        <div className="max-w-2xl xl:mb-[42px] xl:max-w-[608px]">
          <MarketingEyebrow>Notre différence</MarketingEyebrow>
          <h2 className="text-3xl font-bold leading-[1.05] tracking-[-0.05em] sm:text-[44px] xl:text-[40px] xl:leading-[1.02]">
            Le guide MyStay prolonge notre accueil, même à distance.
          </h2>
          <p className="mt-5 text-sm leading-7 text-slate-500 xl:max-w-[560px] xl:text-[13px] xl:leading-[1.7]">
            Créé pour les logements que nous gérons, il rassemble les informations pratiques et
            les meilleures recommandations dans une expérience mobile simple et élégante.
          </p>
          <GuideDemoLauncher />
        </div>
        <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:mt-0 xl:gap-[14px]">
          {guideSteps.map(({ icon: Icon, label, title, copy }, index) => (
            <article
              key={label}
              data-testid={`editorial-process-card-${index}`}
              className={`relative flex min-h-[260px] flex-col overflow-hidden rounded-[24px] bg-gradient-to-br from-slate-50 to-pink-50/40 p-6 xl:min-h-[234px] xl:rounded-[22px] xl:px-6 xl:pb-6 xl:pt-[26px] ${
                index === 2 ? 'col-span-2 lg:col-span-1' : ''
              }`}
            >
              <span
                aria-hidden="true"
                className="absolute left-6 top-0 h-[3px] w-[50px] rounded-b-full bg-pink-600"
              />
              <div className="flex items-center gap-4 xl:gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white xl:h-11 xl:w-11 xl:rounded-[14px]">
                  <Icon
                    aria-hidden="true"
                    className="h-[18px] w-[18px] xl:h-[22px] xl:w-[22px]"
                    strokeWidth={1.7}
                  />
                </span>
                <span className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-pink-600 xl:text-[9px]">
                  {label}
                </span>
              </div>
              <h3 className="mt-auto pt-8 text-base font-bold xl:text-[17px] xl:leading-[1.18]">
                {title}
              </h3>
              <p className="mt-4 text-xs leading-6 text-slate-500 xl:mt-[13px] xl:max-w-[265px] xl:text-[12px]">
                {copy}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className={`${marketingContainerClass} pb-20 sm:pb-28 xl:pb-5`}>
        <div
          data-testid="editorial-cta"
          className="grid gap-9 rounded-[28px] bg-gradient-to-r from-[#30253f] to-slate-800 px-6 py-12 text-white sm:px-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center xl:gap-16 xl:rounded-[24px] xl:px-[52px] xl:py-[53px]"
        >
          <div>
            <MarketingEyebrow light>Votre projet</MarketingEyebrow>
            <h2 className="text-4xl font-bold leading-[1.02] tracking-[-0.05em] xl:text-[40px] xl:leading-[1.03]">
              Confiez-nous votre logement.
              <br />
              Gardez l’esprit libre.
            </h2>
          </div>
          <div>
            <p className="max-w-md text-sm leading-7 text-slate-300 xl:max-w-[345px] xl:text-[13px] xl:leading-[1.7]">
              Parlons de votre bien, de vos attentes et de la manière dont MyStay peut vous
              accompagner au quotidien.
            </p>
            <Link href="/confier-mon-logement" className={`${marketingPrimaryButtonClass} mt-6`}>
              Échanger sur mon projet
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
