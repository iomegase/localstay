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
          <div>
            <MarketingEyebrow>Notre approche</MarketingEyebrow>
            <h1 className="text-4xl font-bold leading-[1.03] tracking-[-0.055em] text-slate-900 sm:text-6xl">
              Une conciergerie humaine,
              <span className="block font-normal text-slate-400">prolongée par le digital.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-slate-500">
              Nous prenons en charge la gestion du logement et l’accueil des voyageurs. Notre guide
              digital complète cette présence avec les bonnes informations, disponibles au bon moment.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/confier-mon-logement" className={marketingPrimaryButtonClass}>
                Confier mon logement
              </Link>
              <GuideDemoLauncher
                className={outlineButtonClass}
                label="Voir le guide voyageur"
                showIcon={false}
              />
            </div>
          </div>

          <div className="relative mx-auto flex min-h-[470px] w-full max-w-[500px] items-center justify-center">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center">
              <span className="absolute h-[440px] w-[440px] rounded-full border border-dashed border-slate-200" />
              <span className="absolute h-[320px] w-[320px] rounded-full border border-dashed border-slate-200/80" />
            </div>

            <Image
              src="/marketing/telephone-demo-trim.png"
              alt="Aperçu du guide MyStay sur smartphone"
              width={598}
              height={1185}
              sizes="240px"
              className="relative z-10 h-auto w-[240px] rounded-[34px] border-[5px] border-white bg-white drop-shadow-[0_34px_60px_rgba(15,23,42,0.22)]"
            />

            <div className="absolute -left-2 top-3 z-20 flex max-w-[220px] items-center gap-3 overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_100%_0,rgba(219,39,119,0.06),transparent_65%)] bg-[#f7f6f4] p-3 pt-3.5 shadow-[0_18px_38px_rgba(15,23,42,0.12)] before:absolute before:left-4 before:top-0 before:h-[3px] before:w-9 before:rounded-b-full before:bg-pink-600">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500">
                <Home aria-hidden="true" className="h-4 w-4" />
              </span>
              <div>
                <small className="block text-[8px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                  Équipe MyStay
                </small>
                <strong className="block text-xs leading-tight text-slate-800">
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

            <div className="absolute -right-2 bottom-6 z-20 flex max-w-[212px] items-center gap-3 overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_100%_0,rgba(219,39,119,0.06),transparent_65%)] bg-[#f7f6f4] p-3 pt-3.5 shadow-[0_18px_38px_rgba(15,23,42,0.12)] before:absolute before:left-4 before:top-0 before:h-[3px] before:w-9 before:rounded-b-full before:bg-pink-600">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500">
                <Heart aria-hidden="true" className="h-4 w-4" />
              </span>
              <div>
                <small className="block text-[8px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                  Voyageur
                </small>
                <strong className="block text-xs leading-tight text-slate-800">
                  Profite pleinement du séjour
                </strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={`${marketingContainerClass} grid gap-12 py-20 sm:py-28 lg:grid-cols-2`}>
        <div>
          <MarketingEyebrow>L’accueil augmenté</MarketingEyebrow>
          <h2 className="text-3xl font-bold leading-tight tracking-[-0.045em] sm:text-5xl">
            Une présence humaine, soutenue par le bon outil.
          </h2>
          <p className="mt-6 text-sm leading-7 text-slate-500">
            Notre équipe reste disponible pour les voyageurs. Le guide anticipe les questions
            courantes afin que chacun trouve immédiatement les informations simples.
          </p>
        </div>
        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {recurringQuestions.map((question, index) => (
            <div key={question} className="flex gap-6 py-5">
              <span className="text-sm font-bold text-pink-600">{String(index + 1).padStart(2, '0')}</span>
              <p className="font-semibold">{question}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 py-20 sm:py-28">
        <div className={marketingContainerClass}>
          <MarketingEyebrow>Notre accompagnement</MarketingEyebrow>
          <h2 className="max-w-2xl text-3xl font-bold tracking-[-0.045em] sm:text-5xl">
            Le logement, l’accueil et le digital réunis.
          </h2>
          <ol className="mt-12 grid gap-4 lg:grid-cols-3">
            {steps.map(([number, label, title, copy]) => (
              <li key={number} className="rounded-[24px] border-t-2 border-pink-600 bg-white p-6">
                <div className="flex items-end justify-between">
                  <span className="text-4xl font-bold text-slate-300">{number}</span>
                  <small className="text-[9px] font-bold uppercase tracking-widest text-pink-600">{label}</small>
                </div>
                <h3 className="mt-10 text-lg font-bold">{title}</h3>
                <p className="mt-4 text-xs leading-6 text-slate-500">{copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-slate-800 py-20 text-white sm:py-28">
        <div className={`${marketingContainerClass} grid gap-12 lg:grid-cols-2`}>
          <div>
            <MarketingEyebrow light>Notre vision</MarketingEyebrow>
            <blockquote className="text-3xl font-bold leading-tight tracking-[-0.045em] sm:text-5xl">
              L’accueil doit rester humain.
              <span className="mt-2 block font-normal text-slate-300">
                Le digital doit simplement le rendre plus fluide.
              </span>
            </blockquote>
          </div>
          <div className="space-y-8 text-sm leading-7 text-slate-300">
            <p>
              MyStay est d’abord une conciergerie locale. La technologie intervient là où elle est
              vraiment utile : pour anticiper, transmettre les bonnes informations et laisser plus
              de place à la qualité de l’accueil.
            </p>
            {[
              'Une présence locale et identifiable',
              'Des besoins anticipés avec justesse',
              'Chaque logement valorisé durablement',
            ].map((principle, index) => (
              <div key={principle} className="flex gap-5 border-t border-slate-700 pt-5">
                <span className="font-bold text-pink-400">0{index + 1}</span>
                <h3 className="font-bold text-white">{principle}</h3>
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
        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          {benefits.map(benefit => (
            <article key={benefit.audience} className="rounded-[26px] bg-slate-50 p-7 sm:p-9">
              <small className="font-bold uppercase tracking-widest text-pink-600">{benefit.audience}</small>
              <h3 className="mt-5 text-2xl font-bold">{benefit.title}</h3>
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
