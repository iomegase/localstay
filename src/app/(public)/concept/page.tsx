import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  Check,
  Heart,
  Home,
  QrCode,
} from 'lucide-react'

import { GuideDemoLauncher } from '@/features/guide-demo/components/GuideDemoLauncher'
import {
  MarketingEyebrow,
  MarketingShell,
  marketingContainerClass,
  marketingPrimaryButtonClass,
} from '@/features/marketing/components/MarketingShell'

const outlineButtonClass =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-xs font-bold text-slate-900 shadow-[0_6px_16px_rgba(15,23,42,0.05)] transition-colors hover:border-slate-300'

export const metadata: Metadata = {
  title: 'Conciergerie humaine & guide digital en Haute-Savoie | MyStay',
  description:
    'Découvrez l’approche MyStay : une conciergerie locale à Saint-Gervais-les-Bains, prolongée par un guide digital pour simplifier l’accueil et le séjour des voyageurs.',
  alternates: {
    canonical: '/concept',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    title: 'Conciergerie humaine & guide digital en Haute-Savoie | MyStay',
    description:
      'Présence locale, accueil voyageurs et guide digital : découvrez comment MyStay accompagne propriétaires et voyageurs dans le Pays du Mont-Blanc.',
    url: '/concept',
  },
}

const recurringQuestions = [
  'Comment accéder au logement ?',
  'Où se garer ?',
  'Quel est le code Wi-Fi ?',
  'Comment utiliser les équipements ?',
  'Que faire dans les environs ?',
  'Quelles sont les consignes de départ ?',
] as const

const steps = [
  {
    number: '01',
    label: 'Avant le séjour',
    title: 'Nous préparons le logement',
    copy:
      'Le logement est préparé, contrôlé et organisé avant l’arrivée. Les informations utiles sont réunies pour éviter les imprévus.',
  },
  {
    number: '02',
    label: 'Pendant le séjour',
    title: 'Nous accompagnons les voyageurs',
    copy:
      'Notre équipe reste l’interlocuteur des voyageurs pour les questions, les besoins particuliers et les situations qui nécessitent une présence humaine.',
  },
  {
    number: '03',
    label: 'À tout moment',
    title: 'Le guide MyStay prend le relais',
    copy:
      'Accès, équipements, consignes et recommandations locales restent disponibles sur smartphone depuis un lien personnel ou un QR code.',
  },
] as const

const principles = [
  {
    number: '01',
    title: 'Une présence locale et identifiable',
    copy:
      'MyStay reste avant tout une conciergerie locale. Le propriétaire comme le voyageur disposent d’un interlocuteur capable d’intervenir lorsque la situation le nécessite.',
  },
  {
    number: '02',
    title: 'Les bonnes informations au bon moment',
    copy:
      'Les questions simples n’ont pas besoin d’attendre une réponse. Accès, Wi-Fi, équipements, stationnement ou consignes restent disponibles directement dans le guide du logement.',
  },
  {
    number: '03',
    title: 'Un logement suivi dans la durée',
    copy:
      'Chaque séjour permet aussi de mieux connaître le logement, ses équipements et ses besoins. Ce suivi régulier contribue à préserver le bien et à améliorer l’expérience des voyageurs.',
  },
] as const

const benefits = [
  {
    audience: 'Pour les propriétaires',
    title: 'Une gestion plus sereine.',
    items: [
      'Un interlocuteur local pour coordonner le logement',
      'Une préparation suivie entre les séjours',
      'Moins de sollicitations répétitives',
      'Une expérience voyageurs plus cohérente',
    ],
  },
  {
    audience: 'Pour les voyageurs',
    title: 'Un séjour plus simple.',
    items: [
      'Une équipe disponible et identifiable',
      'Les informations du logement toujours accessibles',
      'Aucune application obligatoire',
      'Des recommandations adaptées au lieu de séjour',
    ],
  },
] as const

export default function ConceptPage() {
  return (
    <MarketingShell>
      {/* ======================================================
          HERO
      ====================================================== */}
      <section className="bg-white py-16 sm:py-24">
        <div
          className={`
            ${marketingContainerClass}
            grid items-center gap-14
            lg:grid-cols-2
          `}
        >
          <div className="md:flex md:flex-col md:items-center md:text-center lg:block lg:text-left">
            <MarketingEyebrow>Notre approche</MarketingEyebrow>

            <h1 className="text-6xl font-bold leading-[1.03] tracking-[-0.055em] text-slate-900 md:hidden lg:block">
              Une conciergerie,

              <span className="block text-[50px] font-normal leading-[1.2] text-slate-400">
                prolongée par
              </span>

              <span className="block text-[55px] font-bold leading-[1.2] text-slate-900">
                le digital.
              </span>
            </h1>

            <h1 className="hidden text-6xl font-bold leading-[1.12] tracking-[-0.055em] text-slate-900 md:block lg:hidden">
              Une conciergerie
              <br />

              <span className="font-normal text-slate-400">
                prolongée
                <br />
                par le
              </span>{' '}
              digital.
            </h1>

            <p className="mt-10 max-w-xl p-6 text-sm leading-8 text-slate-500 sm:mt-7 sm:p-0">
              MyStay accompagne les propriétaires et leurs voyageurs à
              Saint-Gervais-les-Bains et dans le Pays du Mont-Blanc.

              Notre guide digital complète cette présence locale en regroupant
              les informations essentielles du logement et les recommandations
              utiles au séjour.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/confier-mon-logement"
                className={marketingPrimaryButtonClass}
              >
                Confier mon logement
              </Link>

              <GuideDemoLauncher
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-pink-600 shadow-[0_6px_16px_rgba(15,23,42,0.05)] transition-colors hover:border-pink-300 hover:text-pink-700"
                label=""
                ariaLabel="Voir la démonstration du guide MyStay"
              />
            </div>
          </div>

          {/* VISUEL TÉLÉPHONE */}
          <div className="relative mx-auto hidden min-h-[470px] w-full max-w-[500px] items-center justify-center lg:flex">
            <div className="relative z-10 w-[240px]">
              <Image
                src="/marketing/telephone-demo-trim.png"
                alt="Guide digital MyStay affiché sur un smartphone"
                width={598}
                height={1185}
                sizes="240px"
                className="h-auto w-full rounded-[34px] bg-white"
                priority
              />

              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-[34px] border-[6px] border-white shadow-[0_18px_50px_rgba(15,23,42,0.16)]"
              />
            </div>

            <div className="absolute -left-2 top-3 z-20 flex max-w-[220px] items-center gap-3 overflow-hidden rounded-2xl bg-[#f7f6f4] p-3 pt-3.5 shadow-[0_18px_38px_rgba(15,23,42,0.12)]">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500">
                <Home aria-hidden="true" className="h-4 w-4" />
              </span>

              <div>
                <small className="block text-[8px] font-extrabold uppercase tracking-[0.16em] text-pink-600">
                  Équipe MyStay
                </small>

                <strong className="mt-2 block p-1 text-[10px] uppercase leading-tight text-slate-800">
                  Prépare et accompagne le séjour
                </strong>
              </div>
            </div>

            <div className="absolute left-3 top-[152px] z-20 flex items-center gap-2">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white p-2 shadow-[0_14px_30px_rgba(15,23,42,0.12)]">
                <QrCode
                  aria-hidden="true"
                  className="h-full w-full text-slate-900"
                />
              </div>

              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 text-slate-400"
              />
            </div>

            <div className="absolute -right-2 bottom-6 z-20 flex max-w-[212px] items-center gap-3 overflow-hidden rounded-2xl bg-[#f7f6f4] p-3 pt-3.5 shadow-[0_18px_38px_rgba(15,23,42,0.12)]">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500">
                <Heart aria-hidden="true" className="h-4 w-4" />
              </span>

              <div>
                <small className="block text-[8px] font-extrabold uppercase tracking-[0.16em] text-pink-600">
                  Voyageur
                </small>

                <strong className="mt-2 block p-1 text-[10px] uppercase leading-tight text-slate-800">
                  Profite pleinement du séjour
                </strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          POURQUOI LE GUIDE EXISTE
      ====================================================== */}
      <section
        className={`
          ${marketingContainerClass}
          grid gap-10 py-16
          sm:py-24
          lg:grid-cols-[minmax(0,360px)_auto]
          lg:items-center
          lg:justify-center
          lg:gap-24
        `}
      >
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <MarketingEyebrow>L’accueil augmenté</MarketingEyebrow>

          <h2 className="mt-2 text-[26px] font-bold leading-tight tracking-[-0.045em] sm:text-[32px] lg:text-[42px]">
            Le digital répond aux questions simples.
            <span className="block text-slate-400">
              Notre équipe reste disponible pour le reste.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-slate-500 sm:text-base lg:mx-0 lg:mt-7">
            Une grande partie des questions posées pendant un séjour concerne
            des informations déjà connues. Le guide MyStay permet de les
            retrouver immédiatement, sans remplacer le contact humain lorsque
            celui-ci est réellement nécessaire.
          </p>
        </div>

        <ol className="mt-2 divide-y divide-slate-100 border-y border-slate-100 lg:mt-0 lg:space-y-6 lg:divide-y-0 lg:border-y-0">
          {recurringQuestions.map((question, index) => (
            <li
              key={question}
              className="flex items-center gap-4 py-4 text-sm lg:items-start lg:py-0 lg:pt-5"
            >
              <span className="font-bold text-pink-600">
                {String(index + 1).padStart(2, '0')}
              </span>

              <p className="font-semibold text-slate-800">
                {question}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* ======================================================
          AVANT / PENDANT / DIGITAL
      ====================================================== */}
      <section className="bg-slate-50 py-20 sm:py-28">
        <div className={marketingContainerClass}>
          <div className="mx-auto max-w-2xl text-center">
            <MarketingEyebrow>
              Notre accompagnement
            </MarketingEyebrow>

            <h2 className="text-3xl font-bold tracking-[-0.045em] sm:text-5xl">
              Le logement, l’accueil et le digital réunis.
            </h2>

            <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-slate-500">
              Trois dimensions complémentaires pour préparer le logement,
              accompagner les voyageurs et rendre les informations accessibles
              pendant tout le séjour.
            </p>
          </div>

          <ol className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {steps.map((step) => (
              <li
                key={step.number}
                className="relative overflow-hidden rounded-[24px] bg-white p-6"
              >
                {/* <span
                  aria-hidden="true"
                  className="absolute -bottom-5 -right-2 text-[100px] font-bold leading-none tracking-[-0.09em] text-slate-900/[0.025]"
                >
                  {step.number}
                </span> */}

                <div className="relative z-10">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl font-bold text-slate-300">
                      {step.number}
                    </span>

                    <small className="text-[10px] font-bold uppercase tracking-widest text-pink-600">
                      {step.label}
                    </small>
                  </div>

                  <h3 className="mt-6 text-[17px] font-bold tracking-[-0.03em] text-slate-900">
                    {step.title}
                  </h3>

                  <p className="mt-4 text-[12.5px] leading-6 text-slate-500">
                    {step.copy}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ======================================================
          VISION
      ====================================================== */}
      <section className="bg-slate-800 py-20 text-white sm:py-28">
        <div className={marketingContainerClass}>
          <MarketingEyebrow light>Notre vision</MarketingEyebrow>

          <div className="mt-8 grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
            <div>
              <blockquote className="text-center text-[35px] font-bold leading-tight tracking-[-0.045em] lg:text-left lg:text-5xl">
                L’accueil doit rester humain.

                <span className="mx-auto mt-5 block max-w-[410px] text-xl font-normal tracking-normal text-slate-300 lg:mx-0 lg:mt-8 lg:text-3xl">
                  Le digital doit simplement le rendre plus fluide.
                </span>
              </blockquote>

              <p className="mx-auto mt-8 max-w-md text-center text-sm leading-7 text-slate-300 lg:mx-0 lg:text-left">
                MyStay est d’abord une conciergerie locale. La technologie
                intervient uniquement là où elle apporte une amélioration
                concrète : transmettre une information, anticiper une question
                ou faciliter le séjour.
              </p>
            </div>

            <div className="space-y-4">
              {principles.map((principle) => (
                <article
                  key={principle.number}
                  className="rounded-[22px] bg-white/[0.05] p-6"
                >
                  <div className="flex gap-4">
                    <span className="shrink-0 text-xs font-bold text-pink-400">
                      {principle.number}
                    </span>

                    <div>
                      <h3 className="font-bold text-white">
                        {principle.title}
                      </h3>

                      <p className="mt-3 text-[13px] leading-7 text-slate-300">
                        {principle.copy}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          BÉNÉFICES
      ====================================================== */}
      <section
        className={`${marketingContainerClass} py-20 sm:py-28`}
      >
        <div className="mx-auto max-w-2xl text-center">
          <MarketingEyebrow>
            Une même exigence
          </MarketingEyebrow>

          <h2 className="text-3xl font-bold tracking-[-0.045em] sm:text-5xl">
            Une expérience plus sereine des deux côtés.
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-slate-500">
            Le propriétaire conserve un logement suivi. Le voyageur dispose
            des informations dont il a besoin sans perdre le contact avec
            l’équipe locale.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {benefits.map((benefit) => (
            <article
              key={benefit.audience}
              className="rounded-[24px] bg-slate-50 p-6 sm:p-8"
            >
              <small className="text-[10px] font-bold uppercase tracking-widest text-pink-600">
                {benefit.audience}
              </small>

              <h3 className="mt-5 text-xl font-bold tracking-[-0.03em] text-slate-900">
                {benefit.title}
              </h3>

              <ul className="mt-6 space-y-4 text-sm text-slate-500">
                {benefit.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3"
                  >
                    <Check
                      aria-hidden="true"
                      className="mt-0.5 h-4 w-4 shrink-0 text-pink-600"
                    />

                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* ======================================================
          CTA
      ====================================================== */}
      <section
        className={`${marketingContainerClass} pb-24 pt-4 text-center sm:pb-32`}
      >
        <div className="flex justify-center">
          <MarketingEyebrow>
            Votre projet
          </MarketingEyebrow>
        </div>

        <h2 className="mx-auto mt-6 max-w-4xl font-serif text-[38px] leading-[1.12] tracking-[-0.01em] text-slate-900 sm:text-[54px]">
          Un logement bien géré.

          <span className="mt-1 block italic text-pink-600">
            Des voyageurs bien accompagnés.
          </span>
        </h2>

        <p className="mx-auto mt-7 max-w-xl text-base leading-8 text-slate-500">
          Parlons de votre logement, de vos priorités et du niveau
          d’accompagnement adapté pour simplifier sa gestion au quotidien.
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link
            href="/confier-mon-logement"
            className={marketingPrimaryButtonClass}
          >
            Échanger sur mon projet
          </Link>

          <Link
            href="/logements"
            className={outlineButtonClass}
          >
            Découvrir nos logements

            <ArrowRight
              aria-hidden="true"
              className="h-4 w-4"
            />
          </Link>
        </div>
      </section>
    </MarketingShell>
  )
}