import type { Metadata } from 'next'
import {
  MarketingEyebrow,
  MarketingShell,
  marketingContainerClass,
  marketingPrimaryButtonClass,
} from '@/features/marketing/components/MarketingShell'

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

const fieldClass =
  'mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-pink-600 focus:ring-2 focus:ring-pink-100'
const labelClass = 'text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600'

export default function OwnerContactPage() {
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

            <form
              aria-label="Demande propriétaire"
              action="mailto:bonjour@mystay.city?subject=Demande%20propri%C3%A9taire%20MyStay"
              encType="text/plain"
              method="post"
              className="mt-8"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <label className={labelClass}>
                  Prénom et nom *
                  <input className={fieldClass} autoComplete="name" name="Nom" placeholder="Votre nom" required />
                </label>
                <label className={labelClass}>
                  Adresse e-mail *
                  <input className={fieldClass} autoComplete="email" name="Email" placeholder="vous@exemple.fr" required type="email" />
                </label>
                <label className={labelClass}>
                  Téléphone
                  <input className={fieldClass} autoComplete="tel" name="Téléphone" placeholder="+33 6 00 00 00 00" type="tel" />
                </label>
                <label className={labelClass}>
                  Commune du logement *
                  <input className={fieldClass} autoComplete="address-level2" name="Commune" placeholder="Ex. Saint-Gervais-les-Bains" required />
                </label>
                <label className={labelClass}>
                  Type de logement *
                  <select className={fieldClass} defaultValue="" name="Type de logement" required>
                    <option disabled value="">Sélectionner</option>
                    <option>Appartement</option>
                    <option>Chalet</option>
                    <option>Maison</option>
                    <option>Autre</option>
                  </select>
                </label>
                <label className={labelClass}>
                  Capacité d’accueil
                  <select className={fieldClass} defaultValue="" name="Capacité">
                    <option disabled value="">Sélectionner</option>
                    <option>1 à 4 voyageurs</option>
                    <option>5 à 8 voyageurs</option>
                    <option>9 à 12 voyageurs</option>
                    <option>13 voyageurs et plus</option>
                  </select>
                </label>
              </div>
              <label className={`${labelClass} mt-5 block`}>
                Parlez-nous de votre projet
                <textarea
                  className={`${fieldClass} min-h-[135px] py-3`}
                  name="Message"
                  placeholder="Décrivez brièvement le logement, sa situation actuelle et vos attentes."
                />
              </label>
              <label className="mt-5 flex items-start gap-3 text-xs leading-5 text-slate-500">
                <input className="mt-1 accent-pink-600" name="Consentement" required type="checkbox" value="Oui" />
                J’accepte que MyStay utilise ces informations uniquement pour répondre à ma demande.
              </label>
              <button className={`${marketingPrimaryButtonClass} mt-6`} type="submit">
                Envoyer ma demande
              </button>
              <p className="mt-4 text-[10px] leading-5 text-slate-400">
                Votre messagerie préparera un e-mail adressé à bonjour@mystay.city.
              </p>
            </form>
          </div>
        </div>
      </section>

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
