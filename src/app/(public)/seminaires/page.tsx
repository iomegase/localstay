import { listSeminarLodgings } from '@/features/lodging-showcase/queries/seminar-lodgings'
import { SeminarLodgings } from '@/features/lodging-showcase/components/SeminarLodgings'
import Link from 'next/link'
import type { Metadata } from 'next'
import {
  ArrowRight,
  BadgeCheck,
  BedDouble,
  Clock,
  Mountain,
  Presentation,
  Users,
  Utensils,
} from 'lucide-react'
import { SeminarLeadDialog } from '@/features/contact-messages/components/SeminarLeadDialog'
import { MarketingFaqSection } from '@/features/marketing/components/MarketingFaqSection'

import {
  MarketingEyebrow,
  MarketingShell,
  marketingContainerClass,
} from '@/features/marketing/components/MarketingShell'


export const metadata: Metadata = {
  // Le layout racine ajoute « | MyStay » (template) : ne pas le répéter ici.
  title: 'Séminaire d’entreprise en Haute-Savoie, au pied du Mont-Blanc',
  description:
    'Séminaire d’entreprise à Saint-Gervais-les-Bains et dans le Pays du Mont-Blanc : chalet privatisé jusqu’à 26 personnes, espace de réunion, repas, transferts et activités. Proposition sur mesure sous 48 h.',
  alternates: {
    canonical: '/seminaires',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: '/seminaires',
    title: 'Séminaire d’entreprise en Haute-Savoie, au pied du Mont-Blanc | MyStay',
    description:
      'Chalet privatisé jusqu’à 26 personnes, espace de réunion, repas, transferts et activités : MyStay organise votre séminaire dans le Pays du Mont-Blanc.',
  },
}

const services = [
  {
    icon: BedDouble,
    title: 'Un chalet privatisé',
    copy: 'Un lieu rien qu’à vous pour travailler, partager les repas et vivre ensemble, sans dispersion.',
  },
  {
    icon: Presentation,
    title: 'Un espace de réunion sur place',
    copy: 'Plénière, ateliers ou échanges informels, aménagés selon votre format.',
  },
  {
    icon: Utensils,
    title: 'Repas sur mesure',
    copy: 'Petits-déjeuners, pauses, déjeuners et dîner convivial, au rythme de votre programme.',
  },
  {
    icon: Mountain,
    title: 'Activités et transferts',
    copy: 'Randonnée, thermes, ski ou découverte locale, et les navettes qui vont avec.',
  },
] as const

const placePrinciples = [
  {
    number: '01',
    title: 'Tout au même endroit',
    copy: 'Travail, hébergement et moments informels, sans perte de temps entre deux adresses.',
  },
  {
    number: '02',
    title: 'Le bon rythme',
    copy: 'Des temps de concentration, des échanges collectifs et de vraies pauses, dans le même cadre.',
  },
  {
    number: '03',
    title: 'Le recul du Mont-Blanc',
    copy: 'Un décor qui aide à sortir du quotidien et à faire émerger des idées nouvelles.',
  },
] as const

const formats = [
  {
    title: 'Comité de direction',
    copy: 'Un cadre confidentiel pour décider, arbitrer et aligner les priorités.',
  },
  {
    title: 'Séminaire résidentiel',
    copy: 'Deux à trois jours de travail et de vie commune dans un même lieu.',
  },
  {
    title: 'Retraite d’équipe',
    copy: 'Renforcer les liens et réfléchir ensemble, loin du bureau.',
  },
] as const

const steps = [
  {
    number: '01',
    title: 'Votre brief',
    copy: 'Dates, participants, objectifs et budget indicatif.',
  },
  {
    number: '02',
    title: 'Votre proposition sous 48 h',
    copy: 'Lieu, hébergement, repas, espace de travail, activités et devis.',
  },
  {
    number: '03',
    title: 'L’organisation complète',
    copy: 'Nous réservons, coordonnons les prestataires et gérons les imprévus.',
  },
  {
    number: '04',
    title: 'Le jour J',
    copy: 'Votre équipe retrouve programme, accès et recommandations locales dans un guide digital du séjour.',
  },
] as const

const faq = [
  { question: 'Pour combien de personnes pouvez-vous organiser un séminaire ?', answer: 'Jusqu’à 26 personnes réunies dans le Chalet Rémy. Au-delà, nous coordonnons plusieurs hébergements proches avec un programme commun.' },
  { question: 'Dans quel délai recevrai-je une proposition ?', answer: 'Nous vous adressons une proposition détaillée sous 48 h après réception de votre demande.' },
  { question: 'Les repas, transferts et activités sont-ils inclus ?', answer: 'Oui, nous les intégrons au programme selon vos besoins : traiteur ou chef à domicile, navettes, activités d’équipe en montagne.' },
  { question: 'Disposez-vous d’un espace de réunion ?', answer: 'Oui. Le chalet dispose d’un espace de réunion sur place, que nous aménageons selon votre format : plénière, ateliers ou sessions informelles.' },
  { question: 'Quelle est la meilleure saison ?', answer: 'Toute l’année : ski et activités de neige en hiver, randonnée et grand air de mai à octobre, thermes en toute saison.' },
  { question: 'Comment se passe la facturation ?', answer: 'Vous recevez un devis global, puis une facture unique au nom de votre entreprise.' },
] as const

export default async function SeminarsPage() {
  const seminarLodgings = await listSeminarLodgings()
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
                Séminaires d’entreprise · Pays du Mont-Blanc
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
                Votre séminaire{' '}
                <br />

                <em className="font-serif font-normal italic tracking-[-0.035em]">
                  face au Mont-Blanc.
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
                <strong className="block font-semibold text-slate-900">Réunir vos équipes. Prendre de la hauteur.</strong>
                MyStay organise votre séminaire à Saint-Gervais-les-Bains et
                dans le Pays du Mont-Blanc : chalet privatisé, espace de
                réunion, repas, transferts et activités. Un interlocuteur
                dédié, du premier échange au départ du groupe.
              </p>

              <div className="mt-[30px] flex flex-col items-start gap-6 sm:flex-row sm:items-center">
                <SeminarLeadDialog label="Recevoir une proposition" />
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
                <Clock
                  aria-hidden="true"
                  className="h-[17px] w-[17px]"
                />
                Réponse sous 48 h
              </span>

              <span className="inline-flex items-center gap-2">
                <Users
                  aria-hidden="true"
                  className="h-[17px] w-[17px]"
                />
                Jusqu’à 26 personnes en chalet
              </span>

              <span className="inline-flex items-center gap-2">
                <BadgeCheck
                  aria-hidden="true"
                  className="h-[17px] w-[17px]"
                />
                Proposition sur mesure, sans engagement
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
              Tout votre séminaire, organisé en une seule proposition.
            </h2>

            <p className="mt-5 max-w-[660px] text-sm leading-[1.72] text-slate-500">
              Hébergement, espace de travail, restauration, activités et
              déplacements : nous assemblons les prestations dans un programme
              clair et un devis unique. Vous gardez la main sur les objectifs,
              nous gérons l’organisation.
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

        <SeminarLodgings lodgings={seminarLodgings} />

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
                Un lieu qui rassemble,

                <em className="mt-2 block font-normal not-italic text-pink-300">
                  au lieu d’un planning qui disperse.
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
                Travailler, partager les repas et souffler au même endroit : vos
                équipes se concentrent sur l’essentiel, pendant que la
                logistique suit.
              </p>
            </div>

            <div className="min-w-0">
              <ol className="m-0 list-none p-0">
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
                      last:border-b-0

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
              Formats de séminaire
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
              À chaque équipe son format.
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
                Un interlocuteur dédié,

                <em className="mt-2 block font-normal not-italic text-pink-300">
                  quatre étapes claires.
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
                Du brief au jour J, vous savez toujours où en est votre
                séminaire.
              </p>
            </div>

            <ol className="m-0 list-none p-0">
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
                    last:border-b-0

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

        {/* FAQ */}
        <MarketingFaqSection items={faq} title="Vos questions, nos réponses." columns={2} />

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
                Parlons de votre prochain séminaire.
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
                Dates, nombre de participants, objectifs : quelques lignes
                suffisent. Vous recevez une proposition sur mesure sous 48 h.
              </p>

              <SeminarLeadDialog label="Recevoir une proposition" />
            </div>
          </div>
        </section>
      </div>
    </MarketingShell>
  )
}