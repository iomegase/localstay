import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import {
  ArrowRight,
  BedDouble,
  Clock,
  MapPin,
  Mountain,
  Presentation,
  Users,
  Utensils,
} from 'lucide-react'
import {
  MarketingEyebrow,
  MarketingShell,
  marketingContainerClass,
  marketingPrimaryButtonClass,
} from '@/features/marketing/components/MarketingShell'

export const metadata: Metadata = {
  title: 'Séminaires en Haute-Savoie',
  description: 'MyStay organise des séminaires résidentiels à taille humaine entre lac et montagne.',
  alternates: { canonical: '/seminaires' },
}

const services = [
  {
    icon: BedDouble,
    title: 'Lieu & hébergement',
    copy: 'Des chalets chaleureux, sélectionnés selon la taille de votre équipe, le niveau de confort attendu et votre programme.',
  },
  {
    icon: Presentation,
    title: 'Temps de travail',
    copy: 'Des espaces adaptés aux échanges, ateliers et prises de parole, avec les équipements utiles préparés en amont.',
  },
  {
    icon: Utensils,
    title: 'Repas & attentions',
    copy: 'Petits-déjeuners, pauses, déjeuners ou dîner convivial : nous composons une expérience cohérente avec votre rythme.',
  },
  {
    icon: Mountain,
    title: 'Activités & mobilité',
    copy: 'Randonnée, bien-être, découverte locale ou activité collective : chaque respiration trouve naturellement sa place.',
  },
] as const

const placePrinciples = [
  {
    number: '01',
    title: 'Tout réunir au même endroit',
    copy: 'Hébergement, espaces de travail et moments informels se prolongent naturellement dans un lieu privatisé.',
  },
  {
    number: '02',
    title: 'Créer le bon rythme',
    copy: 'Des espaces pensés pour alterner concentration, échanges collectifs et temps de respiration.',
  },
  {
    number: '03',
    title: 'Ouvrir de nouvelles perspectives',
    copy: 'Entre lac et montagne, le décor offre le recul nécessaire pour faire émerger des idées nouvelles.',
  },
] as const

const formats = [
  {
    title: 'Comité de direction',
    copy: 'Un cadre confidentiel pour décider, prendre du recul et aligner les priorités dans un environnement propice aux échanges.',
  },
  {
    title: 'Séminaire résidentiel',
    copy: 'Travail, hébergement, restauration et moments partagés réunis dans un même lieu, au rythme de votre équipe.',
  },
  {
    title: 'Retraite d’équipe',
    copy: 'Quelques jours pour renouer les liens, prendre de la hauteur et faire émerger collectivement de nouvelles idées.',
  },
] as const

const steps = [
  {
    number: '01',
    title: 'Vous partagez votre brief',
    copy: 'Dates, participants, objectifs, budget et ambiance recherchée.',
  },
  {
    number: '02',
    title: 'Nous dessinons le séjour',
    copy: 'Lieu, hébergement, restauration, temps de travail et activités.',
  },
  {
    number: '03',
    title: 'Nous coordonnons chaque détail',
    copy: 'Un interlocuteur MyStay pilote les partenaires et la logistique.',
  },
  {
    number: '04',
    title: 'Votre équipe profite',
    copy: 'Le programme et les informations utiles restent accessibles simplement.',
  },
] as const

const contactHref =
  'mailto:bonjour@mystay.city?subject=Projet%20de%20s%C3%A9minaire%20MyStay'

export default function SeminarsPage() {
  return (
    <MarketingShell>
      <div className="overflow-hidden">
        <section className={`${marketingContainerClass} pt-0 sm:pt-8`}>
          <div
            data-testid="seminar-hero"
            className="relative flex min-h-[690px] flex-col overflow-hidden rounded-[26px] px-7 pb-8 pt-12 text-white min-[761px]:min-h-[590px] min-[761px]:rounded-[30px] min-[761px]:px-[54px] min-[761px]:pb-[42px] min-[761px]:pt-[58px]"
          >
            <Image
              alt="Chalet de séminaire MyStay en Haute-Savoie"
              className="object-cover object-[62%_center] lg:object-[center_48%]"
              fill
              priority
              sizes="(min-width: 1280px) 944px, (min-width: 768px) calc(100vw - 80px), 100vw"
              src="/marketing/hero-chalet-v2.png"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-black/60" />

            <div className="relative z-10 my-auto max-w-[650px]">
              <MarketingEyebrow light>Séminaires en Haute-Savoie</MarketingEyebrow>
              <h1 className="m-0 max-w-[640px] text-[clamp(42px,12vw,50px)] font-bold leading-[0.99] tracking-[-0.055em] lg:text-[clamp(42px,4.8vw,50px)]">
                Réunir vos équipes.
                <br />
                <em className="font-serif font-normal italic tracking-[-0.035em]">
                  Prendre de la hauteur.
                </em>
              </h1>
              <p className="mt-7 max-w-[590px] text-sm leading-[1.72] text-white/80 lg:text-[15px]">
                MyStay organise des séminaires résidentiels à taille humaine dans des lieux
                inspirants, entre lac et montagne. Un seul interlocuteur coordonne le séjour, du
                premier brief au départ de votre équipe.
              </p>
              <div className="mt-[30px] flex flex-col items-start gap-6 sm:flex-row sm:items-center">
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 text-xs font-bold text-slate-800 shadow-[0_12px_28px_rgba(219,39,119,0.22)] transition-colors hover:bg-pink-600 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600"
                  href="/confier-mon-logement"
                >
                  Parler de mon séminaire
                </Link>
              </div>
            </div>

            <div className="relative z-10 flex flex-col items-start gap-3 pt-8 text-[10px] font-bold uppercase tracking-[0.06em] text-white/70 sm:flex-row sm:items-center sm:gap-7">
              <span className="inline-flex items-center gap-2">
                <MapPin aria-hidden="true" className="h-[17px] w-[17px]" />
                Haute-Savoie
              </span>
              <span className="inline-flex items-center gap-2">
                <Users aria-hidden="true" className="h-[17px] w-[17px]" />
                Équipes à taille humaine
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock aria-hidden="true" className="h-[17px] w-[17px]" />
                Séjour sur mesure
              </span>
            </div>
          </div>
        </section>

        <section
          className={`${marketingContainerClass} pb-9 pt-[76px] sm:pb-12 sm:pt-24`}
          id="accompagnement"
        >
          <div className="mb-[34px] max-w-[760px] sm:mb-12">
            <MarketingEyebrow>L’expérience MyStay</MarketingEyebrow>
            <h2 className="m-0 max-w-[720px] text-[clamp(34px,4vw,40px)] font-bold leading-[1.02] tracking-[-0.05em]">
              Un séminaire fluide, du lieu jusqu’au dernier détail.
            </h2>
            <p className="mt-5 max-w-[660px] text-sm leading-[1.72] text-slate-500">
              Nous réunissons les prestations essentielles dans une proposition claire :
              hébergement, espaces de travail, restauration, activités et déplacements locaux.
              Vous gardez la vision, nous coordonnons le reste.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3.5 min-[761px]:grid-cols-2 min-[1051px]:grid-cols-4">
            {services.map(({ icon: Icon, title, copy }) => (
              <article
                data-testid="seminar-service-card"
                key={title}
                className="relative flex min-h-[220px] flex-col rounded-[24px] bg-[radial-gradient(circle_at_100%_0,rgba(219,39,119,0.055),transparent_34%)] bg-[#f7f6f4] px-6 pb-6 pt-[26px] before:absolute before:left-6 before:top-0 before:h-[3px] before:w-[50px] before:rounded-b-full before:bg-pink-600 min-[761px]:min-h-[240px] min-[1051px]:min-h-[270px]"
              >
                <span className="grid h-[46px] w-[46px] place-items-center rounded-[14px] border border-slate-800/[0.07] bg-white">
                  <Icon aria-hidden="true" className="h-[22px] w-[22px]" strokeWidth={1.7} />
                </span>
                <h3 className="mb-0 mt-auto text-lg font-bold leading-[1.15] tracking-[-0.03em]">
                  {title}
                </h3>
                <p className="mb-0 mt-3.5 text-xs leading-[1.65] text-slate-500">{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          data-testid="seminar-place"
          className="relative mt-9 overflow-hidden bg-[radial-gradient(circle_at_10%_105%,rgba(219,39,119,0.14),transparent_31%)] bg-slate-800 py-12 text-white min-[761px]:mt-10 min-[761px]:py-[58px] min-[1051px]:py-[68px]"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-[-115px] top-[-240px] aspect-square w-[390px] rounded-full border border-white/10"
          />
          <div
            className={`${marketingContainerClass} grid grid-cols-1 items-start gap-7 min-[1051px]:grid-cols-[0.92fr_1.08fr] min-[1051px]:gap-[clamp(48px,6vw,84px)]`}
          >
            <div className="min-[1051px]:sticky min-[1051px]:top-28">
              <MarketingEyebrow light>Le bon cadre</MarketingEyebrow>
              <h2 className="m-0 max-w-[470px] font-serif text-[clamp(34px,10.5vw,40px)] font-normal leading-[1.08] tracking-[-0.035em] min-[761px]:text-[clamp(34px,4vw,40px)]">
                Le lieu ne doit pas seulement accueillir.
                <em className="mt-2 block font-normal not-italic text-pink-300">
                  Il doit donner envie de se retrouver.
                </em>
              </h2>
              <p className="mt-5 max-w-[470px] text-[13px] leading-[1.72] text-slate-300 min-[761px]:mt-6 min-[761px]:text-sm">
                Un séminaire résidentiel fonctionne lorsque le cadre simplifie tout : travailler,
                partager, respirer et rester ensemble sans perdre de temps dans la logistique.
              </p>
            </div>

            <div className="min-w-0">
              <ol className="m-0 list-none border-t border-white/15 p-0">
                {placePrinciples.map(principle => (
                  <li
                    className="grid grid-cols-[40px_1fr] gap-3 border-b border-white/15 py-5 min-[761px]:grid-cols-[54px_1fr] min-[761px]:gap-[18px] min-[761px]:py-[22px]"
                    key={principle.number}
                  >
                    <span className="pt-1 text-xs font-extrabold tracking-[0.12em] text-pink-400">
                      {principle.number}
                    </span>
                    <div>
                      <h3 className="m-0 text-[17px] font-medium tracking-[-0.025em] text-white min-[761px]:text-[19px]">
                        {principle.title}
                      </h3>
                      <p className="mb-0 mt-2.5 max-w-[590px] text-[13px] leading-[1.7] text-slate-400">
                        {principle.copy}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <Link
                className="mt-6 inline-flex min-h-11 items-center justify-center gap-4 rounded-full bg-white px-5 text-xs font-bold text-slate-800"
                href="/logements"
              >
                Découvrir nos logements
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className={`${marketingContainerClass} pb-[54px] pt-[82px] sm:pb-[72px] sm:pt-24`}>
          <div className="mb-12 max-w-[760px]">
            <MarketingEyebrow>À chaque équipe son format</MarketingEyebrow>
            <h2 className="m-0 max-w-[720px] text-[clamp(34px,4vw,40px)] font-bold leading-[1.02] tracking-[-0.05em]">
              Des temps de travail qui laissent aussi place au collectif.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 min-[761px]:grid-cols-3">
            {formats.map(format => (
              <article
                key={format.title}
                className="relative flex min-h-[188px] flex-col justify-center rounded-[24px] bg-[radial-gradient(circle_at_100%_0,rgba(219,39,119,0.055),transparent_34%)] bg-[#f7f6f4] px-7 py-[30px] before:absolute before:left-7 before:top-0 before:h-[3px] before:w-[50px] before:rounded-b-full before:bg-pink-600"
              >
                <h3 className="m-0 text-[22px] font-bold tracking-[-0.035em]">{format.title}</h3>
                <p className="mb-0 mt-4 text-[13px] leading-[1.65] text-slate-500">{format.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          data-testid="seminar-process"
          className="relative overflow-hidden bg-[radial-gradient(circle_at_92%_112%,rgba(219,39,119,0.12),transparent_29%)] bg-slate-800 py-12 text-white min-[761px]:py-[58px] min-[1051px]:py-[68px]"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-[-110px] top-[-260px] aspect-square w-[360px] rounded-full border border-white/10"
          />
          <div
            className={`${marketingContainerClass} grid grid-cols-1 items-start gap-7 min-[1051px]:grid-cols-[0.92fr_1.08fr] min-[1051px]:gap-[clamp(48px,6vw,84px)]`}
          >
            <div className="min-[1051px]:sticky min-[1051px]:top-28">
              <MarketingEyebrow light>Une organisation simple</MarketingEyebrow>
              <h2 className="m-0 max-w-[470px] font-serif text-[clamp(34px,10.5vw,40px)] font-normal leading-[1.08] tracking-[-0.035em] min-[761px]:text-[clamp(34px,4vw,40px)]">
                Un seul interlocuteur.
                <em className="mt-2 block font-normal not-italic text-pink-300">
                  Quatre étapes, aucun flou.
                </em>
              </h2>
              <p className="mt-5 max-w-[470px] text-[13px] leading-[1.72] text-slate-300 min-[761px]:mt-6 min-[761px]:text-sm">
                Une méthode lisible pour avancer rapidement et rester concentré sur les objectifs
                de votre équipe. MyStay coordonne le lieu, les partenaires et le déroulé du séjour.
              </p>
            </div>

            <ol className="m-0 list-none border-t border-white/15 p-0">
              {steps.map(step => (
                <li
                  className="grid grid-cols-[40px_1fr] gap-3 border-b border-white/15 py-5 min-[761px]:grid-cols-[54px_1fr] min-[761px]:gap-[18px] min-[761px]:py-[22px]"
                  key={step.number}
                >
                  <span className="pt-1 text-xs font-extrabold tracking-[0.12em] text-pink-400">
                    {step.number}
                  </span>
                  <div>
                    <h3 className="m-0 text-[17px] font-medium tracking-[-0.025em] text-white min-[761px]:text-[19px]">
                      {step.title}
                    </h3>
                    <p className="mb-0 mt-2.5 max-w-[590px] text-[13px] leading-[1.7] text-slate-400">
                      {step.copy}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          className={`${marketingContainerClass} mb-6 mt-[68px] grid grid-cols-1 items-center gap-[30px] rounded-[26px] bg-[radial-gradient(circle_at_0_0,rgba(219,39,119,0.12),transparent_34%)] bg-slate-800 px-7 py-[38px] text-white min-[761px]:mt-[86px] min-[761px]:grid-cols-[1.1fr_0.9fr] min-[761px]:gap-[54px] min-[761px]:rounded-[28px] min-[761px]:px-[54px] min-[761px]:py-[52px]`}
          id="projet"
        >
          <div>
            <MarketingEyebrow light>Votre prochain séminaire</MarketingEyebrow>
            <h2 className="m-0 text-[clamp(34px,4vw,40px)] font-bold leading-[1.02] tracking-[-0.05em]">
              Un lieu inspirant.
              <br />
              Une organisation sereine.
            </h2>
          </div>
          <div>
            <p className="mb-[22px] mt-0 text-[13px] leading-[1.7] text-slate-300">
              Parlez-nous de votre équipe, de vos dates et de vos envies. Nous préparerons une
              première proposition adaptée à votre projet.
            </p>
            <a
              className={`${marketingPrimaryButtonClass} gap-4`}
              href={contactHref}
            >
              Échanger sur mon projet
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </a>
          </div>
        </section>
      </div>
    </MarketingShell>
  )
}
