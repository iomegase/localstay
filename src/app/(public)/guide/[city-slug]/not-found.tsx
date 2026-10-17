import { MapPin } from 'lucide-react'
import { ImmersiveScreen } from '@/shared/components/ImmersiveScreen'
import { STAY_CARD, STAY_PRIMARY_BUTTON } from '@/features/guide-app/components/stay/stay-styles'

/**
 * 404 unique du guide privé (ville, catégorie, fiche, agenda…), qui remplace
 * depuis le 2026-10-05 les deux 404 historiques des specs 001 et 002.
 * Spec 054 AC-07-06 : gabarit du guide du séjour, sans l'ancien menu ni la barre.
 */
export default function GuideNotFound() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#F4F5F7] px-4 py-10">
      <ImmersiveScreen />
      <section className={`${STAY_CARD} w-full max-w-[400px] px-6 py-10 text-center`}>
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-[#DB2777]">
          <MapPin className="h-7 w-7" strokeWidth={1.5} aria-hidden="true" />
        </span>
        <p className="mt-5 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#DB2777]">Erreur 404</p>
        <h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-[-0.03em] text-[#111111]">
          Cette page du guide est introuvable.
        </h1>
        <p className="mx-auto mt-3 max-w-[300px] text-[14px] leading-relaxed text-[#697386]">
          Le lien est peut-être incomplet, ou cette adresse n&apos;est plus proposée dans le guide.
        </p>
        {/* Lien HTML (rechargement complet) : le nouveau guide ne garde jamais l'ancien gabarit. */}
        <a href="/sejour" className={`${STAY_PRIMARY_BUTTON} mt-8 w-full`}>
          Retour au guide
        </a>
      </section>
    </div>
  )
}
