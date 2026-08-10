import { ArrowRight, BookOpen, Heart } from 'lucide-react'
import { GuideGpsCard } from '@/features/guide-app/components/GuideGpsCard'
import type {
  GuideLodging,
  GuidePoi,
  GuideView,
} from '@/features/guide-app/types'
import { formatFrenchWelcomeLine } from '@/shared/lib/french-place'

export function GuideHome({
  lodging,
  pois,
  onNavigate,
}: {
  lodging: GuideLodging
  pois: GuidePoi[]
  onNavigate: (view: GuideView) => void
}) {
  const welcomeTitle = formatFrenchWelcomeLine(lodging.name)

  return (
    <div className="flex min-h-full flex-col gap-4 px-4 pb-36 pt-6">
      {/* Conteneur 1 — accueil, centré */}
      <div className="flex flex-1 items-center justify-center">
        <h1 className="text-center text-[40px] font-bold leading-[0.98] tracking-[-0.045em] text-slate-900">
          {welcomeTitle.split(' ').slice(0, 2).join(' ')}
          <br />
          {welcomeTitle.replace(/^Bienvenue\s+/i, '')}
        </h1>
      </div>

      {/* Conteneur 2 — navigation, centré */}
      <div className="flex flex-1 flex-col justify-center gap-3">
        <button
          type="button"
          onClick={() => onNavigate('lodging')}
          className="flex w-full items-center justify-between rounded-[22px] bg-slate-900 px-5 py-4 text-left text-white"
        >
          <span className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-blue-600">
              <BookOpen className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-sm font-semibold">
                Découvrir le livret d&apos;accueil
              </span>
              <span className="mt-0.5 block text-[10px] text-white/60">
                Toutes les choses à connaître
              </span>
            </span>
          </span>
          <ArrowRight className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate('favorites')}
          className="flex w-full items-center justify-between rounded-[22px] bg-slate-900 px-5 py-4 text-left text-white"
        >
          <span className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-pink-600">
              <Heart className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-sm font-semibold">
                Explorer {lodging.city.replace(/-les-bains$/i, '')}
              </span>
              <span className="mt-0.5 block text-[10px] text-white/60">
                {pois.length} adresses sélectionnées
              </span>
            </span>
          </span>
          <ArrowRight className="h-4 w-4" />
        </button>

        <GuideGpsCard />
      </div>
    </div>
  )
}
