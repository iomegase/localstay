import Image from 'next/image'
import { CalendarDays, Flower2, Gauge, Leaf, Snowflake, Sun, type LucideIcon } from 'lucide-react'
import { SEMINAR_ACTIVITY_CATEGORY_SHORT_LABELS, type PublicSeminarActivity } from '../types'
import { SEASON_LABELS, parseSeasonLabel, type Season } from '../lib/seasons'

// Spec 097 (ajustement PO du 2026-10-14) : une icône et une couleur par saison.
const SEASON_STYLES: Record<Season, { icon: LucideIcon; tone: string }> = {
  winter: { icon: Snowflake, tone: 'bg-sky-50 text-sky-600' },
  spring: { icon: Flower2, tone: 'bg-emerald-50 text-emerald-600' },
  summer: { icon: Sun, tone: 'bg-amber-50 text-amber-500' },
  autumn: { icon: Leaf, tone: 'bg-orange-50 text-orange-600' },
}

/**
 * Spec 097 UI : carte vitrine, cohérente avec la carte compacte de la spec 051.
 * Aucun prix, aucune mention de devis, aucun prestataire, aucun lien ni bouton.
 */
export function SeminarActivityCard({ activity }: { activity: PublicSeminarActivity }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[26px] bg-white shadow-[0_10px_24px_-10px_rgba(15,23,42,0.12)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <Image
          src={activity.image_url}
          alt=""
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col px-5 pb-4 pt-5">
        <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-pink-600">
          {SEMINAR_ACTIVITY_CATEGORY_SHORT_LABELS[activity.category]}
        </p>
        <h3 className="mb-2 mt-2 break-words text-xl font-bold leading-[1.3] tracking-[-0.035em] text-slate-800">{activity.title}</h3>
        <p className="mb-4 hyphens-auto text-justify text-[13px] leading-[1.6] text-slate-500">{activity.description}</p>
        <dl className="mt-auto grid grid-cols-2 border-t border-slate-200 text-slate-800">
          <div className="flex min-w-0 flex-col gap-1.5 py-3 pr-3">
            <dt className="text-[10px] text-slate-500">Saison</dt>
            <SeasonValue label={activity.season_label} />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5 border-l border-slate-200 py-3 pl-4">
            <dt className="text-[10px] text-slate-500">Niveau</dt>
            <dd className="flex items-start gap-1.5 hyphens-auto text-xs font-bold leading-snug">
              <Gauge aria-hidden="true" className="mt-px h-3.5 w-3.5 shrink-0 text-slate-500" strokeWidth={1.8} />
              {activity.level_label}
            </dd>
          </div>
        </dl>
      </div>
    </article>
  )
}

/** Seules les saisons de l'activité, en icônes colorées ; libellé lisible pour les lecteurs d'écran. */
function SeasonValue({ label }: { label: string }) {
  const parsed = parseSeasonLabel(label)
  if (!parsed) {
    return (
      <dd className="flex items-start gap-1.5 hyphens-auto text-xs font-bold leading-snug">
        <CalendarDays aria-hidden="true" className="mt-px h-3.5 w-3.5 shrink-0 text-slate-500" strokeWidth={1.8} />
        {label}
      </dd>
    )
  }
  return (
    <dd className="flex flex-col gap-1">
      <span className="sr-only">{label}</span>
      <span aria-hidden="true" className="flex gap-1">
        {parsed.seasons.map(season => {
          const { icon: Icon, tone } = SEASON_STYLES[season]
          return (
            <span
              key={season}
              title={SEASON_LABELS[season]}
              data-season={season}
              className={`grid h-6 w-6 place-items-center rounded-md ${tone}`}
            >
              <Icon className="h-3 w-3" strokeWidth={1.9} />
            </span>
          )
        })}
      </span>
      {parsed.note && (
        <span aria-hidden="true" className="text-[10px] text-slate-500 first-letter:uppercase">{parsed.note}</span>
      )}
    </dd>
  )
}
