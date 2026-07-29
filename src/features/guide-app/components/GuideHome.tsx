import Image from 'next/image'
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
      <section className="relative min-h-[300px] overflow-hidden rounded-[30px] bg-slate-900 text-white shadow-[0_18px_44px_rgba(15,23,42,0.18)]">
        <Image
          src={lodging.coverImage}
          alt={lodging.name}
          fill
          priority
          sizes="360px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
        <div className="relative flex min-h-[300px] flex-col justify-end p-6">
          <span className="mb-3 inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-[8px] font-extrabold uppercase tracking-[0.18em] backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-pink-300" />
            Votre séjour MyStay
          </span>
          <h1 className="text-[32px] font-semibold leading-[0.98] tracking-[-0.045em]">
            Bienvenue au {welcomeName}
          </h1>
          <p className="mt-3 text-xs leading-5 text-white/75">{lodging.tagline}</p>
        </div>
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
          <span className="mt-2 text-[40px] font-bold leading-none tracking-tight text-slate-900">{lodging.checkIn}</span>
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
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-pink-600">
              Sélection locale
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em] text-slate-900">
              Nos coups de cœur
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('favorites')}
            className="shrink-0 rounded-full border border-slate-300 px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.1em] text-slate-700"
          >
            Voir +
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
