import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check, Heart, Home, QrCode } from 'lucide-react'
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
  title: 'Notre approche',
  description: 'Une conciergerie humaine en Haute-Savoie, prolongée par le guide digital MyStay.',
  alternates: { canonical: '/concept' },
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
  ['01', 'Le logement', 'Nous préparons le logement', 'Présentation, informations pratiques et organisation opérationnelle sont réunies avant la première arrivée.'],
  ['02', 'Le séjour', 'Nous accueillons les voyageurs', 'Notre équipe accompagne chaque séjour et reste l’interlocuteur des voyageurs, de la réservation au départ.'],
  ['03', 'Le guide MyStay', 'Le guide prend le relais', 'Accès, réponses et recommandations restent disponibles à tout moment sur smartphone, sans compte à créer.'],
] as const

const benefits = [
  {
    audience: 'Pour les propriétaires',
    title: 'Plus de sérénité au quotidien.',
    items: [
      'Un interlocuteur pour coordonner le logement',
      'Une expérience d’accueil professionnelle',
      'Un suivi entre chaque séjour',
      'Un bien mieux présenté et valorisé',
    ],
  },
  {
    audience: 'Pour les voyageurs',
    title: 'Plus de liberté pendant le séjour.',
    items: [
      'Une équipe disponible et identifiable',
      'Toutes les informations immédiatement disponibles',
      'Aucun téléchargement obligatoire',
      'Des recommandations locales sélectionnées',
    ],
  },
] as const

export default function ConceptPage() {
  return (
    <MarketingShell>
      <section className="bg-white py-16 sm:py-24">
        <div className={`${marketingContainerClass} grid items-center gap-14 lg:grid-cols-2`}>
          <div className="md:flex md:flex-col md:items-center md:text-center lg:block lg:text-left">
            <MarketingEyebrow>Notre approche</MarketingEyebrow>
            {/* Titre — mobile + desktop */}
            <h1 className="text-6xl font-bold leading-[1.03] tracking-[-0.055em] text-slate-900 md:hidden lg:block">
              Une conciergerie,
              <span className="block text-[50px] font-normal leading-[1.2] text-slate-400">prolongée par </span>
              <span className="block font-bold text-[55px] leading-[1.2]  text-slate-900">le digital.</span>
            </h1>

            {/* Titre — iPad uniquement */}
            <h1 className="hidden text-6xl font-bold leading-[1.12] tracking-[-0.055em] text-slate-900 md:block lg:hidden">
              Une conciergerie<br />
               <span className="font-normal text-slate-400">prolongée<br />par le</span> digital.
            </h1>
            <p className="mt-10 sm:mt-7 max-w-xl text-sm leading-8 text-slate-500 p-6 sm:p-0">
              Nous prenons en charge la gestion du logement et l’accueil des voyageurs. Notre guide
              digital complète cette présence avec les bonnes informations, disponibles au bon moment.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/confier-mon-logement" className={marketingPrimaryButtonClass}>
                Confier mon logement
              </Link>
              <GuideDemoLauncher
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-pink-600 shadow-[0_6px_16px_rgba(15,23,42,0.05)] transition-colors hover:border-pink-300 hover:text-pink-700"
                label=""
                ariaLabel="Voir le guide voyageur"
              />
            </div>
          </div>

          <div className="relative mx-auto hidden min-h-[470px] w-full max-w-[500px] items-center justify-center lg:flex">
            <div className="relative z-10 w-[240px] ">
              <Image
                src="/marketing/telephone-demo-trim.png"
                alt="Aperçu du guide MyStay sur smartphone"
                width={598}
                height={1185}
                sizes="240px"
                className="h-auto w-full rounded-[34px] bg-white"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-[34px] border-[6px] border-white shadow-[0_18px_50px_rgba(15,23,42,0.16)]"
              />
            </div>

            <div className="absolute -left-2 top-3 z-20 flex max-w-[220px] items-center gap-3 overflow-hidden rounded-2xl  bg-[#f7f6f4] p-3 pt-3.5 shadow-[0_18px_38px_rgba(15,23,42,0.12)] ">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500">
                <Home aria-hidden="true" className="h-4 w-4" />
              </span>
              <div>
                <small className="block text-[8px] font-extrabold uppercase tracking-[0.16em] text-pink-600">
                  Équipe MyStay
                </small>
                <strong className="block text-[10px] mt-2 leading-tight uppercase text-slate-800 p-1">
                  Prépare et accompagne le séjour
                </strong>
              </div>
            </div>

            <div className="absolute left-3 top-[152px] z-20 flex items-center gap-2">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white p-2 shadow-[0_14px_30px_rgba(15,23,42,0.12)]">
                <QrCode aria-hidden="true" className="h-full w-full text-slate-900" />
              </div>
              <ArrowRight aria-hidden="true" className="h-4 w-4 text-slate-400" />
            </div>

            <div className="absolute -right-2 bottom-6 z-20 flex max-w-[212px] items-center gap-3 overflow-hidden rounded-2xl  bg-[#f7f6f4] p-3 pt-3.5 shadow-[0_18px_38px_rgba(15,23,42,0.12)] ">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500">
                <Heart aria-hidden="true" className="h-4 w-4" />
              </span>
              <div>
                <small className="block text-[8px] font-extrabold uppercase tracking-[0.16em] text-pink-600">
                  Voyageur
                </small>
                 <strong className="block text-[10px] mt-2 leading-tight uppercase text-slate-800 p-1">
                  Profite pleinement du séjour
                </strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={`${marketingContainerClass} grid gap-10 py-16 sm:py-24 lg:grid-cols-[minmax(0,360px)_auto] lg:items-center lg:justify-center lg:gap-24`}>
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <MarketingEyebrow>L’accueil augmenté</MarketingEyebrow>
          <h2 className="mt-2 text-[26px] font-bold leading-tight tracking-[-0.045em] sm:text-[32px] lg:text-5xl">
            Une présence humaine, soutenue par le bon outil.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-slate-500 sm:text-base lg:mx-0 lg:mt-6">
            Notre équipe reste disponible pour les voyageurs. Le guide anticipe les questions
            courantes afin que chacun trouve immédiatement les informations simples.
          </p>
        </div>
        <ol className="mt-2 divide-y divide-slate-100 border-y border-slate-100 lg:mt-0 lg:space-y-6 lg:divide-y-0 lg:border-y-0 lg:border-none">
          {recurringQuestions.map((question, index) => (
            <li
              key={question}
              className="flex items-center gap-4 py-4 text-sm lg:items-start lg:py-0 lg:pt-5"
            >
              <span className="font-bold text-pink-600">{String(index + 1).padStart(2, '0')}</span>
              <p className="font-semibold text-slate-800">{question}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-slate-50 py-20 sm:py-28">
        <div className={marketingContainerClass}>
          <MarketingEyebrow>Notre accompagnement</MarketingEyebrow>
          <h2 className="mx-auto max-w-2xl text-center text-3xl font-bold tracking-[-0.045em] sm:text-5xl">
            Le logement, l’accueil et le digital réunis.
          </h2>
          <ol className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {steps.map(([number, label, copy], index) => (
              <li
                key={number}
                className={`rounded-[24px] bg-white p-6 ${
                  index === steps.length - 1 ? 'col-span-2 sm:col-span-1' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-bold text-slate-300">{number}</span>
                  <small className="text-[10px] font-bold uppercase tracking-widest text-pink-600">{label}</small>
                </div>
            
                <p className="mt-4 text-xs pl-4 tracking-widest leading-6 text-slate-500">{copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-slate-800 py-20 text-white">
          <MarketingEyebrow light>Notre vision</MarketingEyebrow>
        <div className={`${marketingContainerClass} grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16`}>
          <div className="flex flex-col items-center justify-center lg:items-start">
            <blockquote className="mt-6 text-center text-[35px] font-bold leading-tight tracking-[-0.045em] lg:mt-0 lg:text-left lg:text-5xl">
              L’accueil doit rester humain.
              <span className="mx-auto mt-4 block max-w-[350px] text-xl font-normal tracking-normal text-slate-300 lg:mx-0 lg:mt-8 lg:text-3xl">
                Le digital doit simplement le rendre plus fluide.
              </span>
            </blockquote>
          </div>
          <div className="space-y-8 text-sm leading-7 text-slate-300">
            <p className="mx-auto max-w-md px-4 text-center lg:mx-0 lg:px-0 lg:text-left">
              MyStay est d’abord une conciergerie locale. La technologie intervient là où elle est
              vraiment utile : pour anticiper, transmettre les bonnes informations et laisser plus
              de place à la qualité de l’accueil.
            </p>
            {[
              'Une présence locale et identifiable',
              'Des besoins anticipés avec justesse',
              'Chaque logement valorisé durablement',
            ].map((principle, index) => (
              <div
                key={principle}
                className="flex flex-col items-center gap-2 pt-5 lg:flex-row lg:items-start lg:justify-start lg:gap-4"
              >
                <span className="font-bold text-pink-400">0{index + 1}</span>
                <div className="h-[1px] w-8 bg-pink-400 lg:hidden" />
                <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                  <h3 className="font-bold text-white">{principle}</h3>
                  <p>description des principes</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`${marketingContainerClass} py-20 sm:py-28`}>
        <div className="mx-auto max-w-2xl text-center">
          <MarketingEyebrow>Une même exigence</MarketingEyebrow>
          <h2 className="text-3xl font-bold tracking-[-0.045em] sm:text-5xl">
            Une expérience plus sereine des deux côtés.
          </h2>
        </div>
        <div className="mt-12 grid gap-5 grid-cols-2">
          {benefits.map(benefit => (
            <article key={benefit.audience} className="rounded-[24px] bg-slate-50 p-6 ">
              <small className="text-[10px] font-bold uppercase tracking-widest text-pink-600">{benefit.audience}</small>
              <h3 className="mt-5 text-xm font-bold">{benefit.title}</h3>
              <ul className="mt-6 space-y-3 text-sm text-slate-500">
                {benefit.items.map(item => (
                  <li key={item} className="flex items-center gap-3">
                    <Check aria-hidden="true" className="h-4 w-4 text-pink-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className={`${marketingContainerClass} pb-24 pt-4 text-center sm:pb-32`}>
        <div className="flex justify-center">
          <MarketingEyebrow>Votre projet</MarketingEyebrow>
        </div>
        <h2 className="mx-auto mt-6 max-w-4xl font-serif text-[38px] leading-[1.12] tracking-[-0.01em] text-slate-900 sm:text-[54px]">
          Un logement bien géré.
          <span className="mt-1 block italic text-pink-600">Des voyageurs bien accueillis.</span>
        </h2>
        <p className="mx-auto mt-7 max-w-xl text-base leading-8 text-slate-500">
          Parlons de votre bien, de vos priorités et de l’accompagnement adapté pour simplifier sa
          gestion au quotidien.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/confier-mon-logement" className={marketingPrimaryButtonClass}>
            Échanger sur mon projet
          </Link>
          <Link href="/logements" className={outlineButtonClass}>
            Découvrir nos logements <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </MarketingShell>
  )
}
