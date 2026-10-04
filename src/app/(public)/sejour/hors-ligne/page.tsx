import { WifiOff } from 'lucide-react'
import { privatePageMetadata } from '@/features/seo/lib/private-metadata'

export const metadata = privatePageMetadata('Hors-ligne')

/** Spec 059 AC-02-03 : page de secours du service worker. */
export default function GuideOfflinePage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-5 bg-white px-8 text-center text-slate-900">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-800">
        <WifiOff className="h-7 w-7" strokeWidth={1} aria-hidden="true" />
      </span>
      <div>
        <p className="text-xl font-semibold tracking-[-0.025em]">Vous êtes hors-ligne.</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">Les informations de votre logement restent disponibles.</p>
      </div>
      {/* Lien HTML simple : hors-ligne, la navigation complète est servie par le service worker. */}
      <a
        href="/sejour/logement"
        className="min-h-11 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
      >
        Voir mon logement
      </a>
    </main>
  )
}
