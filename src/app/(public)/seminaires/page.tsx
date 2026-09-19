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

import { LocalDestinationLinks } from '@/features/local-seo/components/LocalDestinationLinks'
import { listPublishedLocalLandingSummaries } from '@/features/local-seo/queries/landing-pages'

export const metadata: Metadata = {
  title: 'Séminaire d’entreprise en Haute-Savoie | MyStay',
  description:
    'MyStay organise vos séminaires à Saint-Gervais-les-Bains et dans le Pays du Mont-Blanc : hébergement, salles de réunion, repas, transferts, activités et bien-être.',
  alternates: {
    canonical: '/seminaires',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: '/seminaires',
    title: 'Séminaire d’entreprise en Haute-Savoie | MyStay',
    description:
      'Hébergement face au Mont-Blanc, salles de réunion, repas, transferts et activités : MyStay coordonne votre séminaire dans le Pays du Mont-Blanc.',
  },
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
    copy: 'Au cœur du Pays du Mont-Blanc, le décor offre le recul nécessaire pour faire émerger des idées nouvelles.',
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
  'mailto:bonjour@mystay.city?subject=Organisation%20d%27un%20s%C3%A9minaire%20MyStay'

export default async function SeminarsPage() {
  const destinations = (await listPublishedLocalLandingSummaries())
    .filter(destination => destination.publication.seminar)
    .map(destination => destination.city)

  return (
    <MarketingShell>
      <div className="overflow-hidden">
        {/* HERO */}
        <section className={`${marketingContainerClass} pt-0 sm:pt-8`}>
          <div
            data-testid="seminar-hero"
            className="
              relative
              flex
              min-h-[690px]
              flex-col
              overflow-hidden
              rounded-[26px]
              px-7
              pb-8
              pt-12
              text-slate-900

              min-[761px]:min-h-[590px]
              min-[761px]:rounded-[30px]
              min-[761px]:px-[54px]
              min-[761px]:pb-[42px]
              min-[761px]:pt-[58px]
            "
          >
            <div className="relative z-10 my-auto max-w-[650px]">
              <MarketingEyebrow>
                Séminaires en Haute-Savoie
              </MarketingEyebrow>

              <h1
                className="
                  m-0
                  max-w-[640px]
                  text-[clamp(42px,12vw,50px)]
                  font-bold
                  leading-[0.99]
                  tracking-[-0.055em]
                  text-slate-900
                  lg:text-[clamp(42px,4.8vw,50px)]
                "
              >
                Réunir vos équipes.
                <br />

                <em className="font-serif font-normal italic tracking-[-0.035em]">
                  Prendre de la hauteur.
                </em>
              </h1>

              <p
                className="
                  mt-7
                  max-w-[590px]
                  text-sm
                  leading-[1.72]
                  text-slate-600
                  lg:text-[15px]
                "
              >
                MyStay organise des séminaires à Saint-Gervais-les-Bains et
                dans le Pays du Mont-Blanc : hébergement, salles de réunion,
                repas, transferts et temps collectifs. Un seul interlocuteur
                coordonne le séjour, du premier brief au départ de votre équipe.
              </p>

              <div className="mt-[30px] flex flex-col items-start gap-6 sm:flex-row sm:items-center">
                <a
                  className={marketingPrimaryButtonClass}
                  href={contactHref}
                >
                  Parler de mon séminaire
                </a>
              </div>
            </div>

            <div
              data-testid="seminar-hero-facts"
              className="
                relative
                z-10
                flex
                flex-col
                items-start
                gap-3
                pt-8
                text-[10px]
                font-bold
                uppercase
                tracking-[0.06em]
                text-slate-600

                sm:flex-row
                sm:items-center
                sm:gap-7
              "
            >
              <span className="inline-flex items-center gap-2">
                <MapPin
                  aria-hidden="true"
                  className="h-[17px] w-[17px]"
                />
                Haute-Savoie
              </span>

              <span className="inline-flex items-center gap-2">
                <Users
                  aria-hidden="true"
                  className="h-[17px] w-[17px]"
                />
                Équipes à taille humaine
              </span>

              <span className="inline-flex items-center gap-2">
                <Clock
                  aria-hidden="true"
                  className="h-[17px] w-[17px]"
                />
                Séjour sur mesure
              </span>
            </div>
          </div>
        </section>

        {/* SERVICES */}
        <section
          id="accompagnement"
          className={`
            ${marketingContainerClass}
            pb-9
            pt-[76px]
            sm:pb-12
            sm:pt-24
          `}
        >
          <div className="mb-[34px] max-w-[760px] sm:mb-12">
            <MarketingEyebrow>
              L’expérience MyStay
            </MarketingEyebrow>

            <h2
              className="
                m-0
                max-w-[720px]
                text-[clamp(34px,4vw,40px)]
                font-bold
                leading-[1.02]
                tracking-[-0.05em]
              "
            >
              Un séminaire fluide, du lieu jusqu’au dernier détail.
            </h2>

            <p className="mt-5 max-w-[660px] text-sm leading-[1.72] text-slate-500">
              Nous réunissons les prestations essentielles dans une proposition
              claire : hébergement, espaces de travail, restauration, activités
              et déplacements locaux. Vous gardez la vision, nous coordonnons
              le reste.
            </p>
          </div>

          <div
            className="
              grid
              grid-cols-2
              gap-3

              min-[761px]:gap-3.5
              min-[1051px]:grid-cols-4
            "
          >
            {services.map(({ icon: Icon, title, copy }, index) => {
              const isLast = index === services.length - 1
              const isOdd = services.length % 2 !== 0

              return (
                <article
                  data-testid="seminar-service-card"
                  key={title}
                  className={`
                    relative
                    flex
                    min-h-[205px]
                    min-w-0
                    flex-col
                    rounded-[22px]
                    bg-[radial-gradient(circle_at_100%_0,rgba(219,39,119,0.055),transparent_34%)]
                    bg-[#f7f6f4]
                    px-4
                    pb-5
                    pt-[22px]

                    before:absolute
                    before:left-4
                    before:top-0
                    before:h-[3px]
                    before:w-10
                    before:rounded-b-full
                    before:bg-pink-600

                    min-[761px]:min-h-[240px]
                    min-[761px]:px-6
                    min-[761px]:pb-6
                    min-[761px]:pt-[26px]
                    min-[761px]:before:left-6
                    min-[761px]:before:w-[50px]

                    min-[1051px]:min-h-[270px]

                    ${
                      isLast && isOdd
                        ? 'col-span-2 min-[761px]:col-span-1'
                        : ''
                    }
                  `}
                >
                  <span
                    className="
                      grid
                      h-10
                      w-10
                      shrink-0
                      place-items-center
                      rounded-[12px]
                      border
                      border-slate-800/[0.07]
                      bg-white

                      min-[761px]:h-[46px]
                      min-[761px]:w-[46px]
                      min-[761px]:rounded-[14px]
                    "
                  >
                    <Icon
                      aria-hidden="true"
                      className="
                        h-5
                        w-5
                        min-[761px]:h-[22px]
                        min-[761px]:w-[22px]
                      "
                      strokeWidth={1.7}
                    />
                  </span>

                  <h3
                    className="
                      mb-0
                      mt-auto
                      text-[15px]
                      font-bold
                      leading-[1.15]
                      tracking-[-0.03em]
                      min-[761px]:text-lg
                    "
                  >
                    {title}
                  </h3>

                  <p
                    className="
                      mb-0
                      mt-3
                      text-[11.5px]
                      leading-[1.55]
                      text-slate-500

                      min-[761px]:mt-3.5
                      min-[761px]:text-xs
                      min-[761px]:leading-[1.65]
                    "
                  >
                    {copy}
                  </p>
                </article>
              )
            })}
          </div>
        </section>

        {/* PLACE */}
        <section
          data-testid="seminar-place"
          className="
            relative
            mt-9
            overflow-hidden
            bg-[radial-gradient(circle_at_10%_105%,rgba(219,39,119,0.14),transparent_31%)]
            bg-slate-800
            py-12
            text-white

            min-[761px]:mt-10
            min-[761px]:py-[58px]
            min-[1051px]:py-[68px]
          "
        >
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              right-[-115px]
              top-[-240px]
              aspect-square
              w-[390px]
              rounded-full
              border
              border-white/10
            "
          />

          <div
            className={`
              ${marketingContainerClass}
              grid
              grid-cols-1
              items-start
              gap-7

              min-[1051px]:grid-cols-[0.92fr_1.08fr]
              min-[1051px]:gap-[clamp(48px,6vw,84px)]
            `}
          >
            <div className="min-[1051px]:sticky min-[1051px]:top-28">
              <MarketingEyebrow light>
                Le bon cadre
              </MarketingEyebrow>

              <h2
                className="
                  m-0
                  max-w-[470px]
                  font-serif
                  text-[clamp(34px,10.5vw,40px)]
                  font-normal
                  leading-[1.08]
                  tracking-[-0.035em]

                  min-[761px]:text-[clamp(34px,4vw,40px)]
                "
              >
                Le lieu ne doit pas seulement accueillir.

                <em className="mt-2 block font-normal not-italic text-pink-300">
                  Il doit donner envie de se retrouver.
                </em>
              </h2>

              <p
                className="
                  mt-5
                  max-w-[470px]
                  text-[13px]
                  leading-[1.72]
                  text-slate-300

                  min-[761px]:mt-6
                  min-[761px]:text-sm
                "
              >
                Un séminaire résidentiel fonctionne lorsque le cadre simplifie
                tout : travailler, partager, respirer et rester ensemble sans
                perdre de temps dans la logistique.
              </p>
            </div>

            <div className="min-w-0">
              <ol className="m-0 list-none border-t border-white/15 p-0">
                {placePrinciples.map(principle => (
                  <li
                    key={principle.number}
                    className="
                      grid
                      grid-cols-[40px_1fr]
                      gap-3
                      border-b
                      border-white/15
                      py-5

                      min-[761px]:grid-cols-[54px_1fr]
                      min-[761px]:gap-[18px]
                      min-[761px]:py-[22px]
                    "
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
                href="/logements"
                className="
                  mt-6
                  inline-flex
                  min-h-11
                  items-center
                  justify-center
                  gap-4
                  rounded-full
                  bg-white
                  px-5
                  text-xs
                  font-bold
                  text-slate-800
                "
              >
                Découvrir nos logements

                <ArrowRight
                  aria-hidden="true"
                  className="h-4 w-4"
                />
              </Link>
            </div>
          </div>
        </section>

        {/* FORMATS */}
        <section
          className={`
            ${marketingContainerClass}
            pb-[54px]
            pt-[82px]
            sm:pb-[72px]
            sm:pt-24
          `}
        >
          <div className="mb-12 max-w-[760px]">
            <MarketingEyebrow>
              À chaque équipe son format
            </MarketingEyebrow>

            <h2
              className="
                m-0
                max-w-[720px]
                text-[clamp(34px,4vw,40px)]
                font-bold
                leading-[1.02]
                tracking-[-0.05em]
              "
            >
              Des temps de travail qui laissent aussi place au collectif.
            </h2>
          </div>

          <div
            className="
              grid
              grid-cols-2
              gap-3

              min-[761px]:grid-cols-3
              min-[761px]:gap-4
            "
          >
            {formats.map((format, index) => {
              const isLast = index === formats.length - 1
              const isOdd = formats.length % 2 !== 0

              return (
                <article
                  key={format.title}
                  className={`
                    relative
                    flex
                    min-h-[168px]
                    min-w-0
                    flex-col
                    justify-center
                    rounded-[22px]
                    bg-[radial-gradient(circle_at_100%_0,rgba(219,39,119,0.055),transparent_34%)]
                    bg-[#f7f6f4]
                    px-4
                    py-6

                    before:absolute
                    before:left-4
                    before:top-0
                    before:h-[3px]
                    before:w-10
                    before:rounded-b-full
                    before:bg-pink-600

                    min-[761px]:min-h-[188px]
                    min-[761px]:rounded-[24px]
                    min-[761px]:px-7
                    min-[761px]:py-[30px]
                    min-[761px]:before:left-7
                    min-[761px]:before:w-[50px]

                    ${
                      isLast && isOdd
                        ? 'col-span-2 min-[761px]:col-span-1'
                        : ''
                    }
                  `}
                >
                  <h3
                    className="
                      m-0
                      text-[16px]
                      font-bold
                      leading-[1.15]
                      tracking-[-0.035em]

                      min-[761px]:text-[22px]
                    "
                  >
                    {format.title}
                  </h3>

                  <p
                    className="
                      mb-0
                      mt-3
                      text-[11.5px]
                      leading-[1.55]
                      text-slate-500

                      min-[761px]:mt-4
                      min-[761px]:text-[13px]
                      min-[761px]:leading-[1.65]
                    "
                  >
                    {format.copy}
                  </p>
                </article>
              )
            })}
          </div>
        </section>

        {/* PROCESS */}
        <section
          data-testid="seminar-process"
          className="
            relative
            overflow-hidden
            bg-[radial-gradient(circle_at_92%_112%,rgba(219,39,119,0.12),transparent_29%)]
            bg-slate-800
            py-12
            text-white

            min-[761px]:py-[58px]
            min-[1051px]:py-[68px]
          "
        >
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              left-[-110px]
              top-[-260px]
              aspect-square
              w-[360px]
              rounded-full
              border
              border-white/10
            "
          />

          <div
            className={`
              ${marketingContainerClass}
              grid
              grid-cols-1
              items-start
              gap-7

              min-[1051px]:grid-cols-[0.92fr_1.08fr]
              min-[1051px]:gap-[clamp(48px,6vw,84px)]
            `}
          >
            <div className="min-[1051px]:sticky min-[1051px]:top-28">
              <MarketingEyebrow light>
                Une organisation simple
              </MarketingEyebrow>

              <h2
                className="
                  m-0
                  max-w-[470px]
                  font-serif
                  text-[clamp(34px,10.5vw,40px)]
                  font-normal
                  leading-[1.08]
                  tracking-[-0.035em]

                  min-[761px]:text-[clamp(34px,4vw,40px)]
                "
              >
                Un seul interlocuteur.

                <em className="mt-2 block font-normal not-italic text-pink-300">
                  Quatre étapes, aucun flou.
                </em>
              </h2>

              <p
                className="
                  mt-5
                  max-w-[470px]
                  text-[13px]
                  leading-[1.72]
                  text-slate-300

                  min-[761px]:mt-6
                  min-[761px]:text-sm
                "
              >
                Une méthode lisible pour avancer rapidement et rester concentré
                sur les objectifs de votre équipe. MyStay coordonne le lieu,
                les partenaires et le déroulé du séjour.
              </p>
            </div>

            <ol className="m-0 list-none border-t border-white/15 p-0">
              {steps.map(step => (
                <li
                  key={step.number}
                  className="
                    grid
                    grid-cols-[40px_1fr]
                    gap-3
                    border-b
                    border-white/15
                    py-5

                    min-[761px]:grid-cols-[54px_1fr]
                    min-[761px]:gap-[18px]
                    min-[761px]:py-[22px]
                  "
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

        {/* CTA */}
        <section
          id="projet"
          className="
            mb-14
            mt-[68px]

            flex
            min-h-[440px]
            items-center

            bg-[radial-gradient(circle_at_0_0,rgba(219,39,119,0.12),transparent_34%)]
            bg-slate-800
            text-white

            xl:mx-auto
            xl:mb-8
            xl:mt-[86px]
            xl:min-h-0
            xl:w-[calc(100%-40px)]
            xl:max-w-[944px]
            xl:rounded-[28px]
          "
        >
          <div
            className="
              w-full
              px-7
              py-12

              sm:px-10
              lg:px-12

              xl:grid
              xl:grid-cols-[1.1fr_0.9fr]
              xl:items-center
              xl:gap-[54px]
              xl:px-[72px]
              xl:py-[52px]
            "
          >
            <div>
              <MarketingEyebrow light>
                Votre prochain séminaire
              </MarketingEyebrow>

              <h2
                className="
                  m-0
                  max-w-[640px]
                  text-[clamp(34px,8vw,44px)]
                  font-bold
                  leading-[1.02]
                  tracking-[-0.05em]

                  xl:max-w-[480px]
                  xl:text-[40px]
                "
              >
                Un lieu inspirant.
                <br />
                Une organisation sereine.
              </h2>
            </div>

            <div
              className="
                mt-8

                xl:mt-0
                xl:flex
                xl:h-full
                xl:flex-col
                xl:justify-center
              "
            >
              <p
                className="
                  mb-[22px]
                  mt-0
                  max-w-[560px]
                  text-[13px]
                  leading-[1.7]
                  text-slate-300
                "
              >
                Parlez-nous de votre équipe, de vos dates et de vos envies. Nous
                préparerons une première proposition adaptée à votre projet.
              </p>

              <a
                className={`${marketingPrimaryButtonClass} gap-4`}
                href={contactHref}
              >
                Échanger sur mon projet

                <ArrowRight
                  aria-hidden="true"
                  className="h-4 w-4"
                />
              </a>
            </div>
          </div>
        </section>
      </div>

      <div className="bg-slate-50">
        <LocalDestinationLinks
          intent="seminar"
          destinations={destinations}
        />
      </div>
    </MarketingShell>
  )
}