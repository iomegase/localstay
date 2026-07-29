import Image from 'next/image'
import {
  ArrowRight,
  Clock3,
  Heart,
  KeyRound,
  Sparkles,
} from 'lucide-react'
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
  const featured = pois.filter(poi => poi.recommended).slice(0, 3)
  const welcomeName = lodging.name.replace(/^(le|la|les|l['’])\s*/i, '')

  return (
    <div className="space-y-5 px-3 pb-24 pt-3">
      <section className="relative min-h-[300px] overflow-hidden rounded-[30px] bg-slate-900 text-white shadow-[0_18px_44px_rgba(15,23,42,0.18)]">
        <Image
          src={lodging.coverImage}
          alt={lodging.name}
          fill
          priority
          sizes="360px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-slate-900/10" />
        <div className="relative flex min-h-[300px] flex-col justify-end p-6">
          <span className="mb-3 inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-[8px] font-extrabold uppercase tracking-[0.18em] backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-pink-300" />
            Votre séjour MyStay
          </span>
          <h1 className="text-[32px] font-semibold leading-[0.98] tracking-[-0.045em]">
            Bienvenue au {welcomeName}
          </h1>
          <p className="mt-3 text-xs leading-5 text-white/75">
            {lodging.tagline}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2.5">
        <QuickCard
          icon={Clock3}
          eyebrow="Arrivée"
          title={`Dès ${lodging.checkIn}`}
          onClick={() => onNavigate('arrival')}
        />
        <QuickCard
          icon={KeyRound}
          eyebrow="Wi-Fi"
          title={lodging.wifiName}
          onClick={() => onNavigate('practical')}
        />
      </section>

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
            className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-600"
          >
            Tout voir
          </button>
        </div>
        <div
          data-testid="guide-featured-carousel"
          className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {featured.map(poi => (
            <GuideFeaturedPoiCard
              key={poi.id}
              poi={poi}
              onSelect={onSelectPoi}
            />
          ))}
        </div>
      </section>

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
            <span className="block text-sm font-semibold">Explorer Saint-Gervais</span>
            <span className="mt-0.5 block text-[10px] text-white/60">
              {pois.length} adresses sélectionnées
            </span>
          </span>
        </span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}

function QuickCard({
  icon: Icon,
  eyebrow,
  title,
  onClick,
}: {
  icon: typeof Clock3
  eyebrow: string
  title: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[22px] border border-slate-100 bg-white p-4 text-left shadow-sm"
    >
      <span
        data-testid="quick-card-icon"
        className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-600"
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="mt-4 block text-[8px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
        {eyebrow}
      </span>
      <span className="mt-1 block truncate text-xs font-semibold text-slate-900">
        {title}
      </span>
    </button>
  )
}
