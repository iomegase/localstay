import type { Metadata } from 'next'
import {
  MarketingEyebrow,
  MarketingShell,
  marketingContainerClass,
} from '@/features/marketing/components/MarketingShell'
import { LocalDestinationLinks } from '@/features/local-seo/components/LocalDestinationLinks'
import { listPublishedLocalLandingSummaries } from '@/features/local-seo/queries/landing-pages'
import { OwnerLeadForm } from '@/features/contact-messages/components/OwnerLeadForm'

export const metadata: Metadata = {
  title: 'Confier mon logement',
  description: 'Parlez-nous de votre logement en Haute-Savoie et de vos besoins de conciergerie.',
  alternates: { canonical: '/confier-mon-logement' },
}

const process = [
  ['01', 'Nous découvrons votre logement', 'Nous échangeons sur ses atouts, son environnement et vos objectifs.'],
  ['02', 'Nous définissons vos priorités', 'Niveau de délégation, disponibilité et expérience voyageur : l’accompagnement s’adapte.'],
  ['03', 'Nous organisons la mise en gestion', 'Une proposition claire, un interlocuteur dédié et un lancement coordonné.'],
] as const

export default async function OwnerContactPage() {
  const destinations = (await listPublishedLocalLandingSummaries())
    .filter(destination => destination.publication.concierge)
    .map(destination => destination.city)

  return (
    <MarketingShell>
      <section className="bg-slate-50 py-16 sm:py-24">
        <div className={`${marketingContainerClass} grid gap-12 lg:grid-cols-[0.8fr_1.2fr]`}>
          <div>
            <MarketingEyebrow>Votre projet</MarketingEyebrow>
            <h1 className="text-4xl font-bold tracking-[-0.055em] sm:text-6xl">Parlons de votre logement.</h1>
            <p className="mt-6 text-sm leading-7 text-slate-500">
              Quelques informations suffisent pour préparer un premier échange utile et vous
              proposer un accompagnement réellement adapté.
            </p>
            <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
              {process.map(([number, title, copy]) => (
                <article key={number} className="flex gap-5 py-6">
                  <span className="font-bold text-pink-600">{number}</span>
                  <div>
                    <h2 className="font-bold">{title}</h2>
                    <p className="mt-2 text-xs leading-5 text-slate-500">{copy}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] sm:p-9">
            <span className="text-[10px] font-bold uppercase tracking-widest text-pink-600">
              Demande propriétaire
            </span>
            <h2 className="mt-3 text-2xl font-bold tracking-[-0.04em]">Confier mon logement à MyStay</h2>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Nous vous répondrons personnellement pour organiser un premier échange.
            </p>

            <OwnerLeadForm />
          </div>
        </div>
      </section>

      <LocalDestinationLinks intent="concierge" destinations={destinations} />

      <section className="bg-slate-800 py-10 text-white">
        <div className={`${marketingContainerClass} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
          <span className="text-sm text-slate-300">Vous préférez nous écrire directement ?</span>
          <a className="font-bold hover:text-pink-400" href="mailto:bonjour@mystay.city">
            bonjour@mystay.city ↗
          </a>
        </div>
      </section>
    </MarketingShell>
  )
}
