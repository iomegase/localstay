import { Clock, Footprints, Mountain, Route, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import type { TrailDetailData } from '@/features/categories/types'

interface Props {
  trail: TrailDetailData
}

const DIFFICULTY_LABELS: Record<TrailDetailData['difficulty'], string> = {
  easy: 'Facile',
  medium: 'Moyen',
  hard: 'Difficile',
  expert: 'Expert',
  unknown: 'Non précisé',
}

export function TrailDetailBlock({ trail }: Props) {
  const attribution = trail.source_refs.map(source => source.attribution).filter(Boolean).join(' · ')

  return (
    <section className="rounded-[28px] bg-white p-5 shadow-sm border border-charcoal/5" data-testid="trail-detail-block">
      <div className="flex items-center gap-2 text-pink-600">
        <Route className="h-5 w-5" />
        <h2 className="text-sm font-bold uppercase tracking-[0.18em]">Randonnée</h2>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <TrailMetric icon={<Mountain className="h-4 w-4" />} label="Difficulté" value={DIFFICULTY_LABELS[trail.difficulty]} />
        <TrailMetric icon={<Clock className="h-4 w-4" />} label="Durée" value={formatDuration(trail.estimated_duration_min)} />
        <TrailMetric icon={<Footprints className="h-4 w-4" />} label="Distance" value={trail.distance_km ? `${trail.distance_km.toFixed(1)} km` : 'Non précisée'} />
        <TrailMetric icon={<Mountain className="h-4 w-4" />} label="Dénivelé" value={trail.elevation_gain_m ? `${trail.elevation_gain_m} m` : 'Non précisé'} />
      </dl>

      {trail.start_label && (
        <p className="mt-4 text-sm text-charcoal/70">
          <span className="font-semibold text-charcoal">Départ :</span> {trail.start_label}
        </p>
      )}

      <div className="mt-4 flex items-start gap-2 rounded-2xl bg-ivory px-4 py-3 text-xs text-charcoal/60">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-pink-600" />
        <p>
          Source principale : {trail.primary_source_type}
          {attribution ? ` · ${attribution}` : ''}
          {trail.data_quality_status === 'incomplete' ? ' · fiche incomplète validée par un administrateur' : ''}
        </p>
      </div>
    </section>
  )
}

function TrailMetric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-ivory px-3 py-3">
      <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-charcoal/45">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 font-semibold text-charcoal">{value}</dd>
    </div>
  )
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return 'Non précisée'
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  if (hours === 0) return `${remaining} min`
  if (remaining === 0) return `${hours} h`
  return `${hours} h ${remaining}`
}
