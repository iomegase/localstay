import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, Heart, Home, QrCode, Smartphone } from 'lucide-react'
import {
  MarketingEyebrow,
  MarketingShell,
  marketingContainerClass,
  marketingDarkButtonClass,
  marketingPrimaryButtonClass,
} from '@/features/marketing/components/MarketingShell'

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
      <section className="bg-slate-50 py-16 sm:py-24">
        <div className={`${marketingContainerClass} grid items-center gap-12 lg:grid-cols-2`}>
          <div>
            <MarketingEyebrow>Notre approche</MarketingEyebrow>
            <h1 className="text-4xl font-bold leading-[1.03] tracking-[-0.055em] sm:text-6xl">
              Une conciergerie humaine,
              <span className="block font-normal text-slate-500">prolongée par le digital.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-slate-500">
              Nous prenons en charge la gestion du logement et l’accueil des voyageurs. Notre guide
              digital complète cette présence avec les bonnes informations, disponibles au bon moment.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/confier-mon-logement" className={marketingPrimaryButtonClass}>
                Confier mon logement
              </Link>
              <Link
                href="/guide/saint-gervais-les-bains?lodging=dc682b31-d390-4a3b-ae2e-e7342581535f"
                className={marketingDarkButtonClass}
              >
                Voir le guide voyageur
              </Link>
            </div>
          </div>

          <div className="relative min-h-[430px] overflow-hidden rounded-[30px] bg-gradient-to-br from-slate-800 to-[#30253f] p-6 text-white">
            <div className="absolute left-6 top-8 flex items-center gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur">
              <Home aria-hidden="true" className="h-6 w-6 text-pink-400" />
              <div>
                <small className="block text-[9px] uppercase tracking-widest text-slate-300">Équipe MyStay</small>
                <strong className="text-sm">Prépare et accompagne le séjour</strong>
              </div>
            </div>
            <div className="absolute left-8 top-[190px] grid h-20 w-20 place-items-center rounded-2xl bg-white text-slate-800">
              <QrCode aria-hidden="true" className="h-12 w-12" />
            </div>
            <div className="absolute right-8 top-24 w-[180px] rounded-[28px] border-8 border-white bg-white p-4 text-slate-800 shadow-2xl">
              <Smartphone aria-hidden="true" className="h-5 w-5 text-pink-600" />
              <small className="mt-6 block text-[9px] uppercase tracking-widest text-slate-500">Votre séjour</small>
              <strong className="mt-1 block text-xl">Saint-Gervais</strong>
              <div className="mt-5 space-y-2">
                <span className="block h-9 rounded-xl bg-slate-100" />
                <span className="block h-9 rounded-xl bg-slate-100" />
                <span className="block h-9 rounded-xl bg-pink-50" />
              </div>
            </div>
            <div className="absolute bottom-7 left-7 flex items-center gap-3 rounded-2xl bg-white p-4 text-slate-800 shadow-xl">
              <Heart aria-hidden="true" className="h-5 w-5 text-pink-600" />
              <div>
                <small className="block text-[9px] uppercase tracking-widest text-slate-500">Voyageur</small>
                <strong className="text-sm">Profite pleinement du séjour</strong>
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

      <section className={`${marketingContainerClass} pb-20 sm:pb-28`}>
        <div className="rounded-[28px] bg-gradient-to-r from-[#30253f] to-slate-800 p-8 text-white sm:p-12">
          <MarketingEyebrow light>Votre projet</MarketingEyebrow>
          <h2 className="text-4xl font-bold tracking-[-0.05em] sm:text-5xl">
            Un logement bien géré.
            <span className="block font-normal text-slate-300">Des voyageurs bien accueillis.</span>
          </h2>
          <Link href="/confier-mon-logement" className={`${marketingPrimaryButtonClass} mt-8`}>
            Échanger sur mon projet
          </Link>
        </div>
      </section>
    </MarketingShell>
  )
}
