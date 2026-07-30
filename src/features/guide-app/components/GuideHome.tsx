import { ArrowRight, BookOpen, Heart, Sparkles, Wifi } from 'lucide-react'
import { GuideFeaturedPoiCard } from '@/features/guide-app/components/GuideFeaturedPoiCard'
import type {
  GuideLodging,
  GuidePoi,
  GuideView,
} from '@/features/guide-app/types'

export function GuideHome({
  lodging,
  pois,
  onNavigate,
  onSelectPoi,
}: {
  lodging: GuideLodging
  pois: GuidePoi[]
  onNavigate: (view: GuideView) => void
  onSelectPoi: (poi: GuidePoi) => void
}) {
  const featured = pois.filter(poi => poi.recommended).slice(0, 2)
  const welcomeName = lodging.name.replace(/^(le|la|les|l['’])\s*/i, '')

  return (
    <div className="space-y-4 px-3 pb-24 pt-3">
      {/* Hero */}
      <section className="px-1 pt-4">
        <span className="inline-flex w-fit items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-pink-600">
          <Sparkles className="h-4 w-4" />
          Votre séjour à {lodging.city.replace(/-/g, ' ')}
        </span>
        <h1 className="mt-4 text-[40px] font-bold leading-[0.98] tracking-[-0.045em] text-slate-900">
          Bienvenue au {welcomeName}
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-500">{lodging.tagline}</p>
      </section>

      {/* Arrivée / Wi-Fi */}
      <section className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onNavigate('arrival')}
          aria-label={`Arrivée ${lodging.checkIn}`}
          className="flex min-h-[148px] flex-col items-center justify-center rounded-[26px] bg-white text-center shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
        >
          <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Arrivée</span>
          <span className="mt-2 font-[family-name:var(--font-big-shoulders)] text-[48px] font-semibold leading-none tracking-tight text-slate-900">
            {lodging.checkIn}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('practical')}
          aria-label={`Wi-Fi ${lodging.wifiName}`}
          className="flex min-h-[148px] flex-col items-center justify-center rounded-[26px] bg-white text-center shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
        >
          <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Wi-Fi</span>
          <Wifi data-testid="wifi-icon" className="mt-3 h-11 w-11 text-slate-900" strokeWidth={1.6} />
        </button>
      </section>

      {/* Nos coups de cœur */}
      <section className="rounded-[26px] bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[17px] font-bold tracking-[-0.03em] text-slate-900">
            Nos coups de cœur
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('favorites')}
            aria-label="Voir tous les coups de cœur"
            className="shrink-0 text-pink-600 transition-transform hover:scale-110"
          >
            <Heart className="h-6 w-6" strokeWidth={2.2} />
          </button>
        </div>
        <div data-testid="guide-featured-grid" className="mt-4 grid grid-cols-2 gap-3">
          {featured.map(poi => (
            <GuideFeaturedPoiCard key={poi.id} poi={poi} onSelect={onSelectPoi} />
          ))}
        </div>
      </section>

      {/* Explorer la ville */}
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
            <span className="block text-sm font-semibold">Explorer {lodging.city.replace(/-les-bains$/i, '')}</span>
            <span className="mt-0.5 block text-[10px] text-white/60">{pois.length} adresses sélectionnées</span>
          </span>
        </span>
        <ArrowRight className="h-4 w-4" />
      </button>

      {/* Découvrir le livret d'accueil → guide logement */}
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
            <span className="block text-sm font-semibold">Découvrir le livret d&apos;accueil</span>
            <span className="mt-0.5 block text-[10px] text-white/60">Toutes les choses à connaître</span>
          </span>
        </span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}
