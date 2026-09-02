import {
  ArrowRight,
  BookOpen,
  Heart,
  LocateFixed,
  Video,
} from 'lucide-react'
import type { DemoGuideView } from '@/features/guide-demo/types'
import { formatFrenchWelcomeLine } from '@/shared/lib/french-place'

type DemoHomeViewProps = {
  favoriteCount: number
  lodgingCity: string
  lodgingName: string
  onNavigate: (view: DemoGuideView) => void
}

export function DemoHomeView({
  favoriteCount,
  lodgingCity,
  lodgingName,
  onNavigate,
}: DemoHomeViewProps) {
  const cityLabel = lodgingCity.replace(/-les-bains$/i, '')
  const welcomeTitle = formatFrenchWelcomeLine(lodgingName)
  const welcomePlace = welcomeTitle.replace(/^Bienvenue\s+/i, '')

  return (
    <div className="flex min-h-full flex-col gap-4 bg-gradient-to-b from-blue-50/70 via-white to-white px-4 pb-36 pt-6">
      <div className="flex flex-1 flex-col items-center justify-center gap-5 py-4">
        <span className="rounded-full bg-blue-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-blue-800">
          Logement fictif · démonstration
        </span>
        <h1
          data-demo-view-heading="true"
          tabIndex={-1}
          className="text-center text-[40px] font-bold leading-[0.98] tracking-[-0.045em] text-slate-900"
        >
          <span className="block">Bienvenue</span>
          <span className="block">{welcomePlace}</span>
        </h1>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-3">
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="flex w-full cursor-not-allowed items-center justify-between rounded-[22px] bg-slate-900 px-5 py-4 text-left text-white opacity-90"
        >
          <span className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-violet-600">
              <Video className="h-4 w-4" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold">
                Voir la vidéo du logement
              </span>
              <span className="mt-0.5 block text-[10px] text-white/60">
                Vidéo indisponible dans cette démonstration
              </span>
            </span>
          </span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate('lodging')}
          className="flex w-full items-center justify-between rounded-[22px] bg-slate-900 px-5 py-4 text-left text-white"
        >
          <span className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-blue-600">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold">
                Découvrir le livret d’accueil
              </span>
              <span className="mt-0.5 block text-[10px] text-white/60">
                Toutes les choses à connaître sur {lodgingName}
              </span>
            </span>
          </span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate('favorites')}
          className="flex w-full items-center justify-between rounded-[22px] bg-slate-900 px-5 py-4 text-left text-white"
        >
          <span className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-pink-600">
              <Heart className="h-4 w-4" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold">
                Explorer {cityLabel}
              </span>
              <span className="mt-0.5 block text-[10px] text-white/60">
                {favoriteCount} adresses sélectionnées
              </span>
            </span>
          </span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          disabled
          aria-disabled="true"
          aria-label="Activer mon GPS — désactivé dans la démonstration"
          className="flex w-full cursor-not-allowed items-center justify-between rounded-[22px] bg-slate-900 px-5 py-4 text-left text-white opacity-90"
        >
          <span className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-600">
              <LocateFixed className="h-4 w-4" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold">
                Activer mon GPS
              </span>
              <span className="mt-0.5 block text-[10px] text-white/60">
                GPS désactivé dans la démonstration publique
              </span>
            </span>
          </span>
          <span className="h-3.5 w-3.5 rounded-full bg-emerald-500" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
