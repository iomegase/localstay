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
            src="/marketing/hero-chalet-v2.png"
            alt="Chalet MyStay face aux montagnes"
            fill
            priority
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 1180px"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-black/60" />
          <div
            data-testid="editorial-hero-content"
            className="relative z-10 flex min-h-[720px] flex-col px-9 pb-14 pt-16 text-white min-[431px]:min-h-[690px] min-[761px]:min-h-[590px] min-[761px]:px-[46px] min-[761px]:pb-[54px] min-[761px]:pt-[76px] min-[1051px]:min-h-[700px] min-[1051px]:px-16 xl:min-h-[560px] xl:px-[52px] xl:pb-[43px] xl:pt-[60px]"
          >
      <div className="max-w-[745px] xl:max-w-[600px] xl:[&>span:first-child]:mb-[19px]">
        <MarketingEyebrow light>
          Conciergerie en Haute-Savoie
        </MarketingEyebrow>

        <h1 className="max-w-[690px] text-[43px] font-bold leading-[1.08] tracking-[-0.055em] sm:text-5xl lg:text-[50px] xl:max-w-[600px] xl:text-[50px]">
          Votre logement,
          <br />
          géré avec soin.

          <span className="mt-4 block font-serif font-normal italic tracking-[-0.02em]">
            Vos voyageurs,
            <br />
            accueillis autrement.
          </span>
        </h1>

        <p className="mt-6 max-w-[560px] text-[15px] leading-[1.65] text-slate-200 xl:max-w-[450px] xl:text-[14px] xl:leading-[1.6]">
          MyStay accompagne les propriétaires dans la gestion de leur
          location saisonnière, de la mise en valeur du bien jusqu’au départ
          des voyageurs.
        </p>

        <div className="mt-7 flex items-start xl:mt-[30px]">
          <Link
            href="/confier-mon-logement"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 text-xs font-bold text-slate-800 transition-colors hover:bg-pink-600 hover:text-white xl:min-h-[42px]"
          >
            Confier mon logement
          </Link>
        </div>
      </div>
          </div>
        </div>
      </section>

<section
  className={`${marketingContainerClass} pb-16 pt-24 sm:pb-24 sm:pt-28 xl:pb-20 xl:pt-[88px]`}
>
  <div
    data-testid="editorial-intro-copy"
    className="max-w-2xl xl:max-w-[744px] xl:px-6"
  >
    <MarketingEyebrow>La conciergerie MyStay</MarketingEyebrow>

    <h2 className="text-3xl font-bold leading-[1.2] tracking-[-0.05em] sm:text-[44px] xl:max-w-[660px] xl:text-[40px] xl:leading-[1.1]">
      Votre bien mérite plus qu’une
      <br className="hidden sm:block" /> simple remise de clés.
    </h2>

    <p className="mt-7 max-w-xl text-sm leading-7 text-slate-500 xl:mt-8 xl:max-w-[600px] xl:text-[13px] xl:leading-[1.7]">
      Nous prenons soin du logement, de son image et de chaque voyageur.
      Notre accompagnement associe une présence humaine locale à des outils
      simples, pensés pour fluidifier le séjour.
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
        className={`relative flex min-h-[205px] flex-col overflow-hidden rounded-[24px] bg-[radial-gradient(circle_at_100%_0,rgba(219,39,119,0.055),transparent_34%)] bg-[#f7f6f4] p-6 xl:min-h-[205px] xl:rounded-[22px] xl:px-6 xl:py-[22px] ${
          index === 0 ? 'lg:row-span-2 xl:col-start-1 xl:row-start-1 xl:row-span-1' : ''
        } ${index === serviceHighlights.length - 1 ? 'col-span-2 lg:col-span-1' : ''}`}
      >
        <span
          aria-hidden="true"
          className="absolute left-6 top-0 h-[3px] w-[50px] rounded-b-full bg-pink-600"
        />
        <div className="flex items-center gap-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white xl:h-11 xl:w-11 xl:rounded-[14px]">
            <Icon
              aria-hidden="true"
              className="h-[18px] w-[18px] xl:h-[22px] xl:w-[22px]"
              strokeWidth={1.7}
            />
          </span>
          <h3
            className={`font-bold tracking-[-0.035em] xl:leading-[1.18] ${
              index === 0 ? 'text-lg xl:text-[26px]' : 'text-lg xl:text-[17px]'
            }`}
          >
            {label}
          </h3>
        </div>
        <p
          className={`mt-3 text-xs leading-5 text-slate-500 xl:mt-[13px] xl:text-[12px] ${
            index === 0 ? 'xl:max-w-[220px]' : 'xl:max-w-[265px]'
          }`}
        >
          {copy}
        </p>
      </article>
    ))}
    <div className="col-span-2 mt-5 hidden items-center justify-center lg:col-span-3 lg:flex xl:col-span-1 xl:col-start-1 xl:row-start-2 xl:mt-0">
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
          <h2 className="text-3xl font-bold leading-[1.2] tracking-[-0.05em] sm:text-[44px] xl:text-[40px] xl:leading-[1.1]">
            Une gestion attentive, avant, pendant et après chaque séjour.
          </h2>
          <p className="mt-7 text-sm leading-7 text-slate-500 xl:mt-8 xl:max-w-[560px] xl:text-[13px] xl:leading-[1.7]">
            Nous adaptons notre accompagnement à votre logement, à vos priorités et au niveau de
            délégation que vous recherchez.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:mt-0 xl:gap-[14px]">
          {conciergeServices.map((service, index) => (
            <article
              key={service.number}
              data-testid={`editorial-service-${service.number}`}
              className={`relative flex min-h-[210px] flex-col overflow-hidden rounded-[24px] bg-[radial-gradient(circle_at_100%_0,rgba(219,39,119,0.055),transparent_34%)] bg-[#f7f6f4] p-6 xl:min-h-[198px] xl:rounded-[20px] xl:px-6 xl:pb-6 xl:pt-[27px] ${
                index === 2 ? 'col-span-2 lg:col-span-1' : ''
              }`}
            >
              <span
                aria-hidden="true"
                className="absolute left-6 top-0 h-[3px] w-11 rounded-b-full bg-pink-600"
              />
              <div className="flex items-center gap-4">
                <span className="text-[44px] font-bold leading-[0.9] tracking-[-0.07em] text-slate-400">
                  {service.number}
                </span>
                <h3 className="text-base font-semibold xl:text-[18px] xl:leading-[1.08]">
                  {service.title}
                </h3>
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-500 xl:mt-4 xl:text-[12px] xl:leading-[1.62]">
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
          <MarketingEyebrow>
            <span className="whitespace-nowrap">Les logements confiés à MyStay</span>
          </MarketingEyebrow>
          <h2 className="text-3xl font-bold leading-[1.2] tracking-[-0.05em] sm:text-[44px] xl:text-[40px] xl:leading-[1.1]">
            Des lieux que nous gérons comme s’ils étaient les nôtres.
          </h2>
          <p className="mt-7 text-sm leading-7 text-slate-500 xl:mt-8 xl:max-w-[560px] xl:text-[13px] xl:leading-[1.7]">
            Découvrez une sélection de biens accompagnés par notre conciergerie. Chacun bénéficie
            d’un suivi dédié et de son propre guide d’arrivée MyStay.
          </p>
          <Link href="/logements" className={`${marketingDarkButtonClass} mt-7`}>
            Découvrir les logements <span aria-hidden="true">→</span>
          </Link>
        </div>
        {lodgings.length > 0 ? (
          <div className="no-scrollbar -mx-6 -my-8 flex min-w-0 snap-x snap-mandatory gap-5 overflow-x-auto px-6 py-8 lg:mx-0 lg:my-0 lg:grid lg:snap-none lg:grid-cols-2 lg:overflow-visible lg:px-0 lg:py-0 lg:pt-8 xl:gap-x-[18px] xl:gap-y-[22px] xl:pt-[64px]">
            {lodgings.map((lodging, index) => (
              <div key={lodging.id} className="w-[280px] shrink-0 snap-start lg:w-auto">
                <MarketingPropertyCard lodging={lodging} priority={index < 2} />
              </div>
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
          <h2 className="text-3xl font-bold leading-[1.2] tracking-[-0.05em] sm:text-[44px] xl:text-[40px] xl:leading-[1.1]">
            Le guide MyStay prolonge notre accueil, même à distance.
          </h2>
          <p className="mt-7 text-sm leading-7 text-slate-500 xl:mt-8 xl:max-w-[560px] xl:text-[13px] xl:leading-[1.7]">
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
              className={`relative flex min-h-[260px] flex-col overflow-hidden rounded-[24px] bg-[radial-gradient(circle_at_100%_0,rgba(219,39,119,0.055),transparent_34%)] bg-[#f7f6f4] p-6 xl:min-h-[234px] xl:rounded-[22px] xl:px-6 xl:pb-6 xl:pt-[26px] ${
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
              <h3 className="mt-6 text-base font-semibold xl:mt-7 xl:text-[17px] xl:leading-[1.18]">
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
            <h2 className="text-4xl font-bold leading-[1.12] tracking-[-0.05em] xl:text-[40px] xl:leading-[1.03]">
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
