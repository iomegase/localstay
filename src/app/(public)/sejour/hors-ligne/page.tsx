import { WifiOff } from 'lucide-react'
import { privatePageMetadata } from '@/features/seo/lib/private-metadata'
import { getGuideMessages } from '@/features/guide-i18n/lib/server-locale'

export async function generateMetadata() {
  return privatePageMetadata((await getGuideMessages()).offline.metaTitle)
}

/** Spec 059 AC-02-03 : page de secours du service worker. */
export default async function GuideOfflinePage() {
  const m = await getGuideMessages()
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-5 bg-white px-8 text-center text-slate-900">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-800">
        <WifiOff className="h-7 w-7" strokeWidth={1} aria-hidden="true" />
      </span>
      <div>
        <p className="text-xl font-semibold tracking-[-0.025em]">{m.offline.title}</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{m.offline.body}</p>
      </div>
      {/* Lien HTML simple : hors-ligne, la navigation complète est servie par le service worker. */}
      <a
        href="/sejour/logement"
        className="min-h-11 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
      >
        {m.offline.cta}
      </a>
    </main>
  )
}
