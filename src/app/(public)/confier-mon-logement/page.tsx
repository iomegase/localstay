import type { Metadata } from 'next'
import {
  MarketingEyebrow,
  MarketingShell,
} from '@/features/marketing/components/MarketingShell'
import { OwnerLeadForm } from '@/features/contact-messages/components/OwnerLeadForm'

export const metadata: Metadata = {
  title: 'Confier mon logement',
  description: 'Parlez-nous de votre logement en Haute-Savoie et de vos besoins de conciergerie.',
  alternates: { canonical: '/confier-mon-logement' },
}

export default function OwnerContactPage() {
  return (
    <MarketingShell>
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 sm:gap-10 sm:px-8">
          <div>
            <MarketingEyebrow>Votre projet</MarketingEyebrow>
            <h1 className="text-4xl font-bold tracking-[-0.055em] sm:text-6xl">Parlons de votre logement.</h1>
            <p className="mt-6 text-sm leading-7 text-slate-500">
              Quelques informations suffisent pour préparer un premier échange utile et vous
              proposer un accompagnement réellement adapté.
            </p>
          </div>

          <section id="derriere-mystay" aria-labelledby="derriere-mystay-title" className="scroll-mt-28 rounded-[24px] border border-slate-200/70 bg-white/80 p-6 sm:p-8">
            <MarketingEyebrow>Derrière MyStay</MarketingEyebrow>
            <h2 id="derriere-mystay-title" className="text-2xl font-bold leading-tight tracking-[-0.04em] text-slate-800">
              Un accompagnement local, une relation directe.
            </h2>
            <div className="mt-5 space-y-4 text-[14px] leading-7 text-slate-500">
              <p>
                Je suis David Devillers, à l’origine de MyStay. J’accompagne les propriétaires
                dans la gestion de leur logement à Saint-Gervais-les-Bains et à Saint-Nicolas-de-Véroce.
              </p>
              <p>
                MyStay réunit un accompagnement sur place et un guide digital pour aider les
                voyageurs à préparer leur séjour et à découvrir les environs.
              </p>
              <p>
                Dans le Journal, je partage des repères pratiques sur la location saisonnière
                et la vie locale.
              </p>
            </div>
            <p className="mt-6 border-t border-slate-200 pt-5 text-sm font-semibold text-slate-800">
              David Devillers <span className="font-normal text-pink-600">· MyStay</span>
            </p>
          </section>

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

    </MarketingShell>
  )
}
